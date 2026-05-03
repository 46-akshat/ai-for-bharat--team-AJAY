import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Load credentials securely
load_dotenv(dotenv_path=os.path.join("..", "backend", ".env"))
DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    print(" Error: Could not load DATABASE_URL.")
    exit()

engine = create_engine(DB_URL)

# Map the exact normalized files to their database tables
upload_plan = {
    "norm_shops.csv": "shops",
    "norm_factories.csv": "factories",
    "norm_bescom.csv": "bescom"
}

print("Connecting to Supabase securely...")

for filename, table_name in upload_plan.items():
    file_path = os.path.join("data", filename)
    
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