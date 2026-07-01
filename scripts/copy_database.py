import psycopg2
from psycopg2 import sql, OperationalError
import subprocess
import sys

def copy_database():
    # Database configuration
    source_db = "am_db"
    target_db = "webapp_db"
    password = "sekert1!"
    user = "postgres"  # Change this to your PostgreSQL username
    host = "localhost"  # Change this if your database is on a different host
    port = "5432"  # Default PostgreSQL port
    
    try:
        # Connect to the default 'postgres' database to perform admin tasks
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if source database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (source_db,))
        if not cursor.fetchone():
            print(f"Error: Source database '{source_db}' does not exist!")
            return
        
        # Check if target database already exists and drop it if it does
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
        if cursor.fetchone():
            print(f"Target database '{target_db}' already exists. Dropping it...")
            # Terminate all connections to the target database
            cursor.execute(sql.SQL("""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = %s
                AND pid <> pg_backend_pid()
            """), (target_db,))
            cursor.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(target_db)))
            print(f"Dropped existing database '{target_db}'")
        
        # Create a new database by copying from the source
        print(f"Copying database '{source_db}' to '{target_db}'...")
        cursor.execute(sql.SQL("CREATE DATABASE {} TEMPLATE {}").format(
            sql.Identifier(target_db),
            sql.Identifier(source_db)
        ))
        print(f"✅ Successfully copied database '{source_db}' to '{target_db}'")
        
        cursor.close()
        conn.close()
        
    except OperationalError as e:
        print(f"❌ Connection error: {e}")
        print("\nTroubleshooting tips:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check your username - it might be 'postgres' or your system username")
        print("3. Verify the password is correct")
        print("4. Check if the host and port are correct")
    except Exception as e:
        print(f"❌ Error: {e}")

def copy_database_with_pg_dump():
    """
    Alternative method using pg_dump and psql command-line tools.
    Use this if the CREATE DATABASE TEMPLATE method doesn't work.
    """
    source_db = "am_db"
    target_db = "webapp_db"
    user = "postgres"
    password = "sekert1!"
    host = "localhost"
    
    try:
        # First create an empty database
        import psycopg2
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Drop target if exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (target_db,))
        if cursor.fetchone():
            cursor.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(target_db)))
        
        cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(target_db)))
        cursor.close()
        conn.close()
        
        # Use pg_dump and psql to copy data
        print(f"Copying data using pg_dump...")
        
        # Set PGPASSWORD environment variable for authentication
        import os
        os.environ['PGPASSWORD'] = password
        
        # Dump source database and restore to target
        dump_cmd = f"pg_dump -h {host} -U {user} -d {source_db}"
        restore_cmd = f"psql -h {host} -U {user} -d {target_db}"
        
        # Execute the pipeline
        import subprocess
        dump_process = subprocess.Popen(dump_cmd, stdout=subprocess.PIPE, shell=True)
        restore_process = subprocess.Popen(restore_cmd, stdin=dump_process.stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        dump_process.stdout.close()
        
        stdout, stderr = restore_process.communicate()
        
        if restore_process.returncode == 0:
            print(f"✅ Successfully copied database '{source_db}' to '{target_db}'")
        else:
            print(f"❌ Error during restore: {stderr.decode()}")
            
        # Clean up environment variable
        del os.environ['PGPASSWORD']
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("PostgreSQL Database Copy Tool")
    print("=" * 50)
    print(f"Source: am_db")
    print(f"Target: webapp_db")
    print("=" * 50)
    
    # Choose method - Try the faster TEMPLATE method first
    print("\nUsing CREATE DATABASE TEMPLATE method...")
    copy_database()
    
    # If the template method fails, you can uncomment the line below to try pg_dump method
    # print("\nTrying pg_dump method...")
    # copy_database_with_pg_dump()