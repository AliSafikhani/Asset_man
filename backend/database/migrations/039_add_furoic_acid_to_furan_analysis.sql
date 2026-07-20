-- =====================================================
-- Add Furoic Acid to Furan Analysis (Transformer)
-- Migration: 039_add_furoic_acid_to_furan_analysis.sql
-- =====================================================

-- 1. Delete any existing entry for this field (idempotent)
DELETE FROM test_field_definitions
WHERE test_type_id = (SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer')
  AND field_name = 'furoic_acid';

-- 2. Insert the new field with the next display_order
INSERT INTO test_field_definitions (
    test_type_id,
    field_name,
    display_name,
    unit,
    data_type,
    is_required,
    display_order,
    description
)
SELECT
    tt.id,                      -- test_type_id
    'furoic_acid',              -- field_name
    'Furoic Acid',              -- display_name
    'ppb',                      -- unit
    'number',                   -- data_type
    FALSE,                      -- is_required
    COALESCE(MAX(tfd.display_order), 0) + 1,  -- next available order
    'Furoic acid concentration'
FROM test_types tt
LEFT JOIN test_field_definitions tfd ON tfd.test_type_id = tt.id
WHERE tt.test_name = 'Furan Analysis'
  AND tt.asset_type = 'transformer'
GROUP BY tt.id;

-- 3. Verify the insert
SELECT 'Added furoic_acid to Furan Analysis (test_type_id = ' || tt.id || ')' AS status
FROM test_types tt
WHERE tt.test_name = 'Furan Analysis'
  AND tt.asset_type = 'transformer';

-- =====================================================
-- ROLLBACK (if needed):
-- DELETE FROM test_field_definitions
-- WHERE test_type_id = (SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer')
--   AND field_name = 'furoic_acid';
-- =====================================================