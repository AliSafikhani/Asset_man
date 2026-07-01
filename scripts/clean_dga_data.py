import psycopg2
import json

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="webapp_db",
    user="postgres",
    password="sekert1!"
)

cursor = conn.cursor()

def clean_dga_data():
    """
    Clean up wrong DGA data from the database
    This will delete test_parameters and test_results for DGA tests
    """
    print("🔧 Starting DGA Data Cleanup...")
    print("=" * 50)
    
    try:
        # First, let's check what needs to be deleted
        print("📊 Checking current DGA data...")
        
        # Check test_parameters with wrong fields
        cursor.execute("""
            SELECT COUNT(*) 
            FROM test_parameters 
            WHERE field_name IN (
                'resistivity', 'interfacial_tension', 'acid_number',
                'viscosity_40c', 'viscosity_100c', 'flash_point',
                'pour_point', 'specific_gravity', 'oxidation_stability',
                'particle_count_4um', 'particle_count_6um', 'particle_count_14um',
                'sludge_content', 'color', 'visual_appearance', 'odor',
                'moisture_content', 'anti_foam_property', 'bearing_wear_metals'
            )
        """)
        wrong_params_count = cursor.fetchone()[0]
        print(f"  ❌ Wrong test_parameters found: {wrong_params_count}")
        
        # Check test_parameters with DGA fields but for wrong test_result_id
        cursor.execute("""
            SELECT COUNT(*) 
            FROM test_parameters 
            WHERE field_name IN ('h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2', 'tdcg', 'sample_temp', 'lab_name')
            AND test_result_id = 9
        """)
        existing_dga_count = cursor.fetchone()[0]
        print(f"  📋 Existing DGA parameters for test_result_id=9: {existing_dga_count}")
        
        # Check test_results for test_type_id = 124 (DGA)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM test_results 
            WHERE test_type_id = 124
        """)
        test_results_count = cursor.fetchone()[0]
        print(f"  📋 Test results with test_type_id=124: {test_results_count}")
        
        print("\n" + "=" * 50)
        print("⚠️  WARNING: This will delete the following:")
        print(f"  - All test_parameters with wrong DGA fields")
        print(f"  - All test_parameters for test_result_id=9")
        print(f"  - All test_results with test_type_id=124")
        print("=" * 50)
        
        # Confirm deletion
        confirm = input("\nDo you want to proceed with deletion? (yes/no): ")
        
        if confirm.lower() != 'yes':
            print("❌ Operation cancelled by user.")
            return False
        
        # Delete wrong test_parameters
        print("\n🗑️  Deleting wrong test_parameters...")
        cursor.execute("""
            DELETE FROM test_parameters 
            WHERE field_name IN (
                'resistivity', 'interfacial_tension', 'acid_number',
                'viscosity_40c', 'viscosity_100c', 'flash_point',
                'pour_point', 'specific_gravity', 'oxidation_stability',
                'particle_count_4um', 'particle_count_6um', 'particle_count_14um',
                'sludge_content', 'color', 'visual_appearance', 'odor',
                'moisture_content', 'anti_foam_property', 'bearing_wear_metals'
            )
        """)
        deleted_wrong = cursor.rowcount
        print(f"  ✅ Deleted {deleted_wrong} wrong test_parameters")
        
        # Delete existing DGA test_parameters for test_result_id=9
        print("\n🗑️  Deleting existing DGA test_parameters for test_result_id=9...")
        cursor.execute("""
            DELETE FROM test_parameters 
            WHERE test_result_id = 9
            AND field_name IN ('h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2', 'tdcg', 'sample_temp', 'lab_name')
        """)
        deleted_dga = cursor.rowcount
        print(f"  ✅ Deleted {deleted_dga} existing DGA test_parameters for test_result_id=9")
        
        # Also delete any other DGA test_parameters that might be wrong
        print("\n🗑️  Checking for other DGA test_parameters to clean...")
        cursor.execute("""
            DELETE FROM test_parameters 
            WHERE test_result_id IN (
                SELECT id FROM test_results WHERE test_type_id = 124
            )
        """)
        deleted_other = cursor.rowcount
        print(f"  ✅ Deleted {deleted_other} other DGA test_parameters")
        
        # Delete test_results for DGA tests
        print("\n🗑️  Deleting DGA test_results...")
        cursor.execute("""
            DELETE FROM test_results 
            WHERE test_type_id = 124
        """)
        deleted_results = cursor.rowcount
        print(f"  ✅ Deleted {deleted_results} DGA test_results")
        
        # Commit the transaction
        conn.commit()
        print("\n" + "=" * 50)
        print("✅ DGA Data Cleanup Complete!")
        print("=" * 50)
        print(f"Summary:")
        print(f"  - Deleted {deleted_wrong} wrong test_parameters")
        print(f"  - Deleted {deleted_dga} existing DGA test_parameters for test_result_id=9")
        print(f"  - Deleted {deleted_other} other DGA test_parameters")
        print(f"  - Deleted {deleted_results} DGA test_results")
        print("=" * 50)
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error during cleanup: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def check_current_data():
    """
    Check what's currently in the database before cleanup
    """
    print("\n📊 CURRENT DATABASE STATUS:")
    print("=" * 50)
    
    try:
        # Check test_parameters count by field_type
        cursor.execute("""
            SELECT field_name, COUNT(*) 
            FROM test_parameters 
            WHERE test_result_id = 9
            GROUP BY field_name 
            ORDER BY field_name
        """)
        params = cursor.fetchall()
        print(f"Test_parameters for test_result_id=9:")
        for field_name, count in params:
            print(f"  {field_name}: {count}")
        
    except psycopg2.Error as e:
        print(f"❌ Error checking data: {e}")

if __name__ == "__main__":
    print("🔍 DGA Data Cleanup Tool")
    print("=" * 50)
    print("This tool will clean up wrong DGA data from your database.")
    print("It will remove:")
    print("  1. Test parameters with wrong fields (resistivity, viscosity, etc.)")
    print("  2. Existing DGA parameters for test_result_id=9")
    print("  3. All test_results with test_type_id=124")
    print("=" * 50)
    
    # Check current data
    check_current_data()
    
    print("\n" + "=" * 50)
    response = input("Do you want to continue with the cleanup? (yes/no): ")
    if response.lower() == 'yes':
        clean_dga_data()
    else:
        print("❌ Operation cancelled.")