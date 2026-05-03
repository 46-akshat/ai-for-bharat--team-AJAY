import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

# Get the Supabase connection string from your environment variables
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create the SQLAlchemy engine (The core connection to Supabase)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a SessionLocal class (This creates individual database conversations)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the Base class that our models.py inherits from
Base = declarative_base()