import os
import warnings
import duckdb
from splink import DuckDBAPI, Linker
import splink.comparison_library as cl

warnings.filterwarnings("ignore")

def run_scoring_engine():
    print("\n[KA-UBID] Initializing Scoring Engine...")

    con = duckdb.connect(database=':memory:')
    db_api = DuckDBAPI(connection=con)

    # 1. Load Data with Dummy Column Injection
    try:
        # THE FIX: We cast dummy uri1 and uri2 columns so Splink's SQL parser 
        # doesn't panic when it sees them in the subquery.
        con.execute("""
            CREATE OR REPLACE VIEW master_records AS 
            SELECT 
                *, 
                CAST(NULL AS BIGINT) AS uri1, 
                CAST(NULL AS BIGINT) AS uri2 
            FROM read_parquet('data/normalized_records.parquet')
        """)
        
        con.execute("""
            CREATE OR REPLACE VIEW candidate_pairs AS 
            SELECT uri1, uri2 FROM read_parquet('data/candidate_pairs.parquet')
        """)
        
        count_records = con.execute("SELECT COUNT(*) FROM master_records").fetchone()[0]
        count_pairs = con.execute("SELECT COUNT(*) FROM candidate_pairs").fetchone()[0]
        print(f"Loaded {count_records} master records.")
        print(f"Loaded {count_pairs} candidate pairs from C++ Trie engine.")
        
    except duckdb.IOException as e:
        print(f"Error loading files. Ensure C++ candidate_pairer.py and normalization have run!\nDetails: {e}")
        return

    # 2. Splink Settings
    settings = {
        "link_type": "dedupe_only",
        "unique_id_column_name": "uri", 
        
        # DuckDB Tuple-IN Hash Join
        "blocking_rules_to_generate_predictions": [
            "(l.uri, r.uri) IN (SELECT uri1, uri2 FROM candidate_pairs)"
        ],
        
        "comparisons": [
            cl.ExactMatch("pan"),
            cl.ExactMatch("gst"),
            cl.JaroWinklerAtThresholds("biz_name_norm", [0.9, 0.7]),
            cl.JaroWinklerAtThresholds("address_norm", [0.8])
        ],
        "retain_matching_columns": True,
        "retain_intermediate_calculation_columns": False 
    }

    # 3. Initialize & Train
    linker = Linker("master_records", settings, db_api=db_api)
    
    print("\nStarting Unsupervised Machine Learning (EM Algorithm)...")
    print("   -> Estimating random baseline (U-values)...")
    linker.training.estimate_u_using_random_sampling(max_pairs=10000)

    print("   -> Estimating parameters on PAN match...")
    linker.training.estimate_parameters_using_expectation_maximisation("l.pan = r.pan")
    
    print("   -> Estimating parameters on Name match...")
    linker.training.estimate_parameters_using_expectation_maximisation("l.biz_name_norm = r.biz_name_norm")

    # 4. Predict
    print(f"\nCalculating Final Match Probabilities on custom pairs...")
    splink_df = linker.inference.predict()

    # 5. Format Output & Export to Parquet
    final_output_query = f"""
        COPY (
            SELECT 
                uri_l AS URI_L, 
                uri_r AS URI_R, 
                match_probability AS score
            FROM {splink_df.physical_name}
        ) TO 'data/final_ubid_matches.parquet' (FORMAT PARQUET)
    """
    con.execute(final_output_query)
    print("Saved clean scores to 'data/final_ubid_matches.parquet' (URI_L, URI_R, score)")

    # 6. Terminal Output Display
    print("\n" + "="*80)
    print("                    KA-UBID TRIE + SPLINK SCORING RESULTS")
    print("="*80)
    
    preview_query = f"""
        SELECT 
            s.match_probability * 100 AS prob,
            l.biz_name_norm AS name_l,
            r.biz_name_norm AS name_r
        FROM {splink_df.physical_name} s
        JOIN master_records l ON s.uri_l = l.uri
        JOIN master_records r ON s.uri_r = r.uri
        WHERE s.match_probability >= 0.40
        ORDER BY prob DESC
        LIMIT 15
    """
    
    preview_rows = con.execute(preview_query).fetchall()
    
    for row in preview_rows:
        prob, name_l, name_r = row
        name_l = str(name_l)[:20] if name_l else "NULL"
        name_r = str(name_r)[:20] if name_r else "NULL"
        
        if prob >= 90.0:
            decision = "🟢 AUTO-LINK"
        elif prob >= 50.0:
            decision = "🟡 HUMAN REVIEW"
        else:
            decision = "🔴 REJECT"
            
        print(f"Match: {name_l:<20} <-> {name_r:<20} | Score: {prob:>6.2f}% | {decision}")

    print("="*80)
    print("Run Complete. Output ready for decision routing.\n")

if __name__ == "__main__":
    run_scoring_engine()