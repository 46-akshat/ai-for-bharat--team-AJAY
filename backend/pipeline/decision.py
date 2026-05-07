import pandas as pd
import duckdb
import uuid
from sqlalchemy import create_engine, func as sa_func
from sqlalchemy.orm import sessionmaker
import os
import sys
import json
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import models

# Map raw_id prefixes to source department names
DEPT_PREFIX_MAP = {
    "FAC": "factories",
    "SHP": "shops",
    "BES": "bescom"
}

def load_db_session():
    """Load database session. Looks for .env in project root (one level up from pipeline/)."""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(dotenv_path=env_path)
    DB_URL = os.getenv("DATABASE_URL")
    if not DB_URL:
        print("Error: Could not load DATABASE_URL. Check .env file in project root.")
        exit()
    engine = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)
    return Session()

def get_next_ubid(session):
    """Generate next UBID using MAX (not COUNT) to avoid ID reuse after deletions."""
    result = session.query(sa_func.max(models.UBIDRegistry.ubid)).scalar()
    if result is None:
        return "KA-UBID-00001"
    current_max = int(result.split('-')[-1])
    return f"KA-UBID-{(current_max + 1):05d}"

def get_source_dept(raw_id):
    """Convert raw_id prefix to full department name.
    'FAC_a1b2c3' -> 'factories'
    """
    prefix = raw_id.split('_')[0] if '_' in raw_id else ''
    return DEPT_PREFIX_MAP.get(prefix, 'unknown')

def load_scored_pairs():
    """
    Load scored pairs from Parquet pipeline output.

    Anish's scoring.py outputs data/final_ubid_matches.parquet with columns:
        URI_L, URI_R, score

    We need raw_id to write to Supabase, so we join with candidate_sets.parquet
    which contains both 'uri' and 'raw_id' for every record.

    Returns a DataFrame with columns: raw_id_l, raw_id_r, match_probability
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")

    matches_path = os.path.join(data_dir, "final_ubid_matches.parquet")
    records_path = os.path.join(data_dir, "candidate_sets.parquet")

    if not os.path.exists(matches_path):
        print(f"Error: {matches_path} not found. Run scoring.py first!")
        return None

    if not os.path.exists(records_path):
        print(f"Error: {records_path} not found. Run candidate_pairer.py first!")
        return None

    # Use DuckDB to JOIN URI-based scores with the raw_id lookup table
    con = duckdb.connect(database=':memory:')
    matches_path_fwd = matches_path.replace('\\', '/')
    records_path_fwd = records_path.replace('\\', '/')

    df = con.execute(f"""
        SELECT
            r_l.raw_id AS raw_id_l,
            r_r.raw_id AS raw_id_r,
            m.score   AS match_probability
        FROM read_parquet('{matches_path_fwd}') m
        JOIN read_parquet('{records_path_fwd}') r_l ON m.URI_L = r_l.uri
        JOIN read_parquet('{records_path_fwd}') r_r ON m.URI_R = r_r.uri
    """).df()

    print(f"Loaded {len(df)} scored pairs from Parquet pipeline.")
    return df

def run_decision_routing():
    print("Starting Decision Routing (Parquet pipeline)...")

    df = load_scored_pairs()
    if df is None:
        return

    session = load_db_session()

    # 1. Split into 3 buckets by confidence score
    #    >= 0.90  -> Auto-link  (assign UBID automatically)
    #    0.50-0.89 -> Human Review (ambiguous, needs human decision)
    #    < 0.50   -> Reject (discard)
    auto_link_df = df[df['match_probability'] >= 0.90]
    review_df    = df[(df['match_probability'] >= 0.50) & (df['match_probability'] < 0.90)]

    print(f"Found {len(auto_link_df)} pairs for AUTO-LINK (>= 90%)")
    print(f"Found {len(review_df)} pairs for HUMAN REVIEW (50-89%)")
    print(f"Discarded {len(df) - len(auto_link_df) - len(review_df)} pairs below 50%")

    # 2. Build graph of auto-link connections
    #
    # WHY: If A matches B (95%) and B matches C (92%), all three are the same
    # business and should share ONE UBID. We find these groups using BFS on a
    # graph where nodes=raw_ids and edges=high-confidence matches.
    graph = {}
    scores = {}

    for _, row in auto_link_df.iterrows():
        a, b = row['raw_id_l'], row['raw_id_r']
        if a not in graph: graph[a] = set()
        if b not in graph: graph[b] = set()
        graph[a].add(b)
        graph[b].add(a)
        scores[(a, b)] = row['match_probability']
        scores[(b, a)] = row['match_probability']

    # BFS to find connected components (each = one unique business)
    visited = set()
    components = []

    for node in graph:
        if node not in visited:
            component = set()
            queue = [node]
            while queue:
                curr = queue.pop(0)
                if curr not in visited:
                    visited.add(curr)
                    component.add(curr)
                    for neighbor in graph[curr]:
                        if neighbor not in visited:
                            queue.append(neighbor)
            components.append(component)

    print(f"Identified {len(components)} distinct businesses from auto-links.")

    # 3. Assign one UBID per connected component, write to Supabase
    for component in components:
        comp_list = list(component)

        # Average confidence across all pairs in this group
        total_score = 0
        pair_count  = 0
        for i in range(len(comp_list)):
            for j in range(i + 1, len(comp_list)):
                key = (comp_list[i], comp_list[j])
                if key in scores:
                    total_score += scores[key]
                    pair_count  += 1

        avg_score = total_score / pair_count if pair_count > 0 else 1.0
        ubid = get_next_ubid(session)

        registry_entry = models.UBIDRegistry(
            ubid=ubid,
            status="active",
            confidence_score=round(avg_score, 4)
        )
        session.add(registry_entry)
        session.flush()  # UBID must exist before linkages reference it

        for raw_id in component:
            link = models.RecordUBIDLinkage(
                ubid=ubid,
                raw_id=raw_id,
                source_dept=get_source_dept(raw_id),
                match_score=round(avg_score, 4),
                link_method="auto"
            )
            session.add(link)

    # 4. Send ambiguous pairs to the human review queue
    for _, row in review_df.iterrows():
        a, b = row['raw_id_l'], row['raw_id_r']

        # Deduplicate: skip if pair already in queue (either direction)
        existing = session.query(models.ReviewQueue).filter(
            ((models.ReviewQueue.record_a_id == a) & (models.ReviewQueue.record_b_id == b)) |
            ((models.ReviewQueue.record_a_id == b) & (models.ReviewQueue.record_b_id == a))
        ).first()

        if not existing:
            bf = {"match_probability": float(row['match_probability'])}
            queue_item = models.ReviewQueue(
                pair_id=str(uuid.uuid4()),
                record_a_id=a,
                record_b_id=b,
                splink_score=float(row['match_probability']),
                bayes_factors=bf,   # JSON column -- pass dict, not json.dumps()
                status="pending"
            )
            session.add(queue_item)

    session.commit()

    # Summary
    ubid_count   = session.query(models.UBIDRegistry).count()
    review_count = session.query(models.ReviewQueue).filter(
        models.ReviewQueue.status == "pending"
    ).count()

    print(f"\nDecision Routing complete!")
    print(f"  - {ubid_count} UBIDs in registry")
    print(f"  - {review_count} pairs in review queue")
    print(f"  - {ubid_count} UBIDs in registry")
    print(f"  - {review_count} pairs in review queue")

if __name__ == "__main__":
    run_decision_routing()
