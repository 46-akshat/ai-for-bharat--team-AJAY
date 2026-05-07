import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Resolve paths relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '..', '.env')
load_dotenv(dotenv_path=env_path)

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("Error: Could not load DATABASE_URL. Check .env file in project root.")
    exit()

engine = create_engine(DB_URL)
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Resolve paths relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '..', '.env')
load_dotenv(dotenv_path=env_path)

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("Error: Could not load DATABASE_URL. Check .env file in project root.")
    exit()

engine = create_engine(DB_URL)

def fill_canonical_table():
    print("Merging normalized tables into canonical_record...")
    
    # FIX: Use biz_name_norm (the actual normalized column) instead of biz_name_raw
    # The old code was: SELECT ... biz_name_raw, biz_name_raw ... (writing raw into norm!)
    # Now correctly maps biz_name_norm ΓåÆ biz_name_norm
    sql_query = text("""
        TRUNCATE TABLE canonical_record;

        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
        SELECT raw_id, 'shops', biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone FROM shops;
        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
        SELECT raw_id, 'shops', biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone FROM shops;

        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
        SELECT raw_id, 'factories', biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone FROM factories;
        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
        SELECT raw_id, 'factories', biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone FROM factories;

        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
        SELECT raw_id, 'bescom', biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone FROM bescom;
        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone)
        SELECT raw_id, 'bescom', biz_name_raw, biz_name_norm, address_raw, pin, pan, gst, phone FROM bescom;
    """)

    try:
        with engine.connect() as conn:
            conn.execute(sql_query)
            conn.commit()
            print("Success! canonical_record is populated correctly.")
            print("Success! canonical_record is populated correctly.")
    except Exception as e:
        print(f"Error occurred: {e}")
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    fill_canonical_table()
