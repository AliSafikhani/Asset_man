-- Generator: Stator Winding Resistance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'r_phase_a', 'Resistance Phase A', '?', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'r_phase_b', 'Resistance Phase B', '?', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'r_phase_c', 'Resistance Phase C', '?', 'number', TRUE, 3),
((SELECT id FROM test_types WHERE test_name = 'Stator Winding Resistance' AND asset_type = 'generator'), 'unbalance', 'Phase Unbalance', '%', 'number', TRUE, 4);

-- Generator: Stator Insulation Resistance
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'), 'ir_1min', 'Insulation Resistance (1 min)', 'M?', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'), 'ir_10min', 'Insulation Resistance (10 min)', 'M?', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Stator Insulation Resistance' AND asset_type = 'generator'), 'pi', 'Polarization Index', NULL, 'number', TRUE, 3);

-- Generator: Partial Discharge
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_level', 'Partial Discharge Level', 'pC', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_phase_a', 'PD Phase A', 'pC', 'number', FALSE, 2),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_phase_b', 'PD Phase B', 'pC', 'number', FALSE, 3),
((SELECT id FROM test_types WHERE test_name = 'Partial Discharge' AND asset_type = 'generator'), 'pd_phase_c', 'PD Phase C', 'pC', 'number', FALSE, 4);

-- Generator: Vibration Analysis
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'), 'vibration_de', 'Drive End Vibration', 'mm/s', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'), 'vibration_nde', 'Non-Drive End Vibration', 'mm/s', 'number', TRUE, 2),
((SELECT id FROM test_types WHERE test_name = 'Vibration Analysis' AND asset_type = 'generator'), 'vibration_radial', 'Radial Vibration', 'mm/s', 'number', FALSE, 3);

-- Generator: Thermography
INSERT INTO test_field_definitions (test_type_id, field_name, display_name, unit, data_type, is_required, display_order) VALUES
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'), 'hotspot_temp', 'Hotspot Temperature', '?C', 'number', TRUE, 1),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'), 'ambient_temp', 'Ambient Temperature', '?C', 'number', FALSE, 2),
((SELECT id FROM test_types WHERE test_name = 'Thermography' AND asset_type = 'generator'), 'delta_t', 'Temperature Difference', '?C', 'number', TRUE, 3);

SELECT 'Generator critical tests inserted' as status;
