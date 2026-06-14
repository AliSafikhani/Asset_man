-- DGA Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'h2', 'Hydrogen (H2)', 'ppm', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'ch4', 'Methane (CH4)', 'ppm', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'c2h2', 'Acetylene (C2H2)', 'ppm', 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'c2h4', 'Ethylene (C2H4)', 'ppm', 'number', true, 4),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'c2h6', 'Ethane (C2H6)', 'ppm', 'number', true, 5),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'co', 'Carbon Monoxide (CO)', 'ppm', 'number', true, 6),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'co2', 'Carbon Dioxide (CO2)', 'ppm', 'number', true, 7),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'o2', 'Oxygen (O2)', '%', 'number', false, 8),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'n2', 'Nitrogen (N2)', '%', 'number', false, 9),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'tdcg', 'Total Dissolved Combustible Gases', 'ppm', 'number', false, 10),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'sample_temp', 'Sample Temperature', '?C', 'number', false, 11),
((SELECT id FROM test_types WHERE test_name = 'DGA (Dissolved Gas Analysis)' AND asset_type = 'transformer'), 'lab_name', 'Laboratory Name', NULL, 'text', false, 12);

-- Oil Quality Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'dielectric_strength', 'Dielectric Strength', 'kV', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'moisture', 'Moisture Content', 'ppm', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'acidity', 'Acidity', 'mg KOH/g', 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'interfacial_tension', 'Interfacial Tension', 'mN/m', 'number', false, 4),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'color', 'Oil Color', NULL, 'text', false, 5),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'density', 'Density at 20?C', 'kg/m?', 'number', false, 6),
((SELECT id FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'), 'viscosity', 'Kinematic Viscosity', 'cSt', 'number', false, 7);

-- Insulation Resistance Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'ir_1min', 'Insulation Resistance (1 min)', 'M?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'ir_10min', 'Insulation Resistance (10 min)', 'M?', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'pi', 'Polarization Index', NULL, 'number', true, 3),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'dar', 'Dielectric Absorption Ratio', NULL, 'number', false, 4),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'test_voltage', 'Test Voltage', 'V', 'number', false, 5),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'temperature', 'Ambient Temperature', '?C', 'number', false, 6),
((SELECT id FROM test_types WHERE test_name = 'Insulation Resistance' AND asset_type = 'transformer'), 'humidity', 'Relative Humidity', '%', 'number', false, 7);

-- Winding Resistance Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_hv', 'HV Winding Resistance', '?', 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_lv', 'LV Winding Resistance', '?', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'r_tertiary', 'Tertiary Winding Resistance', '?', 'number', false, 3),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'unbalance', 'Phase Unbalance', '%', 'number', true, 4),
((SELECT id FROM test_types WHERE test_name = 'Winding Resistance' AND asset_type = 'transformer'), 'temperature', 'Winding Temperature', '?C', 'number', false, 5);

-- Turns Ratio Test Fields
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'ratio_hv_lv', 'HV/LV Turns Ratio', NULL, 'number', true, 1),
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'deviation', 'Deviation from Nameplate', '%', 'number', true, 2),
((SELECT id FROM test_types WHERE test_name = 'Turns Ratio' AND asset_type = 'transformer'), 'tap_position', 'Tap Position', NULL, 'number', false, 3);

SELECT 'Test fields inserted successfully' as status;
