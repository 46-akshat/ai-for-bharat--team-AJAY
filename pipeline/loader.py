import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Resolve paths relative to this script's location
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load credentials from project root .env
env_path = os.path.join(script_dir, '..', '.env')
load_dotenv(dotenv_path=env_path)
DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    print("Error: Could not load DATABASE_URL. Check .env file in project root.")
    exit()

engine = create_engine(DB_URL)

# Map the exact normalized files to their database tables
upload_plan = {
    "norm_shops.csv": "shops",
    "norm_factories.csv": "factories",
    "norm_bescom.csv": "bescom"
}

print("Connecting to Supabase securely...")

data_dir = os.path.join(script_dir, "..", "data")
for filename, table_name in upload_plan.items():
    file_path = os.path.join(data_dir, filename)
    
    if os.path.exists(file_path):
        try:
            print(f"Uploading {filename} to the '{table_name}' table...")
            df = pd.read_csv(file_path)
            df.to_sql(name=table_name, con=engine, if_exists='append', index=False)
            print(" Success!")
        except Exception as e:
            print(f" Error uploading {filename}: {e}")
    else:
        print(f" Missing file: {filename}")

print(" Pipeline complete!")