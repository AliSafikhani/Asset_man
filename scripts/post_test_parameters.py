import psycopg2
import json
import os
import random

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="webapp_db",
    user="postgres",
    password="sekert1!"
)

cursor = conn.cursor()

def get_existing_test_results(asset_id=6, test_type_id=124):
    """
    Get existing test results from the database
    """
    cursor.execute("""
        SELECT id, test_date, lab_name 
        FROM test_results 
        WHERE asset_id = %s AND test_type_id = %s
        ORDER BY id
    """, (asset_id, test_type_id))
    
    results = cursor.fetchall()
    return results

def generate_parameters_for_test_results(test_results):
    """
    Generate DGA parameters for existing test results
    """
    all_parameters = []
    
    for test_result_id, test_date, lab_name in test_results:
        # Generate base values
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
        
        # Calculate TDCG
        tdcg = round(
            base_values["h2"] + base_values["ch4"] + base_values["c2h2"] + 
            base_values["c2h4"] + base_values["c2h6"] + base_values["co"], 2
        )
        
        # Define fields
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
            {"name": "lab_name", "value": None, "unit": None, "limit_max": None, "field_value_text": lab_name or "SGS Testing Laboratory"}
        ]
        
        # Create parameter records
        for field in fields:
            param = {
                "test_result_id": test_result_id,
                "field_name": field["name"],
                "field_value": field.get("value"),
                "field_value_text": field.get("field_value_text"),
                "unit": field.get("unit"),
                "is_pass": field.get("value", 0) <= field.get("limit_max", 999999) if field.get("value") is not None else None,
                "limit_min": 0,
                "limit_max": field.get("limit_max"),
                "remarks": f"{field['name']} - {'Normal' if field.get('value', 0) <= field.get('limit_max', 999999) else 'High'} level"
            }
            all_parameters.append(param)
    
    return all_parameters

def main():
    print("🔍 Getting existing test results...")
    print("=" * 50)
    
    # Get existing test results
    test_results = get_existing_test_results(571, 124)
    
    if not test_results:
        print("❌ No test results found for asset_id=571 and test_type_id=124")
        print("   Please run the complete script first to create test results.")
        return
    
    print(f"✅ Found {len(test_results)} test results")
    print(f"   First 5 IDs: {[r[0] for r in test_results[:5]]}")
    
    # Generate parameters
    print("\n🔧 Generating DGA parameters...")
    parameters = generate_parameters_for_test_results(test_results)
    print(f"✅ Generated {len(parameters)} parameters")
    
    # Insert into database
    print("\n📊 Inserting parameters into database...")
    success_count = 0
    fail_count = 0
    
    for param in parameters:
        try:
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
        except psycopg2.Error as e:
            print(f"  ❌ Failed: {param['field_name']} - {e}")
            fail_count += 1
            conn.rollback()
    
    conn.commit()
    
    print(f"\n{'='*50}")
    print(f"✅ Inserted {success_count} parameters")
    print(f"❌ Failed {fail_count} parameters")
    print(f"{'='*50}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()