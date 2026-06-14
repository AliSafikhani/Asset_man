-- =====================================================
-- COMPLETE TEST FIELD DEFINITIONS FOR ALL 60 TESTS
-- =====================================================

-- =====================================================
-- TRANSFORMER TESTS (20 tests)
-- =====================================================

-- 1. DGA - 12 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'h2', 'Hydrogen (H2)', 'ppm', 'number', true, 1 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'ch4', 'Methane (CH4)', 'ppm', 'number', true, 2 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'c2h2', 'Acetylene (C2H2)', 'ppm', 'number', true, 3 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'c2h4', 'Ethylene (C2H4)', 'ppm', 'number', true, 4 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'c2h6', 'Ethane (C2H6)', 'ppm', 'number', true, 5 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'co', 'Carbon Monoxide (CO)', 'ppm', 'number', true, 6 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'co2', 'Carbon Dioxide (CO2)', 'ppm', 'number', true, 7 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'o2', 'Oxygen (O2)', '%', 'number', false, 8 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'n2', 'Nitrogen (N2)', '%', 'number', false, 9 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'tdcg', 'Total Dissolved Combustible Gases', 'ppm', 'number', false, 10 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'sample_temp', 'Sample Temperature', '?C', 'number', false, 11 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'lab_name', 'Laboratory Name', NULL, 'text', false, 12 FROM test_types WHERE test_name = 'DGA' AND asset_type = 'transformer';

-- 2. Oil Quality - 7 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'dielectric_strength', 'Dielectric Strength', 'kV', 'number', true, 1 FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'moisture', 'Moisture Content', 'ppm', 'number', true, 2 FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'acidity', 'Acidity', 'mg KOH/g', 'number', true, 3 FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'interfacial_tension', 'Interfacial Tension', 'mN/m', 'number', false, 4 FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'color', 'Oil Color', NULL, 'text', false, 5 FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'density', 'Density at 20?C', 'kg/m?', 'number', false, 6 FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'viscosity', 'Kinematic Viscosity', 'cSt', 'number', false, 7 FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer';

-- 3. Insulation Resistance - 7 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'ir_1min', 'Insulation Resistance (1 min)', 'M?', 'number', true, 1 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'ir_10min', 'Insulation Resistance (10 min)', 'M?', 'number', true, 2 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'pi', 'Polarization Index', NULL, 'number', true, 3 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'dar', 'Dielectric Absorption Ratio', NULL, 'number', false, 4 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'test_voltage', 'Test Voltage', 'V', 'number', false, 5 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'temperature', 'Ambient Temperature', '?C', 'number', false, 6 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'humidity', 'Relative Humidity', '%', 'number', false, 7 FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer';

-- 4. Winding Resistance - 5 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'r_hv', 'HV Winding Resistance', '?', 'number', true, 1 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'r_lv', 'LV Winding Resistance', '?', 'number', true, 2 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'r_tertiary', 'Tertiary Winding Resistance', '?', 'number', false, 3 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'unbalance', 'Phase Unbalance', '%', 'number', true, 4 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'temperature', 'Winding Temperature', '?C', 'number', false, 5 FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer';

-- 5. Turns Ratio - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'ratio_hv_lv', 'HV/LV Turns Ratio', NULL, 'number', true, 1 FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'
UNION ALL SELECT id, 'deviation', 'Deviation from Nameplate', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'
UNION ALL SELECT id, 'tap_position', 'Tap Position', NULL, 'number', false, 3 FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer';

-- 6. Furan Analysis - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'furan_2fal', '2-Furaldehyde (2FAL)', 'ppb', 'number', true, 1 FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'furan_2acf', '2-Acetylfuran (2ACF)', 'ppb', 'number', false, 2 FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'furan_5hmf', '5-Hydroxymethylfurfural (5HMF)', 'ppb', 'number', false, 3 FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'total_furans', 'Total Furans', 'ppb', 'number', true, 4 FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer';

-- 7. PCB Analysis - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'pcb_concentration', 'PCB Concentration', 'ppm', 'number', true, 1 FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'pcb_aroclor_1242', 'Aroclor 1242', 'ppm', 'number', false, 2 FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'pcb_aroclor_1254', 'Aroclor 1254', 'ppm', 'number', false, 3 FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'pcb_aroclor_1260', 'Aroclor 1260', 'ppm', 'number', false, 4 FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer';

-- 8. Magnetizing Current - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'mag_current_hv', 'Magnetizing Current HV', 'mA', 'number', true, 1 FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'
UNION ALL SELECT id, 'mag_current_lv', 'Magnetizing Current LV', 'mA', 'number', true, 2 FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'
UNION ALL SELECT id, 'excitation_loss', 'Excitation Loss', 'W', 'number', false, 3 FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'
UNION ALL SELECT id, 'power_factor', 'Power Factor', '%', 'number', false, 4 FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer';

-- 9. Leakage Reactance - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'leakage_reactance', 'Leakage Reactance', '%', 'number', true, 1 FROM test_types WHERE test_name = 'Leakage Reactance' AND asset_type = 'transformer'
UNION ALL SELECT id, 'deviation_percent', 'Deviation', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Leakage Reactance' AND asset_type = 'transformer';

-- 10. Capacitance & Tan Delta - 4 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'capacitance_hv', 'Capacitance HV', 'pF', 'number', true, 1 FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'
UNION ALL SELECT id, 'capacitance_lv', 'Capacitance LV', 'pF', 'number', true, 2 FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'
UNION ALL SELECT id, 'tan_delta', 'Tan Delta', '%', 'number', true, 3 FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer'
UNION ALL SELECT id, 'power_factor', 'Power Factor', '%', 'number', false, 4 FROM test_types WHERE test_name = 'Capacitance & Tan Delta' AND asset_type = 'transformer';

-- 11. Partial Discharge - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'pd_level', 'Partial Discharge Level', 'pC', 'number', true, 1 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'
UNION ALL SELECT id, 'inception_voltage', 'Inception Voltage', 'kV', 'number', false, 2 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'
UNION ALL SELECT id, 'extinction_voltage', 'Extinction Voltage', 'kV', 'number', false, 3 FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer';

-- 12. SFRA - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'correlation_coefficient', 'Correlation Coefficient', NULL, 'number', true, 1 FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'magnitude_deviation', 'Magnitude Deviation', 'dB', 'number', true, 2 FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'
UNION ALL SELECT id, 'phase_deviation', 'Phase Deviation', '?', 'number', false, 3 FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer';

-- 13. Bushing Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'bushing_capacitance', 'Bushing Capacitance', 'pF', 'number', true, 1 FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'
UNION ALL SELECT id, 'bushing_power_factor', 'Bushing Power Factor', '%', 'number', true, 2 FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'
UNION ALL SELECT id, 'bushing_ir', 'Bushing Insulation Resistance', 'M?', 'number', false, 3 FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer';

-- 14. OLTC Test - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'transition_resistance', 'Transition Resistance', '?', 'number', true, 1 FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'
UNION ALL SELECT id, 'transition_time', 'Transition Time', 'ms', 'number', true, 2 FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'
UNION ALL SELECT id, 'motor_current', 'Motor Current', 'A', 'number', false, 3 FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer';

-- 15. Thermography - 3 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', true, 1 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'
UNION ALL SELECT id, 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 2 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'
UNION ALL SELECT id, 'delta_t', 'Temperature Difference', '?C', 'number', true, 3 FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer';

-- 16. Acoustic Emission - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'sound_level', 'Sound Level', 'dB', 'number', true, 1 FROM test_types WHERE test_name = 'Acoustic Emission' AND asset_type = 'transformer'
UNION ALL SELECT id, 'frequency_peak', 'Frequency Peak', 'kHz', 'number', false, 2 FROM test_types WHERE test_name = 'Acoustic Emission' AND asset_type = 'transformer';

-- 17. SF6 Gas Analysis - 5 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'sf6_purity', 'SF6 Purity', '%', 'number', true, 1 FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'dew_point', 'Dew Point', '?C', 'number', true, 2 FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'so2', 'Sulfur Dioxide (SO2)', 'ppm', 'number', false, 3 FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'h2s', 'Hydrogen Sulfide (H2S)', 'ppm', 'number', false, 4 FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'
UNION ALL SELECT id, 'co', 'Carbon Monoxide (CO)', 'ppm', 'number', false, 5 FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer';

-- 18. Vibration Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'vibration_level', 'Vibration Level', 'mm/s', 'number', true, 1 FROM test_types WHERE test_name = 'Vibration Test' AND asset_type = 'transformer'
UNION ALL SELECT id, 'frequency_spectrum', 'Dominant Frequency', 'Hz', 'number', false, 2 FROM test_types WHERE test_name = 'Vibration Test' AND asset_type = 'transformer';

-- 19. Core Ground Test - 2 fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'core_current', 'Core Ground Current', 'mA', 'number', true, 1 FROM test_types WHERE test_name = 'Core Ground Test' AND asset_type = 'transformer'
UNION ALL SELECT id, 'insulation_resistance', 'Core Insulation Resistance', 'M?', 'number', false, 2 FROM test_types WHERE test_name = 'Core Ground Test' AND asset_type = 'transformer';

-- 20. Visual Inspection - 5 fields (select type)
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order)
SELECT id, 'oil_leak', 'Oil Leak Detected', NULL, 'select', true, 1 FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'
UNION ALL SELECT id, 'corrosion', 'Corrosion Observed', NULL, 'select', true, 2 FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'
UNION ALL SELECT id, 'bushing_condition', 'Bushing Condition', NULL, 'select', true, 3 FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'
UNION ALL SELECT id, 'cooling_system', 'Cooling System Status', NULL, 'select', false, 4 FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'
UNION ALL SELECT id, 'overall_condition', 'Overall Condition', NULL, 'select', true, 5 FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer';

-- Set allowed values for select fields
UPDATE test_field_definitions SET allowed_values = '["Yes", "No"]' WHERE field_name IN ('oil_leak', 'corrosion');
UPDATE test_field_definitions SET allowed_values = '["Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'bushing_condition';
UPDATE test_field_definitions SET allowed_values = '["Operational", "Needs Maintenance", "Failed"]' WHERE field_name = 'cooling_system';
UPDATE test_field_definitions SET allowed_values = '["Excellent", "Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'overall_condition';

SELECT 'TRANSFORMER: 20 tests completed' as status;
