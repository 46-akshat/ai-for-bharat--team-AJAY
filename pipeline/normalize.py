import pandas as pd
import re

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

    for file in files:
        try:
            # Read the raw data we generated earlier
            df = pd.read_csv(f"data/{file}")
            
            # Create new columns for the clean data (preserving the raw data)
            df['biz_name_norm'] = df['biz_name_raw'].apply(clean_text)
            df['address_norm'] = df['address_raw'].apply(clean_text)

            # Save the cleaned data to a new file so we don't overwrite the original
            output_file = f"data/norm_{file}"
            df.to_csv(output_file, index=False)
            print(f" Normalized {file} -> saved as norm_{file}")
            
        except FileNotFoundError:
            print(f" Error: data/{file} not found. Run generator.py first!")

if __name__ == "__main__":
    normalize_data()