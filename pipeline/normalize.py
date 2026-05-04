import pandas as pd
import re
import uuid
import duckdb
import random

def clean_text(text):
    """Converts text to lowercase and removes all punctuation."""
    if pd.isna(text): # Handle empty cells (like our missing PANs) safely
        return text
    
    text = str(text).lower()
    # Regex to remove anything that isn't a letter, number, or space
    text = re.sub(r'[^a-z0-9\s]', '', text) 
    # Replace multiple spaces with a single space and trim edges
    text = re.sub(r'\s+', ' ', text).strip() 
    return text

def normalize_data():
    print(" Starting data normalization...")
    files = ['factories.csv', 'shops.csv', 'bescom.csv']
    all_dfs = []

    for file in files:
        try:
            # Read the raw data we generated earlier
            df = pd.read_csv(f"data/{file}")
            all_dfs.append(df)
            print(f" Loaded {file}")
            
        except FileNotFoundError:
            print(f" Error: data/{file} not found. Run generator.py first!")

    if not all_dfs:
        print(" No data found, exiting.")
        return

    # Combine all DataFrames
    combined_df = pd.concat(all_dfs, ignore_index=True)

    # Create new columns for the clean data
    combined_df['biz_name_norm'] = combined_df['biz_name_raw'].apply(clean_text)
    combined_df['address_norm'] = combined_df['address_raw'].apply(clean_text)

    # Drop the raw columns
    combined_df = combined_df.drop(columns=['biz_name_raw', 'address_raw'])

    # Create a 64-bit integer URI for each row (safe for Parquet BIGINT)
    combined_df['uri'] = [random.getrandbits(63) for _ in range(len(combined_df))]

    # Connect to DuckDB and create a parquet file
    output_file = "data/normalized_records.parquet"
    print(f" Exporting {len(combined_df)} rows to {output_file} via DuckDB...")
    
    con = duckdb.connect(database=':memory:')
    con.execute(f"COPY (SELECT * FROM combined_df) TO '{output_file}' (FORMAT PARQUET)")
    
    print(" Normalization and export complete!")

if __name__ == "__main__":
    normalize_data()