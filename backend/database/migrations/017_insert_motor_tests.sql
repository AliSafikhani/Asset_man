-- Motor: Winding Resistance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor'), 'r_u', 'Resistance Phase U', '?', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor'), 'r_v', 'Resistance Phase V', '?', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor'), 'r_w', 'Resistance Phase W', '?', 'number', TRUE, 3),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor'), 'unbalance', 'Phase Unbalance', '%', 'number', TRUE, 4);

-- Motor: Insulation Resistance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'motor'), 'ir_value', 'Insulation Resistance', 'M?', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'motor'), 'pi', 'Polarization Index', NULL, 'number', TRUE, 2);

-- Motor: Surge Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'), 'surge_voltage', 'Surge Voltage', 'V', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'), 'waveform_match', 'Waveform Match', '%', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'), 'pd_detected', 'Partial Discharge Detected', NULL, 'select', TRUE, 3);

UPDATE test_field_definitions SET allowed_values = '["Yes", "No"]' WHERE field_name = 'pd_detected';

-- Motor: Vibration Analysis
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'motor'), 'vibration_drive', 'Drive End Vibration', 'mm/s', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'motor'), 'vibration_opposite', 'Opposite Drive End Vibration', 'mm/s', 'number', TRUE, 2);

-- Motor: Bearing Temperature
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Bearing Temperature' AND asset_type = 'motor'), 'bearing_de_temp', 'Drive End Bearing Temp', '?C', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Bearing Temperature' AND asset_type = 'motor'), 'bearing_nde_temp', 'Non-Drive End Bearing Temp', '?C', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Bearing Temperature' AND asset_type = 'motor'), 'ambient_temp', 'Ambient Temperature', '?C', 'number', FALSE, 3);

SELECT 'Motor critical tests inserted' as status;
