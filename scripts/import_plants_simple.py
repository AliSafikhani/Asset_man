import psycopg2
import json
import os

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="webapp_db",
    user="postgres",
    password="sekert1!"
)

cursor = conn.cursor()

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Build the path to the JSON file
json_path = os.path.join(script_dir, 'data_samples', 'plants_sample.json')

# Check if file exists
if not os.path.exists(json_path):
    print(f"❌ Error: File not found at {json_path}")
    exit()

# Load JSON data
with open(json_path, 'r') as f:
    plants = json.load(f)

print(f"📖 Loading {len(plants)} plants from: {json_path}\n")

# Insert each plant
success_count = 0
fail_count = 0

for plant in plants:
    try:
        cursor.execute("""
            INSERT INTO plants (
                company_id, name, code, plant_type,
                plant_manager_name, plant_manager_email, plant_manager_phone,
                address_line1, address_line2, city, state,
                country, postal_code, gps_coordinates,
                commissioning_date, operational_status, installed_capacity_mw,
                metadata, location, extra_data
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
        """, (
            plant.get('company_id'),
            plant.get('name'),
            plant.get('code'),
            plant.get('plant_type'),
            plant.get('plant_manager_name'),
            plant.get('plant_manager_email'),
            plant.get('plant_manager_phone'),
            plant.get('address_line1'),
            plant.get('address_line2'),
            plant.get('city'),
            plant.get('state'),
            plant.get('country'),
            plant.get('postal_code'),
            plant.get('gps_coordinates'),
            plant.get('commissioning_date'),
            plant.get('operational_status', 'operational'),
            plant.get('installed_capacity_mw'),
            json.dumps(plant.get('metadata', {})),
            plant.get('location'),
            json.dumps(plant.get('extra_data', {}))
        ))
        print(f"✅ Inserted: {plant.get('name')} ({plant.get('code')})")
        success_count += 1
        
    except psycopg2.Error as e:
        print(f"❌ Failed: {plant.get('name')} - {e}")
        fail_count += 1
        conn.rollback()

# Commit and close
conn.commit()
cursor.close()
conn.close()

print(f"\n🎉 Done!")
print(f"✅ Successfully inserted: {success_count}")
print(f"❌ Failed: {fail_count}")