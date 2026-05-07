import duckdb
import pandas as pd

def run_classification_engine():
    print("\n" + "="*90)
    print(" [PART B] DYNAMIC BUSINESS INTELLIGENCE CLASSIFICATION ENGINE")
    print("="*90)

    con = duckdb.connect(database=':memory:')

    try:
        # Load all 3 CSVs
        con.execute("CREATE VIEW identities AS SELECT * FROM read_csv_auto('data/part_a_output.csv')")
        con.execute("CREATE VIEW raw_logs AS SELECT * FROM read_csv_auto('data/raw_dept_logs.csv')")
        con.execute("CREATE VIEW admin_rules AS SELECT * FROM read_csv_auto('data/admin_rules.csv')")
    except Exception as e:
        print(f"\nError: Could not find CSV files. Please run generate_events.py first.")
        return

    # Automatically convert raw data to standard format via Admin Rules
    con.execute("""
        CREATE VIEW standardized_stream AS
        SELECT 
            r.ubid,
            r.raw_event_type,
            a.standard_signal,
            a.weight,
            r.date
        FROM raw_logs r
        LEFT JOIN admin_rules a ON r.raw_event_type = a.raw_event_type
    """)

    # DECISION SYSTEM 
    query = """
        SELECT 
            i.biz_name,
            i.ubid,
            CASE 
                WHEN bool_or(s.weight = 'CLOSURE') THEN 'CLOSED 🔴'
                WHEN max(s.date::TIMESTAMP) < current_date - INTERVAL 18 MONTH THEN 'CLOSED 🔴'
                WHEN sum(CASE WHEN s.weight = 'HIGH' AND s.date::TIMESTAMP >= current_date - INTERVAL 6 MONTH THEN 1 ELSE 0 END) >= 1 THEN 'ACTIVE 🟢'
                WHEN sum(CASE WHEN s.weight = 'MED' AND s.date::TIMESTAMP >= current_date - INTERVAL 6 MONTH THEN 1 ELSE 0 END) >= 2 THEN 'ACTIVE 🟢'
                ELSE 'DORMANT 🟡'
            END AS derived_status,
            CAST(MAX(s.date::TIMESTAMP) AS DATE) as last_activity
        FROM identities i
        LEFT JOIN standardized_stream s ON i.ubid = s.ubid
        GROUP BY i.ubid, i.biz_name
        ORDER BY derived_status
    """
    
    results = con.execute(query).df()

    
    print(f"\n{'BUSINESS NAME':<25} | {'UBID':<15} | {'LAST SEEN':<12} | {'SYSTEM STATUS'}")
    print("-" * 85)
    
    for _, row in results.iterrows():
        last_seen = str(row['last_activity']) if row['last_activity'] else "NEVER"
        print(f"{row['biz_name']:<25} | {row['ubid']:<15} | {last_seen:<12} | {row['derived_status']}")
        
    print("="*85)
    print("\n✓ Raw Data successfully mapped using Admin Rules.")
    print("✓ Classification complete.")

if __name__ == "__main__":
    run_classification_engine()