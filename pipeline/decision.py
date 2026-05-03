import pandas as pd
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys
import json
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.app import models

def load_db_session():
    load_dotenv(dotenv_path=os.path.join("..", "backend", ".env"))
    DB_URL = os.getenv("DATABASE_URL")
    if not DB_URL:
        print(" Error: Could not load DATABASE_URL.")
        exit()
    engine = create_engine(DB_URL)
    Session = sessionmaker(bind=engine)
    return Session()

def get_next_ubid(session):
    # Very basic UBID generation. In a real system, you'd use a sequence.
    # For now, we query the count.
    count = session.query(models.UBIDRegistry).count()
    return f"KA-UBID-{(count + 1):05d}"

def run_decision_routing():
    print("Starting Decision Routing...")
    
    csv_path = "data/final_ubid_matches.csv"
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found. Run scoring.py first!")
        return

    df = pd.read_csv(csv_path)
    
    session = load_db_session()
    
    # 1. Separate into buckets
    auto_link_df = df[df['match_probability'] >= 0.90]
    review_df = df[(df['match_probability'] >= 0.50) & (df['match_probability'] < 0.90)]
    
    print(f"Found {len(auto_link_df)} pairs for AUTO-LINK")
    print(f"Found {len(review_df)} pairs for HUMAN REVIEW")
    
    # 2. Process Auto-Links (Connected Components)
    # Build graph of connections
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
        # Calculate average confidence
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
            confidence_score=avg_score
        )
        session.add(registry_entry)
        session.flush() # So we can link to it
        
        for raw_id in component:
            dept = raw_id.split('_')[0] if '_' in raw_id else 'unknown'
            link = models.RecordUBIDLinkage(
                ubid=ubid,
                raw_id=raw_id,
                source_dept=dept,
                match_score=avg_score,
                link_method="auto"
            )
            session.add(link)
            
    # 3. Process Review Queue
    for _, row in review_df.iterrows():
        a, b = row['raw_id_l'], row['raw_id_r']
        
        # Check if this pair is already in the queue to avoid duplicates
        existing = session.query(models.ReviewQueue).filter(
            ((models.ReviewQueue.record_a_id == a) & (models.ReviewQueue.record_b_id == b)) |
            ((models.ReviewQueue.record_a_id == b) & (models.ReviewQueue.record_b_id == a))
        ).first()
        
        if not existing:
            # Basic dummy bayes factor json for now
            bf = {"match_probability": row['match_probability']}
            
            queue_item = models.ReviewQueue(
                pair_id=str(uuid.uuid4()),
                record_a_id=a,
                record_b_id=b,
                splink_score=row['match_probability'],
                bayes_factors=json.dumps(bf),
                status="pending"
            )
            session.add(queue_item)
            
    session.commit()
    print("Decision Routing complete. Check database for UBIDs and Review Queue items.")

if __name__ == "__main__":
    run_decision_routing()
