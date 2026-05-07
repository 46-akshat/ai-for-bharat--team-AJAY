from sqlalchemy import Column, String, Integer, DateTime, Float, JSON
from sqlalchemy.sql import func
from .database import Base

class CanonicalRecord(Base):
    __tablename__ = "canonical_record"
    raw_id = Column(String, primary_key=True, index=True)  # actual PK per schema.md
    source_dept = Column(String, index=True)
    biz_name_raw = Column(String)
    biz_name_norm = Column(String, index=True)
    address_raw = Column(String)
    pin = Column(String, index=True)
    pan = Column(String, index=True)
    gst = Column(String, index=True)
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Source models — raw_id is the natural PK in Supabase
class Shop(Base):
    __tablename__ = "shops"
    raw_id = Column(String, primary_key=True, index=True)
    biz_name_raw = Column(String)
    biz_name_norm = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)
    phone = Column(String)

class Factory(Base):
    __tablename__ = "factories"
    raw_id = Column(String, primary_key=True, index=True)
    biz_name_raw = Column(String)
    biz_name_norm = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)
    phone = Column(String)

class Bescom(Base):
    __tablename__ = "bescom"
    raw_id = Column(String, primary_key=True, index=True)
    biz_name_raw = Column(String)
    biz_name_norm = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)
    phone = Column(String)

class UBIDRegistry(Base):
    __tablename__ = "ubid_registry"
    ubid = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, nullable=False) # active/dormant/closed
    confidence_score = Column(Float)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

class RecordUBIDLinkage(Base):
    __tablename__ = "record_ubid_linkage"
    id = Column(Integer, primary_key=True, index=True)
    ubid = Column(String, index=True) # FK to ubid_registry
    raw_id = Column(String, index=True) # FK to canonical_record
    source_dept = Column(String)
    match_score = Column(Float)
    link_method = Column(String) # auto/human
    reviewer_id = Column(String, nullable=True)
    linked_at = Column(DateTime(timezone=True), server_default=func.now())

class ReviewQueue(Base):
    __tablename__ = "review_queue"
    pair_id = Column(String, primary_key=True, index=True)
    record_a_id = Column(String, index=True) # FK to canonical_record
    record_b_id = Column(String, index=True) # FK to canonical_record
    splink_score = Column(Float)
    bayes_factors = Column(JSON) # Per-field Bayes factor evidence
    status = Column(String, nullable=False) # pending/merged/separated/escalated
    reviewer_id = Column(String, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)

class Event(Base):
    __tablename__ = "event"
    event_id = Column(String, primary_key=True, index=True)
    ubid = Column(String, index=True)
    event_type = Column(String)
    signal_weight = Column(String) # HIGH/MED/LOW
    source_dept = Column(String)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
