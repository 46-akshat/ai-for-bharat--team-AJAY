import sys
import os
from sqlalchemy import text

# Setup path to find backend folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.app.database import engine

def fill_canonical_table():
    print("Merging normalized tables into canonical_record...")
    
    sql_query = text("""
        TRUNCATE TABLE canonical_record;

        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst)
        SELECT raw_id, 'shops', biz_name_raw, biz_name_raw, address_raw, pin, pan, gst FROM shops;

        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst)
        SELECT raw_id, 'factories', biz_name_raw, biz_name_raw, address_raw, pin, pan, gst FROM factories;

        INSERT INTO canonical_record (raw_id, source_dept, biz_name_raw, biz_name_norm, address_raw, pin, pan, gst)
        SELECT raw_id, 'bescom', biz_name_raw, biz_name_raw, address_raw, pin, pan, gst FROM bescom;
    """)

    try:
        with engine.connect() as conn:
            conn.execute(sql_query)
            conn.commit()
            print("Success! canonical_record is populated as per the exact schema diagram.")
    except Exception as e:
        print(f" Error occurred: {e}")

if __name__ == "__main__":
    fill_canonical_table()