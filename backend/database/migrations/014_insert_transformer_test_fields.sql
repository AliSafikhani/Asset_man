-- DGA (Dissolved Gas Analysis) fields for Transformer
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, min_value, max_value, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'h2', 'Hydrogen (H2)', 'ppm', 'number', TRUE, 0, 2000, 1),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'ch4', 'Methane (CH4)', 'ppm', 'number', TRUE, 0, 1000, 2),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'c2h2', 'Acetylene (C2H2)', 'ppm', 'number', TRUE, 0, 50, 3),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'c2h4', 'Ethylene (C2H4)', 'ppm', 'number', TRUE, 0, 500, 4),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'c2h6', 'Ethane (C2H6)', 'ppm', 'number', TRUE, 0, 300, 5),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'co', 'Carbon Monoxide (CO)', 'ppm', 'number', TRUE, 0, 1000, 6),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'co2', 'Carbon Dioxide (CO2)', 'ppm', 'number', TRUE, 0, 5000, 7),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'o2', 'Oxygen (O2)', '%', 'number', FALSE, 0, 20, 8),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'n2', 'Nitrogen (N2)', '%', 'number', FALSE, 0, 80, 9),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'tdcg', 'Total Dissolved Combustible Gases', 'ppm', 'number', FALSE, 0, 3000, 10),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'sample_temp', 'Sample Temperature', '?C', 'number', FALSE, -20, 60, 11),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'lab_name', 'Laboratory Name', NULL, 'text', FALSE, NULL, NULL, 12);

-- Oil Quality Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, min_value, max_value, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'dielectric_strength', 'Dielectric Strength', 'kV', 'number', TRUE, 30, 80, 1),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'moisture', 'Moisture Content', 'ppm', 'number', TRUE, 0, 50, 2),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'acidity', 'Acidity', 'mg KOH/g', 'number', TRUE, 0, 0.5, 3),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'interfacial_tension', 'Interfacial Tension', 'mN/m', 'number', FALSE, 20, 50, 4),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'color', 'Oil Color', NULL, 'text', FALSE, NULL, NULL, 5),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'density', 'Density at 20?C', 'kg/m?', 'number', FALSE, 850, 900, 6),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'viscosity', 'Kinematic Viscosity', 'cSt', 'number', FALSE, 10, 30, 7);

-- Insulation Resistance Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, min_value, max_value, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'ir_1min', 'Insulation Resistance (1 min)', 'M?', 'number', TRUE, 100, 10000, 1),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'ir_10min', 'Insulation Resistance (10 min)', 'M?', 'number', TRUE, 200, 20000, 2),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'pi', 'Polarization Index', NULL, 'number', TRUE, 1.5, 4, 3),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'dar', 'Dielectric Absorption Ratio', NULL, 'number', FALSE, 1.2, 2, 4),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'test_voltage', 'Test Voltage', 'V', 'number', FALSE, 500, 5000, 5),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'temperature', 'Ambient Temperature', '?C', 'number', FALSE, -10, 50, 6),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'humidity', 'Relative Humidity', '%', 'number', FALSE, 0, 100, 7);

-- Winding Resistance Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, min_value, max_value, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_hv', 'HV Winding Resistance', '?', 'number', TRUE, 0, 1000, 1),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_lv', 'LV Winding Resistance', '?', 'number', TRUE, 0, 100, 2),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_tertiary', 'Tertiary Winding Resistance', '?', 'number', FALSE, 0, 500, 3),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'unbalance', 'Phase Unbalance', '%', 'number', TRUE, 0, 2, 4),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'temperature', 'Winding Temperature', '?C', 'number', FALSE, 0, 120, 5);

-- Turns Ratio Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, min_value, max_value, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'ratio_hv_lv', 'HV/LV Turns Ratio', NULL, 'number', TRUE, 0, 100, 1),
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'deviation', 'Deviation from Nameplate', '%', 'number', TRUE, 0, 0.5, 2),
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'tap_position', 'Tap Position', NULL, 'number', FALSE, 1, 33, 3);

-- Partial Discharge Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, min_value, max_value, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'), 'pd_level', 'Partial Discharge Level', 'pC', 'number', TRUE, 0, 500, 1),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'), 'inception_voltage', 'Inception Voltage', 'kV', 'number', FALSE, 0, 200, 2),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'transformer'), 'extinction_voltage', 'Extinction Voltage', 'kV', 'number', FALSE, 0, 200, 3);

SELECT 'Transformer test fields inserted' as status;
