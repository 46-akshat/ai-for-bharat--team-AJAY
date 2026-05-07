import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Resolve paths relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))


# The .env file is at project_root/.env, loader.py is at project_root/backend/pipeline/loader.py
# So we need to go up two directories from this script's location
project_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
env_path = os.path.join(project_root, '.env')

# Load credentials from project root .env
load_dotenv(dotenv_path=env_path)
DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    print("Error: Could not load DATABASE_URL. Check .env file in project root.")
    exit()

engine = create_engine(DB_URL)

print("Connecting to Supabase securely...")

# --- DATA DIR PATH FIX ---
# The data directory is at project_root/backend/pipeline/data
# So we resolve it relative to this script's location
# This works regardless of where the script is run from

data_dir = os.path.join(script_dir, 'data')
canonical_csv_path = os.path.join(data_dir, "canonical_records.csv")
# -------------------------


if os.path.exists(canonical_csv_path):
    print(f"Found canonical_records.csv. Reading data...")
    df_canonical = pd.read_csv(canonical_csv_path)
    print(f"Total Canonical Records: {len(df_canonical)}")
    try:
        print("Uploading to 'canonical_record' table...")
        df_canonical.to_sql(name='canonical_record', con=engine, if_exists='append', index=False)
        print("  Success!")
    except Exception as e:
        print(f" Error uploading canonical records: {e}")
else:
    print(f" Missing file: {canonical_csv_path}")

print(" Pipeline complete!")