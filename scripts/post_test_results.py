import psycopg2
import json
import os
from datetime import datetime

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
json_path = os.path.join(script_dir, 'data_samples', 'test_results_sample.json')

# Check if file exists
if not os.path.exists(json_path):
    print(f"❌ Error: File not found at {json_path}")
    exit()

# Load JSON data
with open(json_path, 'r') as f:
    test_results = json.load(f)

print(f"📖 Loading {len(test_results)} test results from: {json_path}\n")

# Insert each test result
success_count = 0
fail_count = 0

for test_result in test_results:
    try:
        cursor.execute("""
            INSERT INTO test_results (
                asset_id, test_type_id, test_date, lab_name, notes,
                created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s
            ) RETURNING id
        """, (
            test_result.get('asset_id'),
            test_result.get('test_type_id'),
            test_result.get('test_date'),
            test_result.get('lab_name'),
            test_result.get('notes'),
            test_result.get('created_by', 1)  # Default to 1 if not provided
        ))
        
        # Get the inserted ID
        result_id = cursor.fetchone()[0]
        print(f"✅ Inserted test result ID: {result_id} - Date: {test_result.get('test_date')} - Lab: {test_result.get('lab_name')}")
        success_count += 1
        
    except psycopg2.Error as e:
        print(f"❌ Failed: {test_result.get('test_date')} - {e}")
        fail_count += 1
        conn.rollback()

# Commit and close
conn.commit()
cursor.close()
conn.close()

print(f"\n{'='*50}")
print(f"🎉 IMPORT SUMMARY - TEST RESULTS")
print(f"{'='*50}")
print(f"✅ Successfully inserted: {success_count}")
print(f"❌ Failed: {fail_count}")
print(f"{'='*50}")
