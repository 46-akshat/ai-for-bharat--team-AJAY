# import pandas as pd
# from sqlalchemy import create_engine
# import os
# from dotenv import load_dotenv

# # Resolve paths relative to this script's location
# script_dir = os.path.dirname(os.path.abspath(__file__))

# # Load credentials from project root .env
# env_path = os.path.join(script_dir, '..', '.env')
# load_dotenv(dotenv_path=env_path)
# DB_URL = os.getenv("DATABASE_URL")

# if not DB_URL:
#     print("Error: Could not load DATABASE_URL. Check .env file in project root.")
#     exit()

# engine = create_engine(DB_URL)

# # Map the exact normalized files to their database tables
# upload_plan = {
#     "norm_shops.csv": "shops",
#     "norm_factories.csv": "factories",
#     "norm_bescom.csv": "bescom"
# }

# print("Connecting to Supabase securely...")

# data_dir = os.path.join(script_dir, "..", "data")
# for filename, table_name in upload_plan.items():
#     file_path = os.path.join(data_dir, filename)
    
#     if os.path.exists(file_path):
#         try:
#             print(f"Uploading {filename} to the '{table_name}' table...")
#             df = pd.read_csv(file_path)
#             df.to_sql(name=table_name, con=engine, if_exists='append', index=False)
#             print(" Success!")
#         except Exception as e:
#             print(f" Error uploading {filename}: {e}")
#     else:
#         print(f" Missing file: {filename}")

# print(" Pipeline complete!")
# import pandas as pd
# from sqlalchemy import create_engine
# import os
# from dotenv import load_dotenv

# # Resolve paths relative to this script's location
# script_dir = os.path.dirname(os.path.abspath(__file__))

# # Load credentials from project root .env
# env_path = os.path.join(script_dir, '..', '.env')
# load_dotenv(dotenv_path=env_path)
# DB_URL = os.getenv("DATABASE_URL")

# if not DB_URL:
#     print("Error: Could not load DATABASE_URL. Check .env file in project root.")
#     exit()

# engine = create_engine(DB_URL)

# # Map the exact normalized files to their database tables
# upload_plan = {
#     "norm_shops.csv": "shops",
#     "norm_factories.csv": "factories",
#     "norm_bescom.csv": "bescom"
# }

# print("Connecting to Supabase securely...")

# data_dir = os.path.join(script_dir, "..", "data")
# for filename, table_name in upload_plan.items():
#     file_path = os.path.join(data_dir, filename)
    
#     if os.path.exists(file_path):
#         try:
#             print(f"Uploading {filename} to the '{table_name}' table...")
#             df = pd.read_csv(file_path)
#             df.to_sql(name=table_name, con=engine, if_exists='append', index=False)
#             print(" Success!")
#         except Exception as e:
#             print(f" Error uploading {filename}: {e}")
#     else:
#         print(f" Missing file: {filename}")

# print(" Pipeline complete!")
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

print("Connecting to Supabase securely...")

data_dir = os.path.join(script_dir, "..", "data")
parquet_path = os.path.join(data_dir, "normalized_records.parquet")

if os.path.exists(parquet_path):
    print(f"Found Parquet file. Reading data...")
    df = pd.read_parquet(parquet_path)
    
    # ≡ƒÜ¿ THE FIX: Drop the 'uri' column so Supabase doesn't freak out
    if 'uri' in df.columns:
        df = df.drop(columns=['uri'])

    # Split the dataframe based on the raw_id prefix
    df_shops = df[df['raw_id'].str.startswith('SHP', na=False)]
    df_factories = df[df['raw_id'].str.startswith('FAC', na=False)]
    df_bescom = df[df['raw_id'].str.startswith('BES', na=False)]

    print(f"Total Records: {len(df)} (Shops: {len(df_shops)}, Factories: {len(df_factories)}, BESCOM: {len(df_bescom)})")

    try:
        if not df_shops.empty:
            print("Uploading to 'shops' table...")
            df_shops.to_sql(name='shops', con=engine, if_exists='append', index=False)
            print("  Success!")

        if not df_factories.empty:
            print("Uploading to 'factories' table...")
            df_factories.to_sql(name='factories', con=engine, if_exists='append', index=False)
            print("  Success!")

        if not df_bescom.empty:
            print("Uploading to 'bescom' table...")
            df_bescom.to_sql(name='bescom', con=engine, if_exists='append', index=False)
            print("  Success!")

    except Exception as e:
        print(f" Error uploading: {e}")
else:
    print(f" Missing file: {parquet_path}. normalize.py pehle chalao!")

print(" Pipeline complete!")
