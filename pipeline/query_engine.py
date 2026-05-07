"""
query_engine.py  -  Part B: Classification Engine

Reads events from Supabase `event` table, applies the rule-based
classification engine (via DuckDB in-memory OLAP), then updates
`ubid_registry.status` in Supabase with the derived status.

Classification rules (from design doc):
  CLOSED:  closure_filing signal  OR  last activity > 18 months ago
  ACTIVE:  >= 1 HIGH event in last 180 days
           OR >= 2 MED events in last 180 days
  DORMANT: everything else (no events in 6-18 months)
"""

import os
import sys
import duckdb
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# ── paths ──────────────────────────────────────────────────────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path   = os.path.join(script_dir, '..', '.env')
load_dotenv(dotenv_path=env_path)
sys.path.append(os.path.abspath(os.path.join(script_dir, '..')))
from backend.app import models

# ── db ─────────────────────────────────────────────────────────────────────
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("Error: DATABASE_URL not found. Check .env in project root.")
    exit(1)

engine  = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()


def run():
    print("\n" + "="*70)
    print("  [PART B] CLASSIFICATION ENGINE - Updating UBID Statuses")
    print("="*70)

    # 1. Pull events and ubid_registry from Supabase into DataFrames
    events_rows = session.query(models.Event).all()
    ubids_rows  = session.query(models.UBIDRegistry).all()

    if not ubids_rows:
        print("No UBIDs found. Run Part A pipeline first.")
        return
    if not events_rows:
        print("No events found. Run generate_events.py first.")
        return

    events_df = pd.DataFrame([{
        "event_id":      e.event_id,
        "ubid":          e.ubid,
        "event_type":    e.event_type,
        "signal_weight": e.signal_weight,
        "source_dept":   e.source_dept,
        "occurred_at":   e.occurred_at,
    } for e in events_rows])

    ubids_df = pd.DataFrame([{
        "ubid":   u.ubid,
        "status": u.status,
    } for u in ubids_rows])

    print(f"Loaded {len(ubids_df)} UBIDs and {len(events_df)} events from Supabase.")

    # 2. Run classification in DuckDB (in-memory OLAP — sub-second)
    con = duckdb.connect(database=':memory:')
    con.register("events_view",  events_df)
    con.register("ubids_view",   ubids_df)

    results_df = con.execute("""
        SELECT
            u.ubid,
            CASE
                -- Rule 1: CLOSED if closure_filing event exists
                WHEN bool_or(e.signal_weight = 'CLOSURE') THEN 'closed'

                -- Rule 2: CLOSED if last activity > 18 months ago (548 days)
                WHEN max(e.occurred_at) < now() - INTERVAL '548 days' THEN 'closed'

                -- Rule 3: ACTIVE if >= 1 HIGH event in last 180 days
                WHEN sum(
                    CASE WHEN e.signal_weight = 'HIGH'
                         AND e.occurred_at >= now() - INTERVAL '180 days'
                    THEN 1 ELSE 0 END
                ) >= 1 THEN 'active'

                -- Rule 4: ACTIVE if >= 2 MED events in last 180 days
                WHEN sum(
                    CASE WHEN e.signal_weight = 'MED'
                         AND e.occurred_at >= now() - INTERVAL '180 days'
                    THEN 1 ELSE 0 END
                ) >= 2 THEN 'active'

                -- Rule 5: DORMANT otherwise
                ELSE 'dormant'
            END AS derived_status,
            max(e.occurred_at) AS last_activity
        FROM ubids_view u
        LEFT JOIN events_view e ON u.ubid = e.ubid
        GROUP BY u.ubid
    """).df()

    # 3. Update ubid_registry.status in Supabase
    status_counts = {"active": 0, "dormant": 0, "closed": 0}
    for _, row in results_df.iterrows():
        status = row["derived_status"]
        session.execute(
            text("UPDATE ubid_registry SET status = :status WHERE ubid = :ubid"),
            {"status": status, "ubid": row["ubid"]}
        )
        status_counts[status] = status_counts.get(status, 0) + 1

    session.commit()

    # 4. Print results table (ASCII-safe)
    print(f"\n{'UBID':<18} | {'STATUS':<8} | {'LAST ACTIVITY'}")
    print("-" * 60)

    for _, row in results_df.sort_values("derived_status").iterrows():
        last = str(row["last_activity"])[:19] if pd.notna(row["last_activity"]) else "NEVER"
        marker = {"active": "[+]", "dormant": "[~]", "closed": "[x]"}.get(row["derived_status"], "[ ]")
        print(f"{row['ubid']:<18} | {row['derived_status']:<8} | {last}  {marker}")

    print("=" * 70)
    print(f"\nClassification complete:")
    print(f"  [+] Active:  {status_counts['active']}")
    print(f"  [~] Dormant: {status_counts['dormant']}")
    print(f"  [x] Closed:  {status_counts['closed']}")
    print(f"\nubid_registry.status updated in Supabase.")
    print("=" * 70)


if __name__ == "__main__":
    run()