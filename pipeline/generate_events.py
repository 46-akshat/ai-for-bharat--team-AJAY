import os
import uuid
import pandas as pd
from datetime import datetime, timedelta

def generate_csv_data():
    print("\n" + "="*55)
    print(" [PART B] GENERATING DYNAMIC MAPPING & MOCK CSVs")
    print("="*55)

    os.makedirs('data', exist_ok=True)

    # 1. Mock Part A Output (The Identity Layer)
    ubids_data = [
        {"ubid": "KA-UBID-101", "biz_name": "Modern Silk Weavers"},
        {"ubid": "KA-UBID-202", "biz_name": "Bangalore Tech Hub"},
        {"ubid": "KA-UBID-303", "biz_name": "Cauvery Steel Works"},
        {"ubid": "KA-UBID-404", "biz_name": "Heritage Cafe"}
    ]
    pd.DataFrame(ubids_data).to_csv('data/part_a_output.csv', index=False)
    print("Created: data/part_a_output.csv")

    # 2. The Admin Rule Configuration
    admin_rules = [
        {"raw_event_type": "BESCOM_ELECTRICITY", "standard_signal": "recurring bill payment", "weight": "HIGH"},
        {"raw_event_type": "TAX_FILING",         "standard_signal": "financial transactions", "weight": "MED"},
        {"raw_event_type": "LABOUR_RENEWAL",     "standard_signal": "maintenance",            "weight": "MED"},
        {"raw_event_type": "PF_CONTRIBUTION",    "standard_signal": "hiring/firing",          "weight": "HIGH"},
        {"raw_event_type": "CLOSURE_FILING",     "standard_signal": "business closure",       "weight": "CLOSURE"}
    ]
    pd.DataFrame(admin_rules).to_csv('data/admin_rules.csv', index=False)
    print("Created: data/admin_rules.csv (The Admin Logic Layer)")

    # 3. Mock Department Logs 
    events_data = []
    today = datetime.now()

    # KA-UBID-101
    events_data.append({"ubid": "KA-UBID-101", "raw_event_type": "BESCOM_ELECTRICITY", "date": today - timedelta(days=10)})
    
    # KA-UBID-202
    events_data.append({"ubid": "KA-UBID-202", "raw_event_type": "TAX_FILING", "date": today - timedelta(days=420)})
    
    # KA-UBID-303
    events_data.append({"ubid": "KA-UBID-303", "raw_event_type": "LABOUR_RENEWAL", "date": today - timedelta(days=30)})
    events_data.append({"ubid": "KA-UBID-303", "raw_event_type": "PF_CONTRIBUTION", "date": today - timedelta(days=60)})

    # KA-UBID-404
    events_data.append({"ubid": "KA-UBID-404", "raw_event_type": "CLOSURE_FILING", "date": today - timedelta(days=5)})

    pd.DataFrame(events_data).to_csv('data/raw_dept_logs.csv', index=False)
    print("Created: data/raw_dept_logs.csv (The Unprocessed Stream)")
    print("\nGeneration Complete. Now run query_engine.py to see the conversion in action.")

if __name__ == "__main__":
    generate_csv_data()