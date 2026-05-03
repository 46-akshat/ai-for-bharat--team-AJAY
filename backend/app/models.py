from sqlalchemy import Column, String, Integer, DateTime, Float, JSON
from sqlalchemy.sql import func
from .database import Base

class CanonicalRecord(Base):
    __tablename__ = "canonical_record"
    id = Column(Integer, primary_key=True, index=True)
    raw_id = Column(String, index=True)
    source_dept = Column(String, index=True)
    biz_name_raw = Column(String)
    biz_name_norm = Column(String, index=True)
    address_raw = Column(String)
    pin = Column(String, index=True)
    pan = Column(String, index=True)
    gst = Column(String, index=True)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Updated source models to match your database schema
class Shop(Base):
    __tablename__ = "shops"
    id = Column(Integer, primary_key=True, index=True) # Ensure you ran the ALTER TABLE SQL!
    raw_id = Column(String)
    biz_name_raw = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)
    phone = Column(String)

class Factory(Base):
    __tablename__ = "factories"
    id = Column(Integer, primary_key=True, index=True)
    raw_id = Column(String)
    biz_name_raw = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)
    phone = Column(String)

class Bescom(Base):
    __tablename__ = "bescom"
    id = Column(Integer, primary_key=True, index=True)
    raw_id = Column(String)
    biz_name_raw = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)
    phone = Column(String)

class UBIDRegistry(Base):
    __tablename__ = "ubid_registry"
    
    ubid = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String) 
    confidence_score = Column(Float)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

class RecordUBIDLinkage(Base):
    __tablename__ = "record_ubid_linkage"
    
    id = Column(Integer, primary_key=True, index=True) 
    ubid = Column(String, index=True)   
    raw_id = Column(String, index=True) 
    source_dept = Column(String)
    match_score = Column(Float)
    link_method = Column(String) 
    reviewer_id = Column(String, nullable=True)
    linked_at = Column(DateTime(timezone=True), server_default=func.now())

class ReviewQueue(Base):
    __tablename__ = "review_queue"
    
    pair_id = Column(String, primary_key=True, index=True)
    record_a_id = Column(String, index=True)
    record_b_id = Column(String, index=True)
    splink_score = Column(Float)
    bayes_factors = Column(JSON) 
    status = Column(String) 
    reviewer_id = Column(String, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)

class Event(Base):
    __tablename__ = "event"
    
    event_id = Column(String, primary_key=True, index=True)
    ubid = Column(String, index=True)
    event_type = Column(String)
    signal_weight = Column(String) 
    source_dept = Column(String)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())