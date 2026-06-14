-- =====================================================
-- GENERATOR TEST FIELDS (20 tests)
-- =====================================================

-- 1. Stator Winding Resistance - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'r_phase_a', 'Resistance Phase A', '?', 'number', true, 1 FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'
UNION ALL SELECT id, 'r_phase_b', 'Resistance Phase B', '?', 'number', true, 2 FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'
UNION ALL SELECT id, 'r_phase_c', 'Resistance Phase C', '?', 'number', true, 3 FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'
UNION ALL SELECT id, 'unbalance', 'Phase Unbalance', '%', 'number', true, 4 FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator';

-- 2. Rotor Winding Resistance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'r_rotor', 'Rotor Resistance', '?', 'number', true, 1 FROM test_types WHERE test_name = 'Rotor Winding Resistance' AND asset_type = 'generator'
UNION ALL SELECT id, 'temperature', 'Temperature', '?C', 'number', false, 2 FROM test_types WHERE test_name = 'Rotor Winding Resistance' AND asset_type = 'generator';

-- 3. Stator Insulation Resistance - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'ir_1min', 'Insulation Resistance (1 min)', 'M?', 'number', true, 1 FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'
UNION ALL SELECT id, 'ir_10min', 'Insulation Resistance (10 min)', 'M?', 'number', true, 2 FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'
UNION ALL SELECT id, 'temperature', 'Temperature', '?C', 'number', false, 3 FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator';

-- 4. Rotor Insulation Resistance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'ir_rotor', 'Rotor Insulation Resistance', 'M?', 'number', true, 1 FROM test_types WHERE test_name = 'Rotor Insulation Resistance' AND asset_type = 'generator'
UNION ALL SELECT id, 'test_voltage', 'Test Voltage', 'V', 'number', false, 2 FROM test_types WHERE test_name = 'Rotor Insulation Resistance' AND asset_type = 'generator';

-- 5. Polarization Index - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'pi_stator', 'Stator Polarization Index', NULL, 'number', true, 1 FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'generator'
UNION ALL SELECT id, 'dar_stator', 'Stator DAR', NULL, 'number', false, 2 FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'generator';

-- 6. DC Hi-Pot Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'test_voltage', 'Test Voltage', 'kV', 'number', true, 1 FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'leakage_current', 'Leakage Current', '?A', 'number', true, 2 FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'duration', 'Test Duration', 'min', 'number', false, 3 FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'generator';

-- 7. AC Hi-Pot Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'withstand_voltage', 'Withstand Voltage', 'kV', 'number', true, 1 FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'leakage_current', 'Leakage Current', 'mA', 'number', true, 2 FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'generator';

-- 8. Partial Discharge - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'pd_level', 'Partial Discharge Level', 'pC', 'number', true, 1 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'
UNION ALL SELECT id, 'pd_phase_a', 'PD Phase A', 'pC', 'number', false, 2 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'
UNION ALL SELECT id, 'pd_phase_b', 'PD Phase B', 'pC', 'number', false, 3 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'
UNION ALL SELECT id, 'pd_phase_c', 'PD Phase C', 'pC', 'number', false, 4 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator';

-- 9. Tan Delta - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'tan_delta', 'Tan Delta', '%', 'number', true, 1 FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'
UNION ALL SELECT id, 'power_factor', 'Power Factor', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator'
UNION ALL SELECT id, 'capacitance', 'Capacitance', 'pF', 'number', false, 3 FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'generator';

-- 10. Capacitance Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'capacitance_phase_a', 'Capacitance Phase A', 'pF', 'number', true, 1 FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'capacitance_phase_b', 'Capacitance Phase B', 'pF', 'number', true, 2 FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'capacitance_phase_c', 'Capacitance Phase C', 'pF', 'number', true, 3 FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'generator';

-- 11. Open Circuit Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'excitation_current', 'Excitation Current', 'A', 'number', true, 1 FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'core_loss', 'Core Loss', 'kW', 'number', true, 2 FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'line_voltage', 'Line Voltage', 'kV', 'number', false, 3 FROM test_types WHERE test_name = 'Open Circuit Test' AND asset_type = 'generator';

-- 12. Short Circuit Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'short_circuit_ratio', 'Short Circuit Ratio', NULL, 'number', true, 1 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'subtransient_reactance', 'Subtransient Reactance (Xd")', 'pu', 'number', true, 2 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'transient_reactance', 'Transient Reactance (Xd\')', 'pu', 'number', true, 3 FROM test_types WHERE test_name = 'Short Circuit Test' AND asset_type = 'generator';

-- 13. Load Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'load_mw', 'Load', 'MW', 'number', true, 1 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'efficiency', 'Efficiency', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'temperature_rise', 'Temperature Rise', '?C', 'number', false, 3 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'generator';

-- 14. Vibration Analysis - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'vibration_de', 'Drive End Vibration', 'mm/s', 'number', true, 1 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'
UNION ALL SELECT id, 'vibration_nde', 'Non-Drive End Vibration', 'mm/s', 'number', true, 2 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'
UNION ALL SELECT id, 'vibration_radial', 'Radial Vibration', 'mm/s', 'number', false, 3 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator';

-- 15. Shaft Voltage Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'shaft_voltage', 'Shaft Voltage', 'V', 'number', true, 1 FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'bearing_current', 'Bearing Current', 'A', 'number', false, 2 FROM test_types WHERE test_name = 'Shaft Voltage Test' AND asset_type = 'generator';

-- 16. Air Gap Measurement - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'avg_gap', 'Average Air Gap', 'mm', 'number', true, 1 FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator'
UNION ALL SELECT id, 'max_deviation', 'Maximum Deviation', 'mm', 'number', true, 2 FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'generator';

-- 17. Rotor Balance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'unbalance_weight', 'Unbalance Weight', 'g', 'number', true, 1 FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator'
UNION ALL SELECT id, 'phase_angle', 'Phase Angle', '?', 'number', true, 2 FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'generator';

-- 18. Over Speed Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'max_speed', 'Maximum Speed', 'RPM', 'number', true, 1 FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'duration', 'Duration at Speed', 'min', 'number', true, 2 FROM test_types WHERE test_name = 'Over Speed Test' AND asset_type = 'generator';

-- 19. Excitation System Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'response_time', 'Response Time', 's', 'number', true, 1 FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'ceiling_voltage', 'Ceiling Voltage', 'V', 'number', true, 2 FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator'
UNION ALL SELECT id, 'regulator_gain', 'Regulator Gain', NULL, 'number', false, 3 FROM test_types WHERE test_name = 'Excitation System Test' AND asset_type = 'generator';

-- 20. Thermography - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', true, 1 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'
UNION ALL SELECT id, 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 2 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'
UNION ALL SELECT id, 'delta_t', 'Temperature Difference', '?C', 'number', true, 3 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator';

SELECT 'GENERATOR: 20 tests completed' as status;
