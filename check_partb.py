import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
e = create_engine(os.getenv("DATABASE_URL"))
with e.connect() as c:
    print("=== FINAL SUPABASE STATE ===")
    for tbl in ["event", "ubid_registry"]:
        n = c.execute(text("SELECT COUNT(*) FROM " + tbl)).scalar()
        print(f"  {tbl:<25} {n} rows")
    print()
    for status in ["active", "dormant", "closed"]:
        n = c.execute(text("SELECT COUNT(*) FROM ubid_registry WHERE status='" + status + "'")).scalar()
        print(f"  {status}: {n} UBIDs")
    print()
    print("Sample events (latest 5):")
    rows = c.execute(text("SELECT ubid,event_type,signal_weight,occurred_at FROM event ORDER BY occurred_at DESC LIMIT 5")).fetchall()
    for r in rows:
        print(f"  {r[0]} | {r[1]:<25} | {r[2]:<7} | {str(r[3])[:19]}")
