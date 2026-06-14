-- =====================================================
-- MOTOR TEST FIELDS (20 tests)
-- =====================================================

-- 1. Winding Resistance - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'r_u', 'Resistance Phase U', '?', 'number', true, 1 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor'
UNION ALL SELECT id, 'r_v', 'Resistance Phase V', '?', 'number', true, 2 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor'
UNION ALL SELECT id, 'r_w', 'Resistance Phase W', '?', 'number', true, 3 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor'
UNION ALL SELECT id, 'unbalance', 'Phase Unbalance', '%', 'number', true, 4 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'motor';

-- 2. Insulation Resistance - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'ir_value', 'Insulation Resistance', 'M?', 'number', true, 1 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'motor'
UNION ALL SELECT id, 'pi', 'Polarization Index', NULL, 'number', true, 2 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'motor'
UNION ALL SELECT id, 'temperature', 'Temperature', '?C', 'number', false, 3 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'motor';

-- 3. Polarization Index - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'pi', 'Polarization Index', NULL, 'number', true, 1 FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'motor'
UNION ALL SELECT id, 'dar', 'Dielectric Absorption Ratio', NULL, 'number', false, 2 FROM test_types WHERE test_name = 'Polarization Index' AND asset_type = 'motor';

-- 4. DC Hi-Pot Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'test_voltage', 'Test Voltage', 'kV', 'number', true, 1 FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'leakage_current', 'Leakage Current', '?A', 'number', true, 2 FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'duration', 'Test Duration', 'min', 'number', false, 3 FROM test_types WHERE test_name = 'DC Hi-Pot Test' AND asset_type = 'motor';

-- 5. AC Hi-Pot Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'withstand_voltage', 'Withstand Voltage', 'kV', 'number', true, 1 FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'leakage_current', 'Leakage Current', 'mA', 'number', true, 2 FROM test_types WHERE test_name = 'AC Hi-Pot Test' AND asset_type = 'motor';

-- 6. Surge Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'surge_voltage', 'Surge Voltage', 'V', 'number', true, 1 FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'waveform_match', 'Waveform Match', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'pd_level', 'Partial Discharge Level', 'pC', 'number', false, 3 FROM test_types WHERE test_name = 'Surge Test' AND asset_type = 'motor';

-- 7. Partial Discharge - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'pd_level', 'Partial Discharge Level', 'pC', 'number', true, 1 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'motor'
UNION ALL SELECT id, 'inception_voltage', 'Inception Voltage', 'V', 'number', false, 2 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'motor';

-- 8. Tan Delta - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'tan_delta', 'Tan Delta', '%', 'number', true, 1 FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'motor'
UNION ALL SELECT id, 'power_factor', 'Power Factor', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Tan Delta' AND asset_type = 'motor';

-- 9. Capacitance Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'capacitance_u', 'Capacitance Phase U', 'pF', 'number', true, 1 FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'capacitance_v', 'Capacitance Phase V', 'pF', 'number', true, 2 FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'capacitance_w', 'Capacitance Phase W', 'pF', 'number', true, 3 FROM test_types WHERE test_name = 'Capacitance Test' AND asset_type = 'motor';

-- 10. No Load Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'no_load_current', 'No Load Current', 'A', 'number', true, 1 FROM test_types WHERE test_name = 'No Load Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'no_load_loss', 'No Load Loss', 'W', 'number', true, 2 FROM test_types WHERE test_name = 'No Load Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'no_load_power_factor', 'No Load Power Factor', NULL, 'number', false, 3 FROM test_types WHERE test_name = 'No Load Test' AND asset_type = 'motor';

-- 11. Locked Rotor Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'locked_rotor_current', 'Locked Rotor Current', 'A', 'number', true, 1 FROM test_types WHERE test_name = 'Locked Rotor Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'locked_rotor_torque', 'Locked Rotor Torque', 'Nm', 'number', true, 2 FROM test_types WHERE test_name = 'Locked Rotor Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'locked_rotor_power', 'Locked Rotor Power', 'kW', 'number', false, 3 FROM test_types WHERE test_name = 'Locked Rotor Test' AND asset_type = 'motor';

-- 12. Load Test - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'load_kw', 'Load', 'kW', 'number', true, 1 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'efficiency', 'Efficiency', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'power_factor', 'Power Factor', NULL, 'number', true, 3 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor'
UNION ALL SELECT id, 'slip', 'Slip', '%', 'number', false, 4 FROM test_types WHERE test_name = 'Load Test' AND asset_type = 'motor';

-- 13. Vibration Analysis - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'vibration_drive', 'Drive End Vibration', 'mm/s', 'number', true, 1 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'motor'
UNION ALL SELECT id, 'vibration_opposite', 'Opposite Drive End Vibration', 'mm/s', 'number', true, 2 FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'motor';

-- 14. Bearing Temperature - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'bearing_de_temp', 'Drive End Bearing Temp', '?C', 'number', true, 1 FROM test_types WHERE test_name = 'Bearing Temperature' AND asset_type = 'motor'
UNION ALL SELECT id, 'bearing_nde_temp', 'Non-Drive End Bearing Temp', '?C', 'number', true, 2 FROM test_types WHERE test_name = 'Bearing Temperature' AND asset_type = 'motor'
UNION ALL SELECT id, 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 3 FROM test_types WHERE test_name = 'Bearing Temperature' AND asset_type = 'motor';

-- 15. Winding Temperature - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'temp_u', 'Temperature Phase U', '?C', 'number', true, 1 FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor'
UNION ALL SELECT id, 'temp_v', 'Temperature Phase V', '?C', 'number', true, 2 FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor'
UNION ALL SELECT id, 'temp_w', 'Temperature Phase W', '?C', 'number', true, 3 FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor'
UNION ALL SELECT id, 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 4 FROM test_types WHERE test_name = 'Winding Temperature' AND asset_type = 'motor';

-- 16. Shaft Alignment - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'offset_horizontal', 'Horizontal Offset', 'mm', 'number', true, 1 FROM test_types WHERE test_name = 'Shaft Alignment' AND asset_type = 'motor'
UNION ALL SELECT id, 'offset_vertical', 'Vertical Offset', 'mm', 'number', true, 2 FROM test_types WHERE test_name = 'Shaft Alignment' AND asset_type = 'motor'
UNION ALL SELECT id, 'angularity', 'Angularity', 'mm/m', 'number', true, 3 FROM test_types WHERE test_name = 'Shaft Alignment' AND asset_type = 'motor';

-- 17. Air Gap Measurement - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'avg_gap', 'Average Air Gap', 'mm', 'number', true, 1 FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'motor'
UNION ALL SELECT id, 'eccentricity', 'Eccentricity', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Air Gap Measurement' AND asset_type = 'motor';

-- 18. Rotor Balance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'unbalance_weight', 'Unbalance Weight', 'g', 'number', true, 1 FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'motor'
UNION ALL SELECT id, 'phase_angle', 'Phase Angle', '?', 'number', true, 2 FROM test_types WHERE test_name = 'Rotor Balance' AND asset_type = 'motor';

-- 19. Current Signature Analysis - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'sideband_frequency', 'Sideband Frequency', 'Hz', 'number', true, 1 FROM test_types WHERE test_name = 'Current Signature Analysis' AND asset_type = 'motor'
UNION ALL SELECT id, 'sideband_amplitude', 'Sideband Amplitude', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Current Signature Analysis' AND asset_type = 'motor'
UNION ALL SELECT id, 'fault_frequency', 'Fault Frequency', 'Hz', 'number', false, 3 FROM test_types WHERE test_name = 'Current Signature Analysis' AND asset_type = 'motor';

-- 20. Thermography - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', true, 1 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'motor'
UNION ALL SELECT id, 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 2 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'motor'
UNION ALL SELECT id, 'delta_t', 'Temperature Difference', '?C', 'number', true, 3 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'motor';

SELECT 'MOTOR: 20 tests completed' as status;
