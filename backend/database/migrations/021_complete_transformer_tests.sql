-- =====================================================
-- COMPLETE TEST FIELD DEFINITIONS FOR ALL 60 TEST TYPES
-- =====================================================

-- =====================================================
-- TRANSFORMER TESTS (20 tests)
-- =====================================================

-- 1. DGA (Already done - 12 fields)
-- 2. Oil Quality (Already done - 7 fields)
-- 3. Insulation Resistance (Already done - 7 fields)
-- 4. Winding Resistance (Already done - 5 fields)
-- 5. Turns Ratio (Already done - 3 fields)

-- 6. Furan Analysis
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_2fal', '2-Furaldehyde (2FAL)', 'ppb', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_2acf', '2-Acetylfuran (2ACF)', 'ppb', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'furan_5hmf', '5-Hydroxymethylfurfural (5HMF)', 'ppb', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'Furan Analysis' AND asset_type = 'transformer'), 'total_furans', 'Total Furans', 'ppb', 'number', true, 4);

-- 7. PCB Analysis
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_concentration', 'PCB Concentration', 'ppm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_aroclor_1242', 'Aroclor 1242', 'ppm', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_aroclor_1254', 'Aroclor 1254', 'ppm', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'PCB Analysis' AND asset_type = 'transformer'), 'pcb_aroclor_1260', 'Aroclor 1260', 'ppm', 'number', false, 4);

-- 8. Magnetizing Current
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'mag_current_hv', 'Magnetizing Current HV', 'mA', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'mag_current_lv', 'Magnetizing Current LV', 'mA', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'excitation_loss', 'Excitation Loss', 'W', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'Magnetizing Current' AND asset_type = 'transformer'), 'power_factor', 'Power Factor', '%', 'number', false, 4);

-- 9. Leakage Reactance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Leakage Reactance' AND asset_type = 'transformer'), 'leakage_reactance', 'Leakage Reactance', '%', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Leakage Reactance' AND asset_type = 'transformer'), 'deviation_percent', 'Deviation', '%', 'number', true, 2);

-- 10. Capacitance & Tan Delta (Already done - 4 fields)

-- 11. Partial Discharge (Already done - 3 fields)

-- 12. SFRA (Frequency Response)
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'), 'correlation_coefficient', 'Correlation Coefficient', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'), 'magnitude_deviation', 'Magnitude Deviation', 'dB', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'SFRA' AND asset_type = 'transformer'), 'phase_deviation', 'Phase Deviation', '?', 'number', false, 3);

-- 13. Bushing Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_capacitance', 'Bushing Capacitance', 'pF', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_power_factor', 'Bushing Power Factor', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Bushing Test' AND asset_type = 'transformer'), 'bushing_ir', 'Bushing Insulation Resistance', 'M?', 'number', false, 3);

-- 14. OLTC Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'transition_resistance', 'Transition Resistance', '?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'transition_time', 'Transition Time', 'ms', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'OLTC Test' AND asset_type = 'transformer'), 'motor_current', 'Motor Current', 'A', 'number', false, 3);

-- 15. Thermography
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'ambient_temp', 'Ambient Temperature', '?C', 'number', false, 2),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'transformer'), 'delta_t', 'Temperature Difference', '?C', 'number', true, 3);

-- 16. Acoustic Emission
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Acoustic Emission' AND asset_type = 'transformer'), 'sound_level', 'Sound Level', 'dB', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Acoustic Emission' AND asset_type = 'transformer'), 'frequency_peak', 'Frequency Peak', 'kHz', 'number', false, 2);

-- 17. SF6 Gas Analysis
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'sf6_purity', 'SF6 Purity', '%', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'dew_point', 'Dew Point', '?C', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'so2', 'Sulfur Dioxide (SO2)', 'ppm', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'h2s', 'Hydrogen Sulfide (H2S)', 'ppm', 'number', false, 4),
((SELECT id FROM test_types WHERE test_name = 'SF6 Gas Analysis' AND asset_type = 'transformer'), 'co', 'Carbon Monoxide (CO)', 'ppm', 'number', false, 5);

-- 18. Vibration Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Vibration Test' AND asset_type = 'transformer'), 'vibration_level', 'Vibration Level', 'mm/s', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Vibration Test' AND asset_type = 'transformer'), 'frequency_spectrum', 'Dominant Frequency', 'Hz', 'number', false, 2);

-- 19. Core Ground Test
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Core Ground Test' AND asset_type = 'transformer'), 'core_current', 'Core Ground Current', 'mA', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Core Ground Test' AND asset_type = 'transformer'), 'insulation_resistance', 'Core Insulation Resistance', 'M?', 'number', false, 2);

-- 20. Visual Inspection
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'oil_leak', 'Oil Leak Detected', NULL, 'select', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'corrosion', 'Corrosion Observed', NULL, 'select', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'bushing_condition', 'Bushing Condition', NULL, 'select', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'cooling_system', 'Cooling System Status', NULL, 'select', false, 4),
((SELECT id FROM test_types WHERE test_name = 'Visual Inspection' AND asset_type = 'transformer'), 'overall_condition', 'Overall Condition', NULL, 'select', true, 5);

-- Update allowed values for select fields
UPDATE test_field_definitions SET allowed_values = '["Yes", "No"]' WHERE field_name = 'oil_leak';
UPDATE test_field_definitions SET allowed_values = '["Yes", "No"]' WHERE field_name = 'corrosion';
UPDATE test_field_definitions SET allowed_values = '["Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'bushing_condition';
UPDATE test_field_definitions SET allowed_values = '["Operational", "Needs Maintenance", "Failed"]' WHERE field_name = 'cooling_system';
UPDATE test_field_definitions SET allowed_values = '["Excellent", "Good", "Fair", "Poor", "Critical"]' WHERE field_name = 'overall_condition';

SELECT 'Transformer test fields completed' as status;
