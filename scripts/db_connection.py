import psycopg2
from psycopg2 import sql, extras
import os
from dotenv import load_dotenv

# Load environment variables (optional - for security)
load_dotenv()

class DatabaseConnection:
    def __init__(self):
        self.connection_params = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'webapp_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'sekert1!'),
            'port': os.getenv('DB_PORT', '5432')
        }
    
    def get_connection(self):
        """Establish and return database connection"""
        try:
            conn = psycopg2.connect(**self.connection_params)
            return conn
        except psycopg2.Error as e:
            print(f"Error connecting to database: {e}")
            return None
    
    def execute_query(self, query, params=None, fetch=True):
        """Execute query and return results"""
        conn = self.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(cursor_factory=extras.DictCursor)
            cursor.execute(query, params or ())
            
            if fetch:
                results = cursor.fetchall()
                return results
            else:
                conn.commit()
                return True
                
        except psycopg2.Error as e:
            print(f"Query execution error: {e}")
            return None
        finally:
            cursor.close()
            conn.close()