-- =====================================================
-- FIX REMAINING GENERATOR TESTS
-- =====================================================

-- Short Circuit Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'short_circuit_ratio', 'Short Circuit Ratio', NULL, 'number', true, 1 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'subtransient_reactance', 'Subtransient Reactance (Xd")', 'pu', 'number', true, 2 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'transient_reactance', 'Transient Reactance (Xd)'', 'pu', 'number', true, 3 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator';

-- Thermography - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', true, 1 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'
UNION ALL SELECT id, 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 2 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'
UNION ALL SELECT id, 'delta_t', 'Temperature Difference', '?C', 'number', true, 3 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator';

-- Vibration Analysis - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'vibration_de', 'Drive End Vibration', 'mm/s', 'number', true, 1 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'
UNION ALL SELECT id, 'vibration_nde', 'Non-Drive End Vibration', 'mm/s', 'number', true, 2 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'
UNION ALL SELECT id, 'vibration_radial', 'Radial Vibration', 'mm/s', 'number', false, 3 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator';

SELECT 'All generator tests now have fields' as status;
