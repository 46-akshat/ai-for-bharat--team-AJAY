"""
generate_events.py  -  Part B: Event Generator

Pulls REAL UBIDs from Supabase ubid_registry, finds what departments they
belong to (via record_ubid_linkage), then generates plausible department events
and writes them to the `event` table in Supabase.

Distribution of UBID statuses generated:
  ~60% Active  -> events within last 180 days
  ~25% Dormant -> events 6-18 months ago
  ~15% Closed  -> events >18 months ago OR closure_filing signal
"""

import os
import sys
import uuid
import random
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# ── paths ──────────────────────────────────────────────────────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path   = os.path.join(script_dir, '..', '.env')
load_dotenv(dotenv_path=env_path)
sys.path.append(os.path.abspath(os.path.join(script_dir, '..')))
from app import models

# ── db ─────────────────────────────────────────────────────────────────────
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("Error: DATABASE_URL not found. Check .env in project root.")
    exit(1)

engine  = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()

# ── event catalogue ────────────────────────────────────────────────────────
# Mapping: dept → list of (event_type, signal_weight)
DEPT_EVENTS = {
    "bescom": [
        ("electricity_payment",  "HIGH"),
        ("meter_reading",        "HIGH"),
        ("electricity_complaint","LOW"),
    ],
    "factories": [
        ("factory_inspection",   "MED"),
        ("pf_contribution",      "HIGH"),
        ("compliance_filing",    "MED"),
        ("safety_audit",         "MED"),
        ("labour_renewal",       "MED"),
    ],
    "shops": [
        ("licence_renewal",      "MED"),
        ("health_inspection",    "MED"),
        ("fire_noc_renewal",     "MED"),
        ("tax_filing",           "MED"),
    ],
}

CLOSURE_EVENT = ("closure_filing", "CLOSURE")

def random_date_within(days_ago_min: int, days_ago_max: int) -> datetime:
    """Return a UTC datetime between `days_ago_min` and `days_ago_max` days ago."""
    offset = random.randint(days_ago_min, days_ago_max)
    return datetime.now(timezone.utc) - timedelta(days=offset)


def generate_events_for_ubid(ubid: str, depts: list[str], bucket: str) -> list[dict]:
    """
    bucket: 'active' | 'dormant' | 'closed'
    Returns a list of event dicts ready for DB insertion.
    """
    events = []

    if bucket == "closed":
        # Either send a closure filing OR push all events >18 months ago
        if random.random() < 0.5:
            # Closure filing approach
            dept = random.choice(depts) if depts else "shops"
            events.append({
                "event_id":      str(uuid.uuid4()),
                "ubid":          ubid,
                "event_type":    CLOSURE_EVENT[0],
                "signal_weight": CLOSURE_EVENT[1],
                "source_dept":   dept,
                "occurred_at":   random_date_within(20, 60),
            })
        else:
            # Last activity was >18 months ago
            for dept in (depts or ["shops"]):
                for event_type, weight in random.choices(DEPT_EVENTS.get(dept, [("tax_filing", "MED")]), k=1):
                    events.append({
                        "event_id":      str(uuid.uuid4()),
                        "ubid":          ubid,
                        "event_type":    event_type,
                        "signal_weight": weight,
                        "source_dept":   dept,
                        "occurred_at":   random_date_within(548, 730),  # 18-24 months
                    })

    elif bucket == "dormant":
        # Events from 6-18 months ago only
        for dept in (depts or ["shops"]):
            count = random.randint(1, 2)
            for event_type, weight in random.choices(DEPT_EVENTS.get(dept, [("tax_filing", "MED")]), k=count):
                events.append({
                    "event_id":      str(uuid.uuid4()),
                    "ubid":          ubid,
                    "event_type":    event_type,
                    "signal_weight": weight,
                    "source_dept":   dept,
                    "occurred_at":   random_date_within(181, 547),  # 6-18 months
                })

    else:  # active
        # At least one HIGH event OR 2+ MED events in last 180 days
        for dept in (depts or ["shops"]):
            count = random.randint(1, 3)
            for event_type, weight in random.choices(DEPT_EVENTS.get(dept, [("tax_filing", "MED")]), k=count):
                events.append({
                    "event_id":      str(uuid.uuid4()),
                    "ubid":          ubid,
                    "event_type":    event_type,
                    "signal_weight": weight,
                    "source_dept":   dept,
                    "occurred_at":   random_date_within(1, 179),  # within 180 days
                })

    return events


def run():
    print("\n" + "="*60)
    print("  [PART B] EVENT GENERATOR - Writing to Supabase")
    print("="*60)

    # 1. Fetch all UBIDs
    ubids = session.query(models.UBIDRegistry.ubid).all()
    ubid_list = [row[0] for row in ubids]
    print(f"Found {len(ubid_list)} UBIDs in registry.")

    if not ubid_list:
        print("No UBIDs found. Run the Part A pipeline first.")
        return

    # 2. For each UBID, find which departments its records come from
    ubid_depts: dict[str, list] = {}
    linkages = session.query(
        models.RecordUBIDLinkage.ubid,
        models.RecordUBIDLinkage.source_dept
    ).all()
    for ubid, dept in linkages:
        ubid_depts.setdefault(ubid, [])
        if dept not in ubid_depts[ubid]:
            ubid_depts[ubid].append(dept)

    # 3. Clear existing events to avoid duplicates on re-runs
    deleted = session.execute(text("DELETE FROM event")).rowcount
    session.commit()
    print(f"Cleared {deleted} existing events.")

    # 4. Assign a status bucket to each UBID (60/25/15 split)
    random.shuffle(ubid_list)
    total = len(ubid_list)
    n_active  = int(total * 0.60)
    n_dormant = int(total * 0.25)
    # remainder goes to closed
    active_ubids  = ubid_list[:n_active]
    dormant_ubids = ubid_list[n_active : n_active + n_dormant]
    closed_ubids  = ubid_list[n_active + n_dormant:]

    print(f"Assigning buckets: {len(active_ubids)} active, "
          f"{len(dormant_ubids)} dormant, {len(closed_ubids)} closed")

    # 5. Generate and insert events
    all_events = []
    for ubid in active_ubids:
        all_events += generate_events_for_ubid(ubid, ubid_depts.get(ubid, []), "active")
    for ubid in dormant_ubids:
        all_events += generate_events_for_ubid(ubid, ubid_depts.get(ubid, []), "dormant")
    for ubid in closed_ubids:
        all_events += generate_events_for_ubid(ubid, ubid_depts.get(ubid, []), "closed")

    # Bulk insert
    session.bulk_insert_mappings(models.Event, all_events)
    session.commit()

    print(f"\nInserted {len(all_events)} events into Supabase `event` table.")
    print("Run query_engine.py to classify and update UBID statuses.")
    print("="*60)


if __name__ == "__main__":
    run()