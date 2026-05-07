import pandas as pd
import sys
import os

def inspect_parquet(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist.")
        return

    try:
        # Load the parquet file
        df = pd.read_parquet(file_path)
        
        print(f"\n{'='*50}")
        print(f"📄 Inspecting Parquet File: {file_path}")
        print(f"{'='*50}")
        print(f"Total Rows: {len(df)}")
        print(f"Total Columns: {len(df.columns)}")
        
        print("\n📊 Column Info:")
        # Provide a quick summary of columns and their types
        info_df = pd.DataFrame({
            'Type': df.dtypes,
            'Missing Values': df.isnull().sum(),
            'Unique Values': df.nunique()
        })
        print(info_df)
        
        print("\n👀 First 5 rows:")
        print(df.head())
        print(f"{'='*50}\n")
        
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Inspect files provided as arguments
        for arg in sys.argv[1:]:
            inspect_parquet(arg)
    else:
        # Default fallback
        print("No file specified. Defaulting to 'data/normalized_records.parquet'...")
        inspect_parquet("data/normalized_records.parquet")
