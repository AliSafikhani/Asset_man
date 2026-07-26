-- =====================================================
-- Add paper_type column to transformers table
-- Migration: 041_add_paper_type_to_transformers.sql
-- =====================================================

-- Add the column as VARCHAR(50) – adjust length if needed
ALTER TABLE transformers 
ADD COLUMN paper_type VARCHAR(50);

-- (Optional) Add a comment for documentation
COMMENT ON COLUMN transformers.paper_type IS 'Type of insulation paper used (e.g., Kraft, Thermally Upgraded Kraft, Nomex, Pressboard, Diamond Dotted)';

-- (Optional) If you want to restrict values, uncomment the following line:
-- ALTER TABLE transformers ADD CONSTRAINT check_paper_type CHECK (paper_type IN ('kraft', 'thermally_upgraded_kraft', 'nomex', 'pressboard', 'diamond_dotted', 'other'));

-- Verification
SELECT 'paper_type column added' as status;

-- =====================================================
-- ROLLBACK (if needed):
-- ALTER TABLE transformers DROP COLUMN paper_type;
-- =====================================================