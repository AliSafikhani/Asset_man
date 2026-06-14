-- =====================================================
-- GENERATOR TESTS (20 tests with complete fields)
-- =====================================================

-- 1. Stator Winding Resistance - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'r_phase_a', 'Resistance Phase A', '?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'r_phase_b', 'Resistance Phase B', '?', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'r_phase_c', 'Resistance Phase C', '?', 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'unbalance', 'Phase Unbalance', '%', 'number', true, 4);

-- 2. Rotor Winding Resistance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Rotor Winding Resistance' AND asset_type = 'generator'), 'r_rotor', 'Rotor Resistance', '?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Rotor Winding Resistance' AND asset_type = 'generator'), 'temperature', 'Temperature', '?C', 'number', false, 2);

-- 3. Stator Insulation Resistance - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'), 'ir_1min', 'Insulation Resistance (1 min)', 'M?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'), 'ir_10min', 'Insulation Resistance (10 min)', 'M?', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'), 'temperature', 'Temperature', '?C', 'number', false, 3);

-- 4. Rotor Insulation Resistance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Rotor Insulation Resistance' AND asset_type = 'generator'), 'ir_rotor', 'Rotor Insulation Resistance', 'M?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Rotor Insulation Resistance' AND asset_type = 'generator'), 'test_voltage', 'Test Voltage', 'V', 'number', false, 2);

-- 5. Polarization Index - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'generator'), 'pi_stator', 'Stator Polarization Index', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'generator'), 'dar_stator', 'Stator DAR', NULL, 'number', false, 2);

-- 6. DC Hi-Pot Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'), 'test_voltage', 'Test Voltage', 'kV', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'), 'leakage_current', 'Leakage Current', '?A', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'), 'duration', 'Test Duration', 'min', 'number', false, 3);

-- 7. AC Hi-Pot Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'generator'), 'withstand_voltage', 'Withstand Voltage', 'kV', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'generator'), 'leakage_current', 'Leakage Current', 'mA', 'number', true, 2);

-- 8. Partial Discharge - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_level', 'Partial Discharge Level', 'pC', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_phase_a', 'PD Phase A', 'pC', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_phase_b', 'PD Phase B', 'pC', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_phase_c', 'PD Phase C', 'pC', 'number', false, 4);

-- 9. Tan Delta (Power Factor) - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'), 'tan_delta', 'Tan Delta', '%', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'), 'power_factor', 'Power Factor', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'), 'capacitance', 'Capacitance', 'pF', 'number', false, 3);

-- 10. Capacitance Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'), 'capacitance_phase_a', 'Capacitance Phase A', 'pF', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'), 'capacitance_phase_b', 'Capacitance Phase B', 'pF', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'), 'capacitance_phase_c', 'Capacitance Phase C', 'pF', 'number', true, 3);

-- 11. Open Circuit Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'), 'excitation_current', 'Excitation Current', 'A', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'), 'core_loss', 'Core Loss', 'kW', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'), 'line_voltage', 'Line Voltage', 'kV', 'number', false, 3);

-- 12. Short Circuit Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'), 'short_circuit_ratio', 'Short Circuit Ratio', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'), 'subtransient_reactance', 'Subtransient Reactance (Xd")', 'pu', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'), 'transient_reactance', 'Transient Reactance (Xd\')', 'pu', 'number', true, 3);

-- 13. Load Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'), 'load_mw', 'Load', 'MW', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'), 'efficiency', 'Efficiency', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'), 'temperature_rise', 'Temperature Rise', '?C', 'number', false, 3);

-- 14. Vibration Analysis - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'), 'vibration_de', 'Drive End Vibration', 'mm/s', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'), 'vibration_nde', 'Non-Drive End Vibration', 'mm/s', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'), 'vibration_radial', 'Radial Vibration', 'mm/s', 'number', false, 3);

-- 15. Shaft Voltage Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator'), 'shaft_voltage', 'Shaft Voltage', 'V', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator'), 'bearing_current', 'Bearing Current', 'A', 'number', false, 2);

-- 16. Air Gap Measurement - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator'), 'avg_gap', 'Average Air Gap', 'mm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator'), 'max_deviation', 'Maximum Deviation', 'mm', 'number', true, 2);

-- 17. Rotor Balance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator'), 'unbalance_weight', 'Unbalance Weight', 'g', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator'), 'phase_angle', 'Phase Angle', '?', 'number', true, 2);

-- 18. Over Speed Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator'), 'max_speed', 'Maximum Speed', 'RPM', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator'), 'duration', 'Duration at Speed', 'min', 'number', true, 2);

-- 19. Excitation System Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'), 'response_time', 'Response Time', 's', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'), 'ceiling_voltage', 'Ceiling Voltage', 'V', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'), 'regulator_gain', 'Regulator Gain', NULL, 'number', false, 3);

-- 20. Thermography - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'), 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'), 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'), 'delta_t', 'Temperature Difference', '?C', 'number', true, 3);

SELECT 'GENERATOR: 20 tests, ' || COUNT(*) || ' fields defined' as status FROM test_field_definitions WHERE test_type_id IN (SELECT id FROM test_types WHERE asset_type = 'generator');
