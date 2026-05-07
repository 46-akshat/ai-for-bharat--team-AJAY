from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import engine, SessionLocal
from . import models

# This physically creates the tables in Supabase based on your models.py
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    # Strip embedded single-quotes from raw_ids (pipeline serialization artifact)
    raw_id_a = pair.record_a_id.strip("'")
    raw_id_b = pair.record_b_id.strip("'")

    record_a = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == raw_id_a).first()
    record_b = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == raw_id_b).first()
    
    return {
        "pair": pair,
        "record_a": record_a,
        "record_b": record_b
    }

@app.get("/api/debug/fix-quotes")
def fix_quotes(db: Session = Depends(get_db)):
    """One-time fix: strip embedded single-quotes from raw_id in all tables."""
    try:
        db.execute(text("UPDATE shops      SET raw_id = TRIM(BOTH '''' FROM raw_id) WHERE raw_id LIKE '''%'''"))
        db.execute(text("UPDATE factories  SET raw_id = TRIM(BOTH '''' FROM raw_id) WHERE raw_id LIKE '''%'''"))
        db.execute(text("UPDATE bescom     SET raw_id = TRIM(BOTH '''' FROM raw_id) WHERE raw_id LIKE '''%'''"))
        db.execute(text("UPDATE canonical_record SET raw_id = TRIM(BOTH '''' FROM raw_id) WHERE raw_id LIKE '''%'''"))
        db.execute(text("UPDATE review_queue SET record_a_id = TRIM(BOTH '''' FROM record_a_id) WHERE record_a_id LIKE '''%'''"))
        db.execute(text("UPDATE review_queue SET record_b_id = TRIM(BOTH '''' FROM record_b_id) WHERE record_b_id LIKE '''%'''"))
        db.execute(text("UPDATE record_ubid_linkage SET raw_id = TRIM(BOTH '''' FROM raw_id) WHERE raw_id LIKE '''%'''"))
        db.commit()
        
        # Now repopulate canonical from the cleaned source tables
        db.execute(text("""
            TRUNCATE TABLE canonical_record;
            INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
            SELECT raw_id, 'shops', biz_name_raw, COALESCE(biz_name_norm, biz_name_raw), address_raw, pin, pan, gst, phone FROM shops;
            INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
            SELECT raw_id, 'factories', biz_name_raw, COALESCE(biz_name_norm, biz_name_raw), address_raw, pin, pan, gst, phone FROM factories;
            INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
            SELECT raw_id, 'bescom', biz_name_raw, COALESCE(biz_name_norm, biz_name_raw), address_raw, pin, pan, gst, phone FROM bescom;
        """))
        db.commit()

        canonical_count = db.query(models.CanonicalRecord).count()
        return {
            "status": "ok",
            "message": "Quotes stripped from all tables and canonical_record repopulated.",
            "canonical_rows": canonical_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    """Debug endpoint: shows raw_ids from review_queue and whether they exist in canonical_record."""
    pair = db.query(models.ReviewQueue).filter(models.ReviewQueue.pair_id == pair_id).first()
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found")

    raw_id_a_stored = pair.record_a_id
    raw_id_b_stored = pair.record_b_id
    raw_id_a_clean  = raw_id_a_stored.strip("'").strip()
    raw_id_b_clean  = raw_id_b_stored.strip("'").strip()

    record_a_exact  = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == raw_id_a_stored).first()
    record_b_exact  = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == raw_id_b_stored).first()
    record_a_clean  = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == raw_id_a_clean).first()
    record_b_clean  = db.query(models.CanonicalRecord).filter(models.CanonicalRecord.raw_id == raw_id_b_clean).first()

    # Pull 5 canonical raw_ids that start with same prefix as record_a
    prefix_a = raw_id_a_clean.split("_")[0] if "_" in raw_id_a_clean else raw_id_a_clean[:3]
    sample_matching_prefix = db.query(models.CanonicalRecord.raw_id).filter(
        models.CanonicalRecord.raw_id.like(f"{prefix_a}%")
    ).limit(5).all()

    # Total count in canonical
    total_canonical = db.query(models.CanonicalRecord).count()

    return {
        "pair_id": pair_id,
        "stored_in_queue": {
            "record_a_id": repr(raw_id_a_stored),
            "record_b_id": repr(raw_id_b_stored),
        },
        "after_strip": {
            "record_a_id": repr(raw_id_a_clean),
            "record_b_id": repr(raw_id_b_clean),
        },
        "exact_match_on_stored": {
            "record_a": record_a_exact is not None,
            "record_b": record_b_exact is not None,
        },
        "exact_match_on_stripped": {
            "record_a": record_a_clean is not None,
            "record_b": record_b_clean is not None,
        },
        "canonical_total_rows": total_canonical,
        f"canonical_sample_with_prefix_{prefix_a}": [repr(r.raw_id) for r in sample_matching_prefix],
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
        
    from datetime import datetime as dt
    pair.status = decision.decision + "d" if decision.decision in ["merge", "separate"] else "escalated"
    pair.reviewer_id = decision.reviewer_id
    pair.decided_at = dt.utcnow()
    
    if decision.decision == "merge":
        # Generate next UBID using MAX (not COUNT) to avoid duplicates
        from sqlalchemy import func
        max_ubid = db.query(func.max(models.UBIDRegistry.ubid)).scalar()
        if max_ubid is None:
            ubid_val = "KA-UBID-00001"
        else:
            current_max = int(max_ubid.split('-')[-1])
            ubid_val = f"KA-UBID-{(current_max + 1):05d}"
        
        registry = models.UBIDRegistry(ubid=ubid_val, status="active", confidence_score=pair.splink_score)
        db.add(registry)
        db.flush()
        
        # Helper to map raw_id prefix to department name
        def get_dept(raw_id):
            raw_id = raw_id.strip("'")  # strip serialization quotes
            prefix = raw_id.split('_')[0] if '_' in raw_id else ''
            return {"FAC": "factories", "SHP": "shops", "BES": "bescom"}.get(prefix, "unknown")
        
        link_a = models.RecordUBIDLinkage(ubid=ubid_val, raw_id=pair.record_a_id.strip("'"), source_dept=get_dept(pair.record_a_id), match_score=pair.splink_score, link_method="human", reviewer_id=decision.reviewer_id)
        link_b = models.RecordUBIDLinkage(ubid=ubid_val, raw_id=pair.record_b_id.strip("'"), source_dept=get_dept(pair.record_b_id), match_score=pair.splink_score, link_method="human", reviewer_id=decision.reviewer_id)
        db.add(link_a)
        db.add(link_b)
        
    db.commit()
    return {"message": f"Pair marked as {pair.status}", "ubid": ubid_val if decision.decision == "merge" else None}

@app.get("/api/ubids")
def get_ubids(limit: int = 100, db: Session = Depends(get_db)):
    """Fetch assigned UBIDs."""
    return db.query(models.UBIDRegistry).limit(limit).all()

@app.delete("/api/cleanup")
def wipe_database(db: Session = Depends(get_db)):
    """Wipes all pipeline data for a fresh run."""
    try:
        # Cascade will handle foreign key dependencies
        db.execute(text("""
            TRUNCATE TABLE review_queue CASCADE;
            TRUNCATE TABLE record_ubid_linkage CASCADE;
            TRUNCATE TABLE ubid_registry CASCADE;
            TRUNCATE TABLE canonical_record CASCADE;
            TRUNCATE TABLE shops CASCADE;
            TRUNCATE TABLE factories CASCADE;
            TRUNCATE TABLE bescom CASCADE;
        """))
        db.commit()
        return {"message": "✅ Database completely wiped! Ready for a fresh pipeline run."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))