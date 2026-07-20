-- =====================================================
-- Replace Furan Analysis fields with new set
-- Migration: 040_replace_furan_analysis_fields.sql
-- =====================================================

-- Get the test type ID for Furan Analysis (Transformer)
DO $$
DECLARE
    furan_id INTEGER;
BEGIN
    SELECT id INTO furan_id
    FROM test_types
    WHERE test_name = 'Furan Analysis'
      AND asset_type = 'transformer';

    IF furan_id IS NULL THEN
        RAISE EXCEPTION 'Furan Analysis test type not found!';
    END IF;

    -- 1. Delete all existing fields for this test type
    DELETE FROM test_field_definitions
    WHERE test_type_id = furan_id;

    -- 2. Insert the new fields in the desired order
    INSERT INTO test_field_definitions (
        test_type_id,
        field_name,
        display_name,
        unit,
        data_type,
        is_required,
        display_order,
        description
    ) VALUES
        (furan_id, 'sample_temp',  'Sample Temperature',         '°C',   'number', FALSE, 1, 'Oil sample temperature during analysis'),
        (furan_id, 'fol',          'Furfurylalcohol (2-FOL)',    'ppb',  'number', TRUE,  2, 'Furfurylalcohol concentration'),
        (furan_id, 'fal',          '2-Furfural (2-FAL)',         'ppb',  'number', TRUE,  3, '2-Furfural concentration'),
        (furan_id, 'acf',          '2-Acetylfuran (2-ACF)',      'ppb',  'number', FALSE, 4, '2-Acetylfuran concentration'),
        (furan_id, 'mef',          '5-Methylfurfural (5-MEF)',   'ppb',  'number', FALSE, 5, '5-Methylfurfural concentration'),
        (furan_id, 'hmf',          '5-Hydroxymethylfurfural (5HMF)', 'ppb', 'number', FALSE, 6, '5-Hydroxymethylfurfural concentration'),
        (furan_id, 'furoic_acid',  'Furoic Acid',                'ppb',  'number', FALSE, 7, 'Furoic acid concentration');

    -- 3. (Optional) Verify the insert
    RAISE NOTICE 'Furan Analysis fields replaced. % fields inserted.', (
        SELECT COUNT(*) FROM test_field_definitions WHERE test_type_id = furan_id
    );
END $$;