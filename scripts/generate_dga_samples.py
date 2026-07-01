import psycopg2
import json
import os
import random
from datetime import datetime, timedelta

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="webapp_db",
    user="postgres",
    password="sekert1!"
)

cursor = conn.cursor()

def get_existing_test_result_ids(asset_id=571, test_type_id=124):
    """
    Get all existing test_result_ids for the given asset and test type
    """
    cursor.execute("""
        SELECT id FROM test_results 
        WHERE asset_id = %s AND test_type_id = %s
        ORDER BY id
    """, (asset_id, test_type_id))
    
    results = cursor.fetchall()
    return [r[0] for r in results]

def get_all_test_result_ids():
    """
    Get ALL test_result_ids from the database (for any asset/test type)
    """
    cursor.execute("""
        SELECT id FROM test_results 
        ORDER BY id
    """)
    
    results = cursor.fetchall()
    return [r[0] for r in results]

def create_missing_test_results(needed_ids, asset_id=571, test_type_id=124):
    """
    Create test results for IDs that don't exist
    """
    print(f"\n🔍 Checking for missing test_result_ids...")
    
    existing_ids = get_existing_test_result_ids(asset_id, test_type_id)
    missing_ids = [id for id in needed_ids if id not in existing_ids]
    
    if not missing_ids:
        print(f"  ✅ All {len(needed_ids)} test_result_ids already exist!")
        return []
    
    print(f"  ⚠️  Found {len(missing_ids)} missing test_result_ids: {missing_ids[:10]}{'...' if len(missing_ids) > 10 else ''}")
    
    # List of lab names
    lab_names = [
        "SGS Testing Laboratory",
        "Intertek Testing Services",
        "ALS Laboratory Group",
        "Eurofins Scientific",
        "Bureau Veritas",
        "TÜV Rheinland",
        "DNV GL",
        "UL LLC",
        "DEKRA",
        "NTS (National Technical Systems)"
    ]
    
    # Notes for different test scenarios
    notes_list = [
        "Routine DGA test - Quarterly maintenance",
        "Monthly DGA monitoring - Normal operation",
        "DGA test - Transformer loaded at 85%",
        "Routine DGA test - Summer operation",
        "Monthly DGA monitoring - High ambient temperature",
        "Routine DGA test - Post lightning event",
        "Quarterly DGA analysis - Peak load season",
        "Routine DGA test - Before maintenance",
        "Monthly DGA monitoring - Cooling system check",
        "Routine DGA test - Winter preparation",
        "Year-end DGA analysis - Full inspection",
        "Special DGA test - After load increase"
    ]
    
    created_ids = []
    start_date = datetime.now() - timedelta(days=365)
    
    print(f"\n📊 Creating {len(missing_ids)} missing test results...")
    
    for i, test_id in enumerate(missing_ids):
        try:
            # Generate test date
            test_date = start_date + timedelta(days=i*3.65)
            lab_name = random.choice(lab_names)
            notes = random.choice(notes_list)
            
            # Insert test result with specific ID
            cursor.execute("""
                INSERT INTO test_results (
                    id, asset_id, test_type_id, test_date, lab_name, notes, created_by
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                test_id,
                asset_id,
                test_type_id,
                test_date.date(),
                lab_name,
                notes,
                1
            ))
            
            created_ids.append(test_id)
            
            if i < 5 or i % 10 == 0:
                print(f"  ✅ Created test_result ID: {test_id} - Date: {test_date.date()}")
            
        except psycopg2.Error as e:
            if "duplicate key" in str(e):
                print(f"  ⚠️  ID {test_id} already exists (skipping)")
            else:
                print(f"  ❌ Failed to create test_result {test_id}: {e}")
            conn.rollback()
    
    print(f"\n  ✅ Created {len(created_ids)} new test results")
    return created_ids

def generate_dga_parameters_for_ids(test_result_ids):
    """
    Generate DGA parameters for a list of test_result_ids
    """
    print(f"\n🔧 Generating DGA parameters for {len(test_result_ids)} test results...")
    print("=" * 50)
    
    all_parameters = []
    
    for idx, test_result_id in enumerate(test_result_ids):
        # Generate base values with some randomness
        base_values = {
            "h2": round(10.0 + random.uniform(-3, 15), 2),
            "ch4": round(15.0 + random.uniform(-5, 20), 2),
            "c2h2": round(0.5 + random.uniform(-0.3, 2.0), 2),
            "c2h4": round(5.0 + random.uniform(-2, 10), 2),
            "c2h6": round(20.0 + random.uniform(-5, 25), 2),
            "co": round(20.0 + random.uniform(-5, 15), 2),
            "co2": round(50.0 + random.uniform(-10, 50), 2),
            "o2": round(200.0 + random.uniform(-50, 150), 2),
            "n2": round(1000.0 + random.uniform(-100, 400), 2),
            "sample_temp": round(60.0 + random.uniform(-5, 15), 2)
        }
        
        # Ensure no negative values
        for key in base_values:
            if base_values[key] < 0:
                base_values[key] = 0.1
        
        # Calculate TDCG (sum of combustible gases)
        tdcg = round(
            base_values["h2"] + base_values["ch4"] + base_values["c2h2"] + 
            base_values["c2h4"] + base_values["c2h6"] + base_values["co"], 2
        )
        
        # Lab name
        lab_names = [
            "SGS Testing Laboratory",
            "Intertek Testing Services", 
            "ALS Laboratory Group",
            "Eurofins Scientific",
            "Bureau Veritas",
            "TÜV Rheinland",
            "DNV GL"
        ]
        lab_name = random.choice(lab_names)
        
        # Define all 12 DGA fields
        fields = [
            {"name": "h2", "value": base_values["h2"], "unit": "ppm", "limit_max": 100},
            {"name": "ch4", "value": base_values["ch4"], "unit": "ppm", "limit_max": 50},
            {"name": "c2h2", "value": base_values["c2h2"], "unit": "ppm", "limit_max": 10},
            {"name": "c2h4", "value": base_values["c2h4"], "unit": "ppm", "limit_max": 20},
            {"name": "c2h6", "value": base_values["c2h6"], "unit": "ppm", "limit_max": 30},
            {"name": "co", "value": base_values["co"], "unit": "ppm", "limit_max": 250},
            {"name": "co2", "value": base_values["co2"], "unit": "ppm", "limit_max": 3000},
            {"name": "o2", "value": base_values["o2"], "unit": "ppm", "limit_max": 5000},
            {"name": "n2", "value": base_values["n2"], "unit": "ppm", "limit_max": 150000},
            {"name": "tdcg", "value": tdcg, "unit": "ppm", "limit_max": 5000},
            {"name": "sample_temp", "value": base_values["sample_temp"], "unit": "°C", "limit_max": 80},
            {"name": "lab_name", "value": None, "unit": None, "limit_max": None, "field_value_text": lab_name}
        ]
        
        # Create parameter records
        for field in fields:
            # Handle the comparison safely
            field_value = field.get('value')
            limit_max = field.get('limit_max')
            
            # Determine if pass - only compare if both values are not None
            if field_value is not None and limit_max is not None:
                is_pass = field_value <= limit_max
            else:
                is_pass = None
            
            param = {
                "test_result_id": test_result_id,
                "field_name": field["name"],
                "field_value": field.get("value"),
                "field_value_text": field.get("field_value_text"),
                "unit": field.get("unit"),
                "is_pass": is_pass,
                "limit_min": 0,
                "limit_max": field.get("limit_max"),
                "remarks": f"{field['name']} - {('Normal' if is_pass else 'High') if is_pass is not None else 'N/A'} level"
            }
            all_parameters.append(param)
        
        if (idx + 1) <= 5:
            print(f"  ✅ Generated 12 parameters for test_result_id: {test_result_id}")
        elif (idx + 1) % 20 == 0:
            print(f"  ✅ Generated parameters for {idx + 1} test results so far...")
    
    print(f"\n  ✅ Total parameters generated: {len(all_parameters)}")
    return all_parameters

def insert_parameters_to_db(parameters):
    """
    Insert parameters into the database with proper error handling
    """
    print(f"\n📊 Inserting {len(parameters)} DGA parameters into database...")
    print("=" * 50)
    
    success_count = 0
    fail_count = 0
    
    # Group parameters by test_result_id for better tracking
    param_groups = {}
    for param in parameters:
        tid = param['test_result_id']
        if tid not in param_groups:
            param_groups[tid] = []
        param_groups[tid].append(param)
    
    print(f"  📋 Parameters grouped by {len(param_groups)} test_result_ids")
    
    for test_id, params in param_groups.items():
        try:
            # Insert all parameters for this test_result_id in a transaction
            for param in params:
                cursor.execute("""
                    INSERT INTO test_parameters (
                        test_result_id, field_name, field_value, field_value_text,
                        unit, is_pass, limit_min, limit_max, remarks
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    param['test_result_id'],
                    param['field_name'],
                    param['field_value'],
                    param.get('field_value_text'),
                    param.get('unit'),
                    param.get('is_pass'),
                    param.get('limit_min'),
                    param.get('limit_max'),
                    param.get('remarks')
                ))
                success_count += 1
            
            # Commit after each test_result_id group
            conn.commit()
            
        except psycopg2.Error as e:
            print(f"  ❌ Failed to insert parameters for test_result_id {test_id}: {e}")
            fail_count += len(params)
            conn.rollback()
    
    return success_count, fail_count

def main():
    print("🚀 Smart DGA Data Generator")
    print("=" * 70)
    print("This script will:")
    print("  1. Check existing test_result_ids in your database")
    print("  2. Create missing test results if needed")
    print("  3. Generate 12 DGA parameters for each test result")
    print("  4. Insert all parameters into the database")
    print("=" * 70)
    
    # Step 1: Get all existing test_result_ids
    existing_ids = get_all_test_result_ids()
    print(f"\n📊 Found {len(existing_ids)} existing test_result_ids in database")
    if existing_ids:
        print(f"   First 10: {existing_ids[:10]}")
        print(f"   Last 10: {existing_ids[-10:]}")
    
    # Step 2: Define which IDs we want to use for DGA data
    # Use existing IDs if available, or create new ones
    if len(existing_ids) >= 100:
        # Use the first 100 existing IDs
        test_ids_to_use = existing_ids[:100]
        print(f"\n✅ Using first 100 existing test_result_ids")
    else:
        # We need to create IDs from 1 to 100
        needed_ids = list(range(1, 101))  # IDs 1 to 100
        
        # Create missing test results
        print(f"\n⚠️  Only {len(existing_ids)} test results exist. Need {100 - len(existing_ids)} more.")
        print(f"   Creating test results with IDs: 1 to 100")
        
        created_ids = create_missing_test_results(needed_ids, asset_id=571, test_type_id=124)
        
        # Get updated list of existing IDs
        existing_ids = get_all_test_result_ids()
        test_ids_to_use = [id for id in range(1, 101) if id in existing_ids]
        
        print(f"\n📊 Now have {len(test_ids_to_use)} test results available")
    
    # Step 3: Generate parameters
    all_parameters = generate_dga_parameters_for_ids(test_ids_to_use)
    
    # Step 4: Save to JSON (optional backup)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, 'data_samples')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    json_path = os.path.join(data_dir, 'dga_parameters_complete.json')
    with open(json_path, 'w') as f:
        json.dump(all_parameters, f, indent=2)
    print(f"\n💾 Saved parameters to: {json_path}")
    
    # Step 5: Insert into database
    success_count, fail_count = insert_parameters_to_db(all_parameters)
    
    # Final summary
    print("\n" + "=" * 70)
    print("🎉 COMPLETE - DGA DATA IMPORT")
    print("=" * 70)
    print(f"📊 Test Results Used: {len(test_ids_to_use)}")
    print(f"📊 Parameters Generated: {len(all_parameters)}")
    print(f"📊 Parameters Inserted: {success_count}")
    print(f"📊 Parameters Failed: {fail_count}")
    print(f"📁 JSON Backup: {json_path}")
    print("=" * 70)
    
    # Show sample of inserted data
    if success_count > 0:
        print("\n📋 Sample of inserted parameters:")
        try:
            cursor.execute("""
                SELECT test_result_id, field_name, field_value, unit, is_pass
                FROM test_parameters 
                WHERE test_result_id = %s
                LIMIT 12
            """, (test_ids_to_use[0],))
            
            samples = cursor.fetchall()
            for sample in samples:
                print(f"  Test {sample[0]}: {sample[1]} = {sample[2]} {sample[3]} (Pass: {sample[4]})")
        except:
            print("  Could not retrieve sample data")
    
    # Close connection
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()