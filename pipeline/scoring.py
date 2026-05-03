import os
import warnings
import duckdb
from splink import DuckDBAPI, Linker
import splink.comparison_library as cl

warnings.filterwarnings("ignore")

def run_scoring_engine():
    print("\n[KA-UBID] Initializing Self-Learning Engine on REAL Synthetic Data...")

    # CLEANUP PREVIOUS RUNS
    db_path = 'data/analytical.db'
    
    # If the database exists from a previous test run, delete it for a fresh start
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"🧹 Cleaned up old '{db_path}' for a fresh run.")


    # LOAD NORMALIZED CSVS INTO DUCKDB
    
    print(f"Connecting to permanent database: {db_path}...")
    con = duckdb.connect(database=db_path)

    try:
        con.execute("""
            CREATE OR REPLACE TABLE master_records AS 
            SELECT * FROM read_csv_auto('data/norm_factories.csv')
            UNION ALL
            SELECT * FROM read_csv_auto('data/norm_shops.csv')
            UNION ALL
            SELECT * FROM read_csv_auto('data/norm_bescom.csv')
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
        
        # Temporary blocking rules; will be replaced by Custom Trie for O(m) candidate generation
        "blocking_rules_to_generate_predictions": [
            "l.pan = r.pan",
            "l.address_norm = r.address_norm"
        ],
        
        "comparisons": [
            cl.ExactMatch("pan"),
            cl.JaroWinklerAtThresholds("biz_name_norm", [0.9, 0.7]),
            cl.JaroWinklerAtThresholds("address_norm", [0.8])
        ],
        "retain_matching_columns": True,
        "retain_intermediate_calculation_columns": True
    }

    # (Expectation-Maximisation)
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
    df_predict = linker.inference.predict().as_pandas_dataframe()

    # Save to CSV 
    df_predict.to_csv("data/final_ubid_matches.csv", index=False)
    print("Saved raw matches to CSV: 'data/final_ubid_matches.csv'")

    # Save to our permanent DuckDB file 
    con.execute("CREATE OR REPLACE TABLE final_ubid_registry AS SELECT * FROM df_predict")
    print("Successfully wrote UBID Registry to 'analytical.db' for Part B BI Queries!")

    # TERMINAL OUTPUT DISPLAY
    df_predict = df_predict[df_predict['match_probability'] >= 0.10]
    df_predict = df_predict.sort_values(by='match_probability', ascending=False)

    print("\n" + "="*80)
    print("                      KA-UBID REAL DATA SCORING RESULTS")
    print("="*80)
    
    for index, row in df_predict.iterrows():
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
    print("Run Complete. System is ready for Dashboard Integration.\n")

if __name__ == "__main__":
    run_scoring_engine()