from fastapi import FastAPI, Depends
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