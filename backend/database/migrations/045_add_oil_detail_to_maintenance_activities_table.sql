-- backend\database\migrations\045_add_oil_detail_to_maintenance_activities_table.sql
-- =====================================================
-- Add paper_type column to transformers table
-- Migration: 045_add_oil_detail_to_maintenance_activities_table.sql
-- =====================================================

-- Add the column as VARCHAR(50) – adjust length if needed
ALTER TABLE maintenance_activities 
ADD COLUMN oil_detail VARCHAR(50);

-- (Optional) Add a comment for documentation

-- (Optional) If you want to restrict values, uncomment the following line:
-- ALTER TABLE transformers ADD CONSTRAINT check_paper_type CHECK (paper_type IN ('kraft', 'thermally_upgraded_kraft', 'nomex', 'pressboard', 'diamond_dotted', 'other'));

-- Verification
SELECT 'oil_detail column added' as status;

-- =====================================================
-- ROLLBACK (if needed):
-- ALTER TABLE transformers DROP COLUMN paper_type;
-- =====================================================