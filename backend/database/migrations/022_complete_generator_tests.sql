-- =====================================================
-- GENERATOR TESTS (Complete all 20 tests)
-- =====================================================

-- 1-5. Already done (Stator Winding Resistance, Stator Insulation Resistance, 
--          Partial Discharge, Vibration Analysis, Thermography)

-- 6. Rotor Winding Resistance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Rotor Winding Resistance' AND asset_type = 'generator'), 'r_rotor', 'Rotor Resistance', '?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Rotor Winding Resistance' AND asset_type = 'generator'), 'temperature', 'Temperature', '?C', 'number', false, 2);

-- 7. Rotor Insulation Resistance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Rotor Insulation Resistance' AND asset_type = 'generator'), 'ir_rotor', 'Rotor Insulation Resistance', 'M?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Rotor Insulation Resistance' AND asset_type = 'generator'), 'test_voltage', 'Test Voltage', 'V', 'number', false, 2);

-- 8. Polarization Index (Stator)
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'generator'), 'pi_stator', 'Stator Polarization Index', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'generator'), 'dar_stator', 'Stator DAR', NULL, 'number', false, 2);

-- 9. DC Hi-Pot Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'), 'test_voltage', 'Test Voltage', 'kV', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'), 'leakage_current', 'Leakage Current', '?A', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'), 'duration', 'Test Duration', 'min', 'number', false, 3);

-- 10. AC Hi-Pot Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'generator'), 'withstand_voltage', 'Withstand Voltage', 'kV', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'generator'), 'leakage_current', 'Leakage Current', 'mA', 'number', true, 2);

-- 11. Tan Delta (Power Factor)
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'), 'tan_delta', 'Tan Delta', '%', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'), 'power_factor', 'Power Factor', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'), 'capacitance', 'Capacitance', 'pF', 'number', false, 3);

-- 12. Capacitance Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'), 'capacitance_phase_a', 'Capacitance Phase A', 'pF', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'), 'capacitance_phase_b', 'Capacitance Phase B', 'pF', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'), 'capacitance_phase_c', 'Capacitance Phase C', 'pF', 'number', true, 3);

-- 13. Open Circuit Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'), 'excitation_current', 'Excitation Current', 'A', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'), 'core_loss', 'Core Loss', 'kW', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'), 'line_voltage', 'Line Voltage', 'kV', 'number', false, 3);

-- 14. Short Circuit Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'), 'short_circuit_ratio', 'Short Circuit Ratio', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'), 'subtransient_reactance', 'Subtransient Reactance (Xd'')', 'pu', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'), 'transient_reactance', 'Transient Reactance (Xd'')', 'pu', 'number', true, 3);

-- 15. Load Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'), 'load_mw', 'Load', 'MW', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'), 'efficiency', 'Efficiency', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'), 'temperature_rise', 'Temperature Rise', '?C', 'number', false, 3);

-- 16. Shaft Voltage Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator'), 'shaft_voltage', 'Shaft Voltage', 'V', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator'), 'bearing_current', 'Bearing Current', 'A', 'number', false, 2);

-- 17. Air Gap Measurement
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator'), 'avg_gap', 'Average Air Gap', 'mm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator'), 'max_deviation', 'Maximum Deviation', 'mm', 'number', true, 2);

-- 18. Rotor Balance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator'), 'unbalance_weight', 'Unbalance Weight', 'g', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator'), 'phase_angle', 'Phase Angle', '?', 'number', true, 2);

-- 19. Over Speed Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator'), 'max_speed', 'Maximum Speed', 'RPM', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator'), 'duration', 'Duration at Speed', 'min', 'number', true, 2);

-- 20. Excitation System Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'), 'response_time', 'Response Time', 's', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'), 'ceiling_voltage', 'Ceiling Voltage', 'V', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'), 'regulator_gain', 'Regulator Gain', NULL, 'number', false, 3);

SELECT 'Generator test fields completed' as status;
