-- =====================================================
-- FIX MISSING GENERATOR TEST FIELDS
-- =====================================================

-- Air Gap Measurement - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'avg_gap', 'Average Air Gap', 'mm', 'number', true, 1 FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator'
UNION ALL SELECT id, 'max_deviation', 'Maximum Deviation', 'mm', 'number', true, 2 FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator';

-- Excitation System Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'response_time', 'Response Time', 's', 'number', true, 1 FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'ceiling_voltage', 'Ceiling Voltage', 'V', 'number', true, 2 FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'regulator_gain', 'Regulator Gain', NULL, 'number', false, 3 FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator';

-- Load Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'load_mw', 'Load', 'MW', 'number', true, 1 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'efficiency', 'Efficiency', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'temperature_rise', 'Temperature Rise', '?C', 'number', false, 3 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator';

-- Over Speed Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'max_speed', 'Maximum Speed', 'RPM', 'number', true, 1 FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'duration', 'Duration at Speed', 'min', 'number', true, 2 FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator';

-- Rotor Balance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'unbalance_weight', 'Unbalance Weight', 'g', 'number', true, 1 FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator'
UNION ALL SELECT id, 'phase_angle', 'Phase Angle', '?', 'number', true, 2 FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator';

-- Shaft Voltage Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'shaft_voltage', 'Shaft Voltage', 'V', 'number', true, 1 FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'bearing_current', 'Bearing Current', 'A', 'number', false, 2 FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator';

-- Short Circuit Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'short_circuit_ratio', 'Short Circuit Ratio', NULL, 'number', true, 1 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'subtransient_reactance', 'Subtransient Reactance (Xd")', 'pu', 'number', true, 2 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'transient_reactance', 'Transient Reactance (Xd\')', 'pu', 'number', true, 3 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator';

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

SELECT 'Generator missing fields fixed' as status;
