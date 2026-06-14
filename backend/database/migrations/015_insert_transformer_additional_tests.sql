-- Transformer: Furan Analysis (Paper degradation assessment)
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_2fal', '2-Furaldehyde (2FAL)', 'ppb', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_2acf', '2-Acetylfuran (2ACF)', 'ppb', 'number', FALSE, 2),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'total_furans', 'Total Furans', 'ppb', 'number', TRUE, 3);

-- Transformer: Capacitance & Tan Delta
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'capacitance_hv', 'Capacitance HV', 'pF', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'capacitance_lv', 'Capacitance LV', 'pF', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'tan_delta', 'Tan Delta (Power Factor)', '%', 'number', TRUE, 3),
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'power_factor', 'Power Factor', '%', 'number', FALSE, 4);

-- Transformer: Bushing Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_capacitance', 'Bushing Capacitance', 'pF', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_power_factor', 'Bushing Power Factor', '%', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_ir', 'Bushing Insulation Resistance', 'M?', 'number', FALSE, 3);

-- Transformer: OLTC Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'transition_resistance', 'Transition Resistance', '?', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'transition_time', 'Transition Time', 'ms', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'motor_current', 'Motor Current', 'A', 'number', FALSE, 3),
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'tap_position', 'Tap Position', NULL, 'number', FALSE, 4);

-- Transformer: Thermography
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'ambient_temp', 'Ambient Temperature', '?C', 'number', FALSE, 2),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'delta_t', 'Temperature Difference', '?C', 'number', TRUE, 3);

-- Transformer: Visual Inspection
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'oil_leak', 'Oil Leak Detected', NULL, 'select', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'corrosion', 'Corrosion Observed', NULL, 'select', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'bushing_condition', 'Bushing Condition', NULL, 'select', TRUE, 3),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'cooling_system', 'Cooling System Status', NULL, 'select', FALSE, 4),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'overall_condition', 'Overall Condition', NULL, 'select', TRUE, 5);

-- Update allowed_values for select fields
UPDATE test_field_definitions SET allowed_values = '["Yes", "No"]' WHERE field_name = 'oil_leak';
UPDATE test_field_definitions SET allowed_values = '["Yes", "No"]' WHERE field_name = 'corrosion';
UPDATE test_field_definitions SET allowed_values = '["Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'bushing_condition';
UPDATE test_field_definitions SET allowed_values = '["Operational", "Needs Maintenance", "Failed"]' WHERE field_name = 'cooling_system';
UPDATE test_field_definitions SET allowed_values = '["Excellent", "Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'overall_condition';

SELECT 'Transformer additional tests inserted' as status;
