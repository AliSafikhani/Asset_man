-- =====================================================
-- CLEAN AND COMPLETE TEST FIELD DEFINITIONS
-- First, clear existing field definitions
-- =====================================================

DELETE FROM test_field_definitions;

-- =====================================================
-- TRANSFORMER TESTS (20 tests)
-- =====================================================

-- 1. DGA - 13 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'h2', 'Hydrogen (H2)', 'ppm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'ch4', 'Methane (CH4)', 'ppm', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'c2h2', 'Acetylene (C2H2)', 'ppm', 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'c2h4', 'Ethylene (C2H4)', 'ppm', 'number', true, 4),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'c2h6', 'Ethane (C2H6)', 'ppm', 'number', true, 5),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'co', 'Carbon Monoxide (CO)', 'ppm', 'number', true, 6),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'co2', 'Carbon Dioxide (CO2)', 'ppm', 'number', true, 7),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'o2', 'Oxygen (O2)', '%', 'number', false, 8),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'n2', 'Nitrogen (N2)', '%', 'number', false, 9),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'tdcg', 'Total Dissolved Combustible Gases', 'ppm', 'number', false, 10),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'sample_temp', 'Sample Temperature', '?C', 'number', false, 11),
((SELECT id FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'), 'lab_name', 'Laboratory Name', NULL, 'text', false, 12);

-- 2. Oil Quality - 7 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'dielectric_strength', 'Dielectric Strength', 'kV', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'moisture', 'Moisture Content', 'ppm', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'acidity', 'Acidity', 'mg KOH/g', 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'interfacial_tension', 'Interfacial Tension', 'mN/m', 'number', false, 4),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'color', 'Oil Color', NULL, 'text', false, 5),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'density', 'Density at 20?C', 'kg/m?', 'number', false, 6),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'viscosity', 'Kinematic Viscosity', 'cSt', 'number', false, 7);

-- 3. Insulation Resistance - 7 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'ir_1min', 'Insulation Resistance (1 min)', 'M?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'ir_10min', 'Insulation Resistance (10 min)', 'M?', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'pi', 'Polarization Index', NULL, 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'dar', 'Dielectric Absorption Ratio', NULL, 'number', false, 4),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'test_voltage', 'Test Voltage', 'V', 'number', false, 5),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'temperature', 'Ambient Temperature', '?C', 'number', false, 6),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'humidity', 'Relative Humidity', '%', 'number', false, 7);

-- 4. Winding Resistance - 5 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_hv', 'HV Winding Resistance', '?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_lv', 'LV Winding Resistance', '?', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_tertiary', 'Tertiary Winding Resistance', '?', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'unbalance', 'Phase Unbalance', '%', 'number', true, 4),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'temperature', 'Winding Temperature', '?C', 'number', false, 5);

-- 5. Turns Ratio - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'ratio_hv_lv', 'HV/LV Turns Ratio', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'deviation', 'Deviation from Nameplate', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'tap_position', 'Tap Position', NULL, 'number', false, 3);

-- 6. Furan Analysis - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_2fal', '2-Furaldehyde (2FAL)', 'ppb', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_2acf', '2-Acetylfuran (2ACF)', 'ppb', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_5hmf', '5-Hydroxymethylfurfural (5HMF)', 'ppb', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'total_furans', 'Total Furans', 'ppb', 'number', true, 4);

-- 7. PCB Analysis - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_concentration', 'PCB Concentration', 'ppm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_aroclor_1242', 'Aroclor 1242', 'ppm', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_aroclor_1254', 'Aroclor 1254', 'ppm', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_aroclor_1260', 'Aroclor 1260', 'ppm', 'number', false, 4);

-- 8. Magnetizing Current - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'mag_current_hv', 'Magnetizing Current HV', 'mA', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'mag_current_lv', 'Magnetizing Current LV', 'mA', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'excitation_loss', 'Excitation Loss', 'W', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'power_factor', 'Power Factor', '%', 'number', false, 4);

-- 9. Leakage Reactance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Leakage Reactance' AND asset_type = 'transformer'), 'leakage_reactance', 'Leakage Reactance', '%', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Leakage Reactance' AND asset_type = 'transformer'), 'deviation_percent', 'Deviation', '%', 'number', true, 2);

-- 10. Capacitance & Tan Delta - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'capacitance_hv', 'Capacitance HV', 'pF', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'capacitance_lv', 'Capacitance LV', 'pF', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'tan_delta', 'Tan Delta', '%', 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'), 'power_factor', 'Power Factor', '%', 'number', false, 4);

-- 11. Partial Discharge - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'), 'pd_level', 'Partial Discharge Level', 'pC', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'), 'inception_voltage', 'Inception Voltage', 'kV', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'), 'extinction_voltage', 'Extinction Voltage', 'kV', 'number', false, 3);

-- 12. SFRA - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'), 'correlation_coefficient', 'Correlation Coefficient', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'), 'magnitude_deviation', 'Magnitude Deviation', 'dB', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'), 'phase_deviation', 'Phase Deviation', '?', 'number', false, 3);

-- 13. Bushing Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_capacitance', 'Bushing Capacitance', 'pF', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_power_factor', 'Bushing Power Factor', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_ir', 'Bushing Insulation Resistance', 'M?', 'number', false, 3);

-- 14. OLTC Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'transition_resistance', 'Transition Resistance', '?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'transition_time', 'Transition Time', 'ms', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'motor_current', 'Motor Current', 'A', 'number', false, 3);

-- 15. Thermography - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'delta_t', 'Temperature Difference', '?C', 'number', true, 3);

-- 16. Acoustic Emission - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Acoustic Emission' AND asset_type = 'transformer'), 'sound_level', 'Sound Level', 'dB', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Acoustic Emission' AND asset_type = 'transformer'), 'frequency_peak', 'Frequency Peak', 'kHz', 'number', false, 2);

-- 17. SF6 Gas Analysis - 5 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'sf6_purity', 'SF6 Purity', '%', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'dew_point', 'Dew Point', '?C', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'so2', 'Sulfur Dioxide (SO2)', 'ppm', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'h2s', 'Hydrogen Sulfide (H2S)', 'ppm', 'number', false, 4),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'co', 'Carbon Monoxide (CO)', 'ppm', 'number', false, 5);

-- 18. Vibration Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Vibration Test' AND asset_type = 'transformer'), 'vibration_level', 'Vibration Level', 'mm/s', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Vibration Test' AND asset_type = 'transformer'), 'frequency_spectrum', 'Dominant Frequency', 'Hz', 'number', false, 2);

-- 19. Core Ground Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Core Ground Test' AND asset_type = 'transformer'), 'core_current', 'Core Ground Current', 'mA', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Core Ground Test' AND asset_type = 'transformer'), 'insulation_resistance', 'Core Insulation Resistance', 'M?', 'number', false, 2);

-- 20. Visual Inspection - 5 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'oil_leak', 'Oil Leak Detected', NULL, 'select', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'corrosion', 'Corrosion Observed', NULL, 'select', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'bushing_condition', 'Bushing Condition', NULL, 'select', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'cooling_system', 'Cooling System Status', NULL, 'select', false, 4),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'overall_condition', 'Overall Condition', NULL, 'select', true, 5);

-- Set allowed values for select fields
UPDATE test_field_definitions SET allowed_values = '["Yes", "No"]' WHERE field_name IN ('oil_leak', 'corrosion');
UPDATE test_field_definitions SET allowed_values = '["Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'bushing_condition';
UPDATE test_field_definitions SET allowed_values = '["Operational", "Needs Maintenance", "Failed"]' WHERE field_name = 'cooling_system';
UPDATE test_field_definitions SET allowed_values = '["Excellent", "Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'overall_condition';

SELECT 'TRANSFORMER: 20 tests, ' || COUNT(*) || ' fields defined' as status FROM test_field_definitions WHERE test_type_id IN (SELECT id FROM test_types WHERE asset_type = 'transformer');
