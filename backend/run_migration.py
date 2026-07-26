#!/usr/bin/env python3
"""
Run a single SQL migration file against the database.
Usage: python run_migration.py
"""

import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# ---- Database connection settings (adjust if needed) ----
# You can also read these from environment variables or a config file
DB_USER = "postgres"
DB_PASSWORD = "sekert1!"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "webapp_db"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ---- Path to the migration file ----
# Adjust this if your file is elsewhere
MIGRATION_FILE = Path(__file__).parent / "database" / "migrations" / "043_create_maintenance_activities_table.sql"


def run_migration():
    """Execute the migration SQL file."""
    if not MIGRATION_FILE.exists():
        print(f"❌ Migration file not found: {MIGRATION_FILE}")
        sys.exit(1)

    # Read the SQL file
    with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
        sql_script = f.read()

    # Create engine and session
    engine = create_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print(f"🚀 Running migration: {MIGRATION_FILE.name}")
        # Split the script into individual statements (if multiple)
        # For safety, we execute each statement separately.
        # Here we just execute the whole script as a single transaction.
        session.execute(text(sql_script))
        session.commit()
        print("✅ Migration completed successfully.")
    except Exception as e:
        session.rollback()
        print(f"❌ Migration failed: {e}")
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    run_migration()