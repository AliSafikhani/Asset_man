-- Fix Motor Vibration Analysis - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'vibration_drive', 'Drive End Vibration', 'mm/s', 'number', true, 1 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'motor'
UNION ALL SELECT id, 'vibration_opposite', 'Opposite Drive End Vibration', 'mm/s', 'number', true, 2 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'motor'
ON CONFLICT DO NOTHING;

SELECT 'Motor fields fixed' as status;
