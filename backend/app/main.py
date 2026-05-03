from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from . import models

# This physically creates the tables in Supabase based on your models.py
models.Base.metadata.create_all(bind=engine)

app = FastAPI()


# Database Dependency
def get_db():
    """
    Creates an independent database session for each request.
    Ensures the connection closes safely after the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Endpoints
@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

@app.get("/api/records")
def get_records(limit: int = 100, db: Session = Depends(get_db)):
    """
    Fetches the normalized records from Supabase.
    """
    # Query the database for the records, limited to 100 rows by default
    records = db.query(models.CanonicalRecord).limit(limit).all()
    return records

@app.get("/api/shops")
def get_shops(db: Session = Depends(get_db)):
    # This tells FastAPI to fetch everything from the shops table
    return db.query(models.Shop).all()

@app.get("/api/factories")
def get_factories(db: Session = Depends(get_db)):
    return db.query(models.Factory).all()

@app.get("/api/bescom")
def get_bescom(db: Session = Depends(get_db)):
    return db.query(models.Bescom).all()

@app.get("/api/review-queue")
def get_review_queue(status: str = "pending", db: Session = Depends(get_db)):
    """Fetch pending review queue items."""
    return db.query(models.ReviewQueue).filter(models.ReviewQueue.status == status).all()

@app.get("/api/review-queue/{pair_id}")
def get_review_pair(pair_id: str, db: Session = Depends(get_db)):
    """Fetch a specific review pair with its records."""
    pair = db.query(models.ReviewQueue).filter(models.ReviewQueue.pair_id == pair_id).first()
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found")
    
    record_a = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == pair.record_a_id).first()
    record_b = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == pair.record_b_id).first()
    
    return {
        "pair": pair,
        "record_a": record_a,
        "record_b": record_b
    }

class ReviewDecision(BaseModel):
    decision: str # "merge", "separate", "escalate"
    reviewer_id: str

@app.post("/api/review-queue/{pair_id}/decide")
def submit_review_decision(pair_id: str, decision: ReviewDecision, db: Session = Depends(get_db)):
    pair = db.query(models.ReviewQueue).filter(models.ReviewQueue.pair_id == pair_id).first()
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found")
        
    if decision.decision not in ["merge", "separate", "escalate"]:
        raise HTTPException(status_code=400, detail="Invalid decision")
        
    import datetime
    pair.status = decision.decision + "d" if decision.decision in ["merge", "separate"] else "escalated"
    pair.reviewer_id = decision.reviewer_id
    pair.decided_at = datetime.datetime.utcnow()
    
    # If merged, we need to assign a UBID. Real logic would check if either already has a UBID and group them.
    if decision.decision == "merge":
        # Simplified: generate new UBID for them
        count = db.query(models.UBIDRegistry).count()
        ubid_val = f"KA-UBID-{(count + 1):05d}"
        
        registry = models.UBIDRegistry(ubid=ubid_val, status="active", confidence_score=pair.splink_score)
        db.add(registry)
        db.flush()
        
        link_a = models.RecordUBIDLinkage(ubid=ubid_val, raw_id=pair.record_a_id, match_score=pair.splink_score, link_method="human", reviewer_id=decision.reviewer_id)
        link_b = models.RecordUBIDLinkage(ubid=ubid_val, raw_id=pair.record_b_id, match_score=pair.splink_score, link_method="human", reviewer_id=decision.reviewer_id)
        db.add(link_a)
        db.add(link_b)
        
    db.commit()
    return {"message": f"Pair marked as {pair.status}"}

@app.get("/api/ubids")
def get_ubids(limit: int = 100, db: Session = Depends(get_db)):
    """Fetch assigned UBIDs."""
    return db.query(models.UBIDRegistry).limit(limit).all()