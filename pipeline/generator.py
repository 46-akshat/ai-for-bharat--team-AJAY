import pandas as pd
import random
from faker import Faker
import uuid
import os


# we need to build a messy data/broken data to test the matching engine
#we will create three distinct datasets(factories.csv,shops.csv and bescom.csv) with overlapping and messy information
#to create real world simulations

# Initialize Faker with Indian locale
fake = Faker('en_IN')

# Karnataka-specific constants
KARNATAKA_PINS = [str(pin) for pin in range(560001, 590000, 20)]
KARNATAKA_CITIES = ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi']

def create_raw_record(base_biz, dept_prefix):
    """Generates a record for a specific department based on a 'true' business."""
    return {
        "raw_id": f"{dept_prefix}_{uuid.uuid4().hex[:6]}",
        "biz_name_raw": base_biz['name'],
        "address_raw": base_biz['address'],
        "pin": base_biz['pin'],
        "pan": base_biz['pan'],
        "gst": base_biz['gst'],
        "phone": base_biz['phone']
    }

def generate_data():
    print(" Generating synthetic business data for Karnataka...")
    
    # 1. Create a pool of 'True' businesses
    true_businesses = []
    for _ in range(200):
        true_businesses.append({
            "name": fake.company(),
            "address": f"{fake.street_address()}, {random.choice(KARNATAKA_CITIES)}",
            "pin": random.choice(KARNATAKA_PINS),
            "pan": fake.bothify(text='?????####?').upper(),
            "gst": fake.bothify(text='29?????####?1Z?').upper(),
            "phone": fake.numerify(text='##########')
        })

    # 2. INJECT FALSE POSITIVES (Same PIN, Similar Name, Different PAN)
    # We take the first 20 businesses and create a "fake twin" for them
    for i in range(20): 
        base = true_businesses[i]
        # Keep the first word of the name, but change the ending
        similar_name = base['name'].split(' ')[0] + " " + random.choice(["Logistics", "Traders", "Solutions", "Global"])
        
        true_businesses.append({
            "name": similar_name,
            "address": f"{fake.street_address()}, {random.choice(KARNATAKA_CITIES)}",
            "pin": base['pin'], # TRICK: Same PIN
            "pan": fake.bothify(text='?????####?').upper(), # TRICK: Different PAN
            "gst": fake.bothify(text='29?????####?1Z?').upper(),
            "phone": fake.numerify(text='##########')
        })

    depts = {"factories": "FAC", "shops": "SHP", "bescom": "BES"}
    results = {dept: [] for dept in depts}

    for biz in true_businesses:
        # Create overlaps across departments
        for dept, prefix in depts.items():
            if random.random() > 0.3:  # 70% chance a business exists in this dept
                record = create_raw_record(biz, prefix)
                
                # 3. INJECT FUZZY NOISE (Typos in the name)
                if random.random() < 0.4:
                    record["biz_name_raw"] = record["biz_name_raw"].split(' ')[0] + " ENT"
                
                # 4. INJECT MISSING DATA (Null PAN/GST)
                if random.random() < 0.15:
                    record[random.choice(["pan", "gst"])] = None
                
                results[dept].append(record)

    # Save to CSVs
    for dept, data in results.items():
        df = pd.DataFrame(data)
        os.makedirs("data",exist_ok=True)
        df.to_csv(f"data/{dept}.csv", index=False)
        print(f" Generated {len(df)} records for {dept}.csv")

if __name__ == "__main__":
    generate_data()