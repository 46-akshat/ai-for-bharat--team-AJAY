import os
import warnings
import duckdb
from splink import DuckDBAPI, Linker
import splink.comparison_library as cl

warnings.filterwarnings("ignore")

def run_scoring_engine():
    print("\n[KA-UBID] Initializing Self-Learning Engine on REAL Synthetic Data...")

    # Resolve paths relative to this script's location so it works from any directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")

    # CLEANUP PREVIOUS RUNS
    db_path = os.path.join(data_dir, 'analytical.db')
    
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🧹 Cleaned up old '{db_path}' for a fresh run.")

    # LOAD NORMALIZED CSVS INTO DUCKDB
    print(f"Connecting to permanent database: {db_path}...")
    con = duckdb.connect(database=db_path)

    norm_factories = os.path.join(data_dir, 'norm_factories.csv').replace('\\', '/')
    norm_shops = os.path.join(data_dir, 'norm_shops.csv').replace('\\', '/')
    norm_bescom = os.path.join(data_dir, 'norm_bescom.csv').replace('\\', '/')

    try:
        con.execute(f"""
            CREATE OR REPLACE TABLE master_records AS 
            SELECT * FROM read_csv_auto('{norm_factories}')
            UNION ALL
            SELECT * FROM read_csv_auto('{norm_shops}')
            UNION ALL
            SELECT * FROM read_csv_auto('{norm_bescom}')
        """)
        
        count = con.execute("SELECT COUNT(*) FROM master_records").fetchone()[0]
        print(f"Successfully loaded {count} records into the Master Table.")
    except duckdb.IOException as e:
        print(f"Error loading CSVs. Make sure you ran generator.py and normalize.py first!\nDetails: {e}")
        return

    # INITIALIZE SPLINK SETTINGS
    db_api = DuckDBAPI(connection=con)

    settings = {
        "link_type": "dedupe_only",
        "unique_id_column_name": "raw_id",
        
        # Blocking rules: only compare pairs that share at least one of these
        # This massively reduces the number of comparisons (O(n²) → manageable)
        "blocking_rules_to_generate_predictions": [
            "l.pan = r.pan",
            "l.gst = r.gst",
            "l.address_norm = r.address_norm"
        ],
        
        # Comparisons: how to score each field for candidate pairs
        "comparisons": [
            cl.ExactMatch("pan"),
            cl.ExactMatch("gst"),
            cl.JaroWinklerAtThresholds("biz_name_norm", [0.9, 0.7]),
            cl.JaroWinklerAtThresholds("address_norm", [0.8])
        ],
        "retain_matching_columns": True,
        "retain_intermediate_calculation_columns": True
    }

    # EM TRAINING (Expectation-Maximisation)
    # Splink learns match/non-match weights unsupervised from the data
    linker = Linker("master_records", settings, db_api=db_api)
    
    print("\nStarting Unsupervised Machine Learning (EM Algorithm)...")
    print("   -> Learning baseline random chance (U-values)...")
    linker.training.estimate_u_using_random_sampling(max_pairs=10000)

    print("   -> Learning match reliability for Names based on PAN matches (M-values)...")
    linker.training.estimate_parameters_using_expectation_maximisation("l.pan = r.pan")
    
    print("   -> Learning match reliability for PANs based on Name matches (M-values)...")
    linker.training.estimate_parameters_using_expectation_maximisation("l.biz_name_norm = r.biz_name_norm")

    # PREDICTION & PERMANENT STORAGE 
    print("\nCalculating Final Match Probabilities...")
    
    # threshold_match_probability=0.01 filters out near-zero noise pairs
    # Without this, Splink returns ALL candidate pairs including 0.001% matches
    df_predict = linker.inference.predict(threshold_match_probability=0.01).as_pandas_dataframe()

    # Save to CSV (this is what decision.py reads)
    output_csv = os.path.join(data_dir, "final_ubid_matches.csv")
    df_predict.to_csv(output_csv, index=False)
    print(f"Saved scored matches to CSV: '{output_csv}'")

    # Save to permanent DuckDB for analytics queries
    con.execute("CREATE OR REPLACE TABLE scored_pairs AS SELECT * FROM df_predict")
    print("Successfully wrote scored pairs to 'analytical.db' for BI queries!")

    # TERMINAL OUTPUT DISPLAY
    df_display = df_predict[df_predict['match_probability'] >= 0.10]
    df_display = df_display.sort_values(by='match_probability', ascending=False)

    print("\n" + "="*80)
    print("                      KA-UBID REAL DATA SCORING RESULTS")
    print("="*80)
    
    for index, row in df_display.iterrows():
        name_l = str(row['biz_name_norm_l'])[:20]
        name_r = str(row['biz_name_norm_r'])[:20]
        prob = row['match_probability'] * 100
        
        if prob >= 90.0:
            decision = "🟢 AUTO-LINK"
        elif prob >= 50.0:
            decision = "🟡 HUMAN REVIEW"
        else:
            decision = "🔴 REJECT"
            
        print(f"Match: {name_l:<20} <-> {name_r:<20} | Score: {prob:>6.2f}% | {decision}")

    print("="*80)
    
    # Summary stats
    auto_count = len(df_predict[df_predict['match_probability'] >= 0.90])
    review_count = len(df_predict[(df_predict['match_probability'] >= 0.50) & (df_predict['match_probability'] < 0.90)])
    total = len(df_predict)
    print(f"\nTotal scored pairs: {total}")
    print(f"  → {auto_count} for AUTO-LINK (≥ 90%)")
    print(f"  → {review_count} for HUMAN REVIEW (50-89%)")
    print(f"  → {total - auto_count - review_count} below threshold (< 50%)")
    print("Run Complete. Ready for decision.py →\n")

if __name__ == "__main__":
    run_scoring_engine()
