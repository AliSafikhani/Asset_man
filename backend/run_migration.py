# save as run_migration.py
import asyncio
import asyncpg
from app.core.config import settings

async def run_migration():
    # Convert SQLAlchemy URL to asyncpg format
    # Original: postgresql+asyncpg://user:pass@host:port/db
    # Convert to: postgresql://user:pass@host:port/db
    database_url = settings.DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')
    
    print(f"Connecting to database...")
    
    # Connect to database
    conn = await asyncpg.connect(database_url)
    
    try:
        # Read SQL file
        with open('database/migrations/001_create_hierarchy_tables.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print("Executing migration...")
        
        # Execute SQL
        await conn.execute(sql)
        print("✅ Migration completed successfully!")
        
        # Verify tables were created
        result = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('centroids', 'companies', 'plants', 'plant_sections')
            ORDER BY table_name
        """)
        
        print("\n📋 Created tables:")
        for row in result:
            print(f"  - {row['table_name']}")
            
        # Show row counts
        print("\n📊 Row counts:")
        for table in ['centroids', 'companies', 'plants', 'plant_sections']:
            count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            print(f"  - {table}: {count} rows")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migration())