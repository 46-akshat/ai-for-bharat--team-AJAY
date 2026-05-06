import pandas as pd
import uuid
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
import os
import sys
import json
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.app import models

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
    """Generate next UBID by finding the current max number, not count.
    
    Why not count? If we delete a UBID, count goes down and we'd reuse IDs.
    Using MAX ensures we always increment, even after deletions or failed runs.
    """
    from sqlalchemy import func as sa_func
    result = session.query(sa_func.max(models.UBIDRegistry.ubid)).scalar()
    if result is None:
        return "KA-UBID-00001"
    # Extract the numeric part from "KA-UBID-00042" → 42, then increment
    current_max = int(result.split('-')[-1])
    return f"KA-UBID-{(current_max + 1):05d}"

def get_source_dept(raw_id):
    """Convert raw_id prefix to full department name.
    
    'FAC_a1b2c3' → 'factories'
    'SHP_d4e5f6' → 'shops'
    'BES_g7h8i9' → 'bescom'
    """
    prefix = raw_id.split('_')[0] if '_' in raw_id else ''
    return DEPT_PREFIX_MAP.get(prefix, 'unknown')

def run_decision_routing():
    print("Starting Decision Routing...")
    
    csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "final_ubid_matches.csv")
    if not os.path.exists(csv_path):
        # Also try relative path for backward compatibility
        csv_path = "data/final_ubid_matches.csv"
        if not os.path.exists(csv_path):
            print(f"Error: final_ubid_matches.csv not found. Run scoring.py first!")
            return

    df = pd.read_csv(csv_path)
    
    session = load_db_session()
    
    # 1. Separate into buckets based on match probability
    #    >= 0.90 → Auto-link (high confidence, assign UBID automatically)
    #    0.50 to 0.89 → Human Review (ambiguous, needs human decision)
    #    < 0.50 → Reject (too low confidence, discard)
    auto_link_df = df[df['match_probability'] >= 0.90]
    review_df = df[(df['match_probability'] >= 0.50) & (df['match_probability'] < 0.90)]
    
    print(f"Found {len(auto_link_df)} pairs for AUTO-LINK (>= 90%)")
    print(f"Found {len(review_df)} pairs for HUMAN REVIEW (50-89%)")
    print(f"Discarded {len(df) - len(auto_link_df) - len(review_df)} pairs below 50%")
    
    # 2. Process Auto-Links using Connected Components (BFS graph clustering)
    #
    # WHY: If A matches B (95%) and B matches C (92%), then A, B, C are all
    # the same business and should share ONE UBID. We find these groups using
    # a graph where nodes are raw_ids and edges are high-confidence matches.
    
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
        
    # BFS to find connected components
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
    
    # Generate UBIDs and save to DB
    for component in components:
        comp_list = list(component)
        
        # Calculate average confidence score across all pairs in this component
        total_score = 0
        pair_count = 0
        for i in range(len(comp_list)):
            for j in range(i+1, len(comp_list)):
                if (comp_list[i], comp_list[j]) in scores:
                    total_score += scores[(comp_list[i], comp_list[j])]
                    pair_count += 1
                    
        avg_score = total_score / pair_count if pair_count > 0 else 1.0
        
        ubid = get_next_ubid(session)
        
        registry_entry = models.UBIDRegistry(
            ubid=ubid,
            status="active",
            confidence_score=round(avg_score, 4)
        )
        session.add(registry_entry)
        session.flush() # Flush so the UBID exists before we create linkages
        
        for raw_id in component:
            link = models.RecordUBIDLinkage(
                ubid=ubid,
                raw_id=raw_id,
                source_dept=get_source_dept(raw_id),
                match_score=round(avg_score, 4),
                link_method="auto"
            )
            session.add(link)
            
    # 3. Process Review Queue
    for _, row in review_df.iterrows():
        a, b = row['raw_id_l'], row['raw_id_r']
        
        # Check if this pair is already in the queue (in either direction)
        existing = session.query(models.ReviewQueue).filter(
            ((models.ReviewQueue.record_a_id == a) & (models.ReviewQueue.record_b_id == b)) |
            ((models.ReviewQueue.record_a_id == b) & (models.ReviewQueue.record_b_id == a))
        ).first()
        
        if not existing:
            # Store per-field evidence as JSON for the reviewer dashboard
            bf = {"match_probability": float(row['match_probability'])}
            
            queue_item = models.ReviewQueue(
                pair_id=str(uuid.uuid4()),
                record_a_id=a,
                record_b_id=b,
                splink_score=float(row['match_probability']),
                bayes_factors=bf,  # JSON column — pass dict directly, not json.dumps()
                status="pending"
            )
            session.add(queue_item)
            
    session.commit()
    
    # Summary
    ubid_count = session.query(models.UBIDRegistry).count()
    review_count = session.query(models.ReviewQueue).filter(models.ReviewQueue.status == "pending").count()
    print(f"\nDecision Routing complete!")
    print(f"  - {ubid_count} UBIDs in registry")
    print(f"  - {review_count} pairs in review queue")

if __name__ == "__main__":
    run_decision_routing()
