@echo off
echo Running database migration...
psql -U postgres -h localhost -d postgres -f database/migrations/001_create_hierarchy_tables.sql
echo Migration complete!
pause