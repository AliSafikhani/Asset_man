# get_structure.py
import psycopg2
from psycopg2 import extras

def get_table_structure():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="webapp_db",
            user="postgres",
            password="sekert1!"
        )
        
        cursor = conn.cursor(cursor_factory=extras.DictCursor)
        
        # Get companies table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'test_parameters'
            ORDER BY ordinal_position;
        """)
        
        results = cursor.fetchall()
        
        print("\t TABLE STRUCTURE:")
        print("=" * 60)
        for row in results:
            print(f"Column: {row['column_name']:<20} Type: {row['data_type']:<20} Nullable: {row['is_nullable']} Default: {row['column_default']}")
        
        cursor.close()
        conn.close()
        
        return results
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return None

if __name__ == "__main__":
    get_table_structure()