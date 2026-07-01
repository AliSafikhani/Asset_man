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
json_path = os.path.join(script_dir, 'data_samples', 'gen_trf.json')

# Check if file exists
if not os.path.exists(json_path):
    print(f"❌ Error: File not found at {json_path}")
    exit()

# Load JSON data
with open(json_path, 'r') as f:
    assets = json.load(f)

print(f"📖 Loading {len(assets)} assets from: {json_path}\n")

# Insert each asset
success_count = 0
fail_count = 0

for asset in assets:
    try:
        # Convert asset_type to lowercase
        asset_type = asset.get('asset_type', '').lower()
        
        # Convert criticality_level to lowercase
        criticality = asset.get('criticality_level', 'medium').lower()
        
        cursor.execute("""
            INSERT INTO assets (
                plant_id, asset_type, asset_name, asset_code, asset_tag,
                manufacturer, model, serial_number, manufacturing_year,
                installation_date, commissioning_date, operational_status,
                asset_health_score, criticality_level, location_within_plant,
                gps_coordinates, bay_number, substation_name,
                technical_documentation_url, photo_url, nameplate_data,
                warranty_start_date, warranty_end_date, expected_life_years,
                remaining_life_years, metadata, created_by, updated_by, extra_data
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s
            )
        """, (
            asset.get('plant_id'),
            asset_type,  # lowercase
            asset.get('asset_name'),
            asset.get('asset_code'),
            asset.get('asset_tag'),
            asset.get('manufacturer'),
            asset.get('model'),
            asset.get('serial_number'),
            asset.get('manufacturing_year'),
            asset.get('installation_date'),
            asset.get('commissioning_date'),
            asset.get('operational_status', 'active'),
            asset.get('asset_health_score'),
            criticality,  # lowercase
            asset.get('location_within_plant'),
            asset.get('gps_coordinates'),
            asset.get('bay_number'),
            asset.get('substation_name'),
            asset.get('technical_documentation_url'),
            asset.get('photo_url'),
            json.dumps(asset.get('nameplate_data', {})),
            asset.get('warranty_start_date'),
            asset.get('warranty_end_date'),
            asset.get('expected_life_years'),
            asset.get('remaining_life_years'),
            json.dumps(asset.get('metadata', {})),
            asset.get('created_by', 1),
            asset.get('updated_by', 1),
            json.dumps(asset.get('extra_data', {}))
        ))
        print(f"✅ Inserted: {asset.get('asset_name')} ({asset.get('asset_code')})")
        success_count += 1
        
    except psycopg2.Error as e:
        print(f"❌ Failed: {asset.get('asset_name')} - {e}")
        fail_count += 1
        conn.rollback()

# Commit and close
conn.commit()
cursor.close()
conn.close()

print(f"\n{'='*50}")
print(f"🎉 IMPORT SUMMARY")
print(f"{'='*50}")
print(f"✅ Successfully inserted: {success_count}")
print(f"❌ Failed: {fail_count}")
print(f"{'='*50}")