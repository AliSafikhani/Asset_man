-- =====================================================
-- MOTOR TESTS (Complete all 20 tests)
-- =====================================================

-- 1-5. Already done (Winding Resistance, Insulation Resistance, 
--          Polarization Index, DC Hi-Pot, AC Hi-Pot)

-- 6. Surge Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'), 'surge_voltage', 'Surge Voltage', 'V', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'), 'waveform_match', 'Waveform Match', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'), 'pd_level', 'Partial Discharge Level', 'pC', 'number', false, 3);

-- 7. Partial Discharge
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'motor'), 'pd_level', 'Partial Discharge Level', 'pC', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'motor'), 'inception_voltage', 'Inception Voltage', 'V', 'number', false, 2);

-- 8. Tan Delta
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'motor'), 'tan_delta', 'Tan Delta', '%', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'motor'), 'power_factor', 'Power Factor', '%', 'number', true, 2);

-- 9. Capacitance Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'motor'), 'capacitance_u', 'Capacitance Phase U', 'pF', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'motor'), 'capacitance_v', 'Capacitance Phase V', 'pF', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'motor'), 'capacitance_w', 'Capacitance Phase W', 'pF', 'number', true, 3);

-- 10. No Load Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'No Load Test' AND asset_type = 'motor'), 'no_load_current', 'No Load Current', 'A', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'No Load Test' AND asset_type = 'motor'), 'no_load_loss', 'No Load Loss', 'W', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'No Load Test' AND asset_type = 'motor'), 'no_load_power_factor', 'No Load Power Factor', NULL, 'number', false, 3);

-- 11. Locked Rotor Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Locked Rotor Test' AND asset_type = 'motor'), 'locked_rotor_current', 'Locked Rotor Current', 'A', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Locked Rotor Test' AND asset_type = 'motor'), 'locked_rotor_torque', 'Locked Rotor Torque', 'Nm', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Locked Rotor Test' AND asset_type = 'motor'), 'locked_rotor_power', 'Locked Rotor Power', 'kW', 'number', false, 3);

-- 12. Load Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor'), 'load_kw', 'Load', 'kW', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor'), 'efficiency', 'Efficiency', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor'), 'power_factor', 'Power Factor', NULL, 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor'), 'slip', 'Slip', '%', 'number', false, 4);

-- 13. Vibration Analysis (Already done)

-- 14. Bearing Temperature (Already done)

-- 15. Winding Temperature
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor'), 'temp_u', 'Temperature Phase U', '?C', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor'), 'temp_v', 'Temperature Phase V', '?C', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor'), 'temp_w', 'Temperature Phase W', '?C', 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor'), 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 4);

-- 16. Shaft Alignment
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Shaft Alignment' AND asset_type = 'motor'), 'offset_horizontal', 'Horizontal Offset', 'mm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Shaft Alignment' AND asset_type = 'motor'), 'offset_vertical', 'Vertical Offset', 'mm', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Shaft Alignment' AND asset_type = 'motor'), 'angularity', 'Angularity', 'mm/m', 'number', true, 3);

-- 17. Air Gap Measurement
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'motor'), 'avg_gap', 'Average Air Gap', 'mm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'motor'), 'eccentricity', 'Eccentricity', '%', 'number', true, 2);

-- 18. Rotor Balance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'motor'), 'unbalance_weight', 'Unbalance Weight', 'g', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'motor'), 'phase_angle', 'Phase Angle', '?', 'number', true, 2);

-- 19. Current Signature Analysis (CSA)
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Current Signature Analysis' AND asset_type = 'motor'), 'sideband_frequency', 'Sideband Frequency', 'Hz', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Current Signature Analysis' AND asset_type = 'motor'), 'sideband_amplitude', 'Sideband Amplitude', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Current Signature Analysis' AND asset_type = 'motor'), 'fault_frequency', 'Fault Frequency', 'Hz', 'number', false, 3);

-- 20. Thermography (Already done)

SELECT 'Motor test fields completed' as status;
