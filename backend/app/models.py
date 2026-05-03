from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from .database import Base

class CanonicalRecord(Base):
    __tablename__ = "canonical_record"
    id = Column(Integer, primary_key=True, index=True)
    raw_id = Column(String, index=True)
    source_dept = Column(String, index=True)
    biz_name_raw = Column(String)
    biz_name_clean = Column(String, index=True)
    address_raw = Column(String)
    pin_code = Column(String, index=True)
    city = Column(String)
    state = Column(String)
    phone = Column(String)
    pan_number = Column(String, index=True)
    gstin = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

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

class Factory(Base):
    __tablename__ = "factories"
    id = Column(Integer, primary_key=True, index=True)
    raw_id = Column(String)
    biz_name_raw = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)

class Bescom(Base):
    __tablename__ = "bescom"
    id = Column(Integer, primary_key=True, index=True)
    raw_id = Column(String)
    biz_name_raw = Column(String)
    address_raw = Column(String)
    pin = Column(String)
    pan = Column(String)
    gst = Column(String)