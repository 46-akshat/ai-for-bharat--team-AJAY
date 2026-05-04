import os                                      
import warnings                                
import duckdb                                  
from splink import DuckDBAPI, Linker           
import splink.comparison_library as cl         

warnings.filterwarnings("ignore")              

def run_scoring_engine():
    print("\n[KA-UBID] Initializing Scoring Engine...")

    # Running DuckDB in memory
    print("Connecting to in-memory DuckDB instance...")
    con = duckdb.connect(database=':memory:')  
    db_api = DuckDBAPI(connection=con)         # Establish connection bw DuckDB & Splink

    # Loading normalized files & trie edges
    try:
        con.execute("""
            CREATE OR REPLACE VIEW master_records AS 
            SELECT * FROM read_parquet('data/norm_factories.parquet')   
            UNION ALL
            SELECT * FROM read_parquet('data/norm_shops.parquet')       
            UNION ALL
            SELECT * FROM read_parquet('data/norm_bescom.parquet')      
        """)
        
        con.execute("""
            CREATE OR REPLACE VIEW candidate_pairs AS 
            SELECT * FROM read_parquet('data/candidate_pairs.parquet')  
        """)
        
        count_records = con.execute("SELECT COUNT(*) FROM master_records").fetchone()[0] # Count total entities
        count_pairs = con.execute("SELECT COUNT(*) FROM candidate_pairs").fetchone()[0]  # Count total edges
        print(f"Loaded {count_records} master records.")
        print(f"Loaded {count_pairs} highly-probable candidate pairs from Trie engine.")
    except duckdb.IOException as e:
        print(f"Error loading files. Ensure candidate_pairer.py has run successfully!\nDetails: {e}")
        return

    # SPLINK SETTINGS
    settings = {
        "link_type": "dedupe_only",             # finding duplicates across the combined dataset
        "unique_id_column_name": "raw_id",      # The primary key to track entities
        
        # Using Candidate-Pairs
        "blocking_rules_to_generate_predictions": [
            "EXISTS (SELECT 1 FROM candidate_pairs cp WHERE cp.id_l = l.raw_id AND cp.id_r = r.raw_id)" # Only score what the Trie found
        ],
        
        "comparisons": [
            cl.ExactMatch("pan"),                                       # 100% match or 0% match
            cl.ExactMatch("gst"),                                       # Binary check for Tax ID
            cl.JaroWinklerAtThresholds("biz_name_norm", [0.9, 0.7]),    # Fuzzy match: Tiered scoring for typos
            cl.JaroWinklerAtThresholds("address_norm", [0.8])           # Fuzzy match: Strict threshold for locations
        ],
        "retain_matching_columns": True,                                
        "retain_intermediate_calculation_columns": True                 
    }

    # INITIALIZE SPLINK & TRAIN
    linker = Linker("master_records", settings, db_api=db_api)          # Bind the data, settings, and engine
    
    print("\nStarting Unsupervised Machine Learning (EM Algorithm)...")
    print("   -> Learning baseline random chance (U-values)...")
    linker.training.estimate_u_using_random_sampling(max_pairs=10000)   # Calculate odds of accidental matches

    print("   -> Learning match reliability for Names based on PAN matches (M-values)...")
    linker.training.estimate_parameters_using_expectation_maximisation("l.pan = r.pan")               # If PAN matches, how often does Name match?
    
    print("   -> Learning match reliability for PANs based on Name matches (M-values)...")
    linker.training.estimate_parameters_using_expectation_maximisation("l.biz_name_norm = r.biz_name_norm") 

    # 5. PREDICTION & PARQUET STORAGE 
    print(f"\nCalculating Final Match Probabilities on {count_pairs} custom pairs...")
    splink_df = linker.inference.predict()                             

    # Save output: stream the results back to disk
    con.execute(f"COPY ({splink_df.physical_name}) TO 'data/final_ubid_matches.parquet' (FORMAT PARQUET)") 
    print("Saved scored matches to highly compressed Parquet: 'data/final_ubid_matches.parquet'")

    # TERMINAL OUTPUT DISPLAY
    df_predict = splink_df.as_pandas_dataframe()                        
    df_predict = df_predict[df_predict['match_probability'] >= 0.40]    
    df_predict = df_predict.sort_values(by='match_probability', ascending=False) 

    print("\n" + "="*80)
    print("                    KA-UBID TRIE + SPLINK SCORING RESULTS")
    print("="*80)
    
    for index, row in df_predict.iterrows():                            # Loop through the final results
        name_l = str(row['biz_name_norm_l'])[:20]                       
        name_r = str(row['biz_name_norm_r'])[:20]                       
        prob = row['match_probability'] * 100                           
        
        if prob >= 90.0:
            decision = "🟢 AUTO-LINK"                                    # Extremely high confidence; merge automatically
        elif prob >= 50.0:
            decision = "🟡 HUMAN REVIEW"                                 # Mid confidence; send for review
        else:
            decision = "🔴 REJECT"                                       # Low confidence; keep entities separate
            
        print(f"Match: {name_l:<20} <-> {name_r:<20} | Score: {prob:>6.2f}% | {decision}") 

    print("="*80)
    print("Run Complete. System is ready for Dashboard Integration.\n")

if __name__ == "__main__":
    run_scoring_engine()                                                