-- Insert Transformer Tests (20 tests)
INSERT INTO test_types (test_name, asset_type, test_category, description) VALUES 
('DGA (Dissolved Gas Analysis)', 'transformer', 'Oil Test', 'Dissolved Gas Analysis - 9 gases: H2, CH4, C2H2, C2H4, C2H6, CO, CO2, O2, N2'),
('Oil Quality', 'transformer', 'Oil Test', 'Oil quality parameters: Dielectric strength, Moisture, Acidity, Interfacial tension, Color'),
('Furan Analysis', 'transformer', 'Oil Test', 'Furanic compounds for paper degradation assessment'),
('PCB Analysis', 'transformer', 'Oil Test', 'Polychlorinated biphenyls contamination measurement'),
('Insulation Resistance', 'transformer', 'Electrical Test', 'Insulation resistance measurement with PI and DAR'),
('Winding Resistance', 'transformer', 'Electrical Test', 'DC resistance measurement of all windings'),
('Turns Ratio', 'transformer', 'Electrical Test', 'Transformer turns ratio test with deviation'),
('Magnetizing Current', 'transformer', 'Electrical Test', 'Excitation current measurement'),
('Leakage Reactance', 'transformer', 'Electrical Test', 'Leakage reactance measurement'),
('Capacitance & Tan Delta', 'transformer', 'Insulation Test', 'Capacitance and dissipation factor measurement'),
('Partial Discharge', 'transformer', 'Insulation Test', 'Partial discharge measurement in pC'),
('SFRA', 'transformer', 'Diagnostic Test', 'Sweep Frequency Response Analysis'),
('Bushing Test', 'transformer', 'Component Test', 'Bushing insulation and capacitance test'),
('OLTC Test', 'transformer', 'Mechanical Test', 'On-Load Tap Changer dynamic resistance measurement'),
('Thermography', 'transformer', 'Thermal Test', 'Infrared thermography inspection'),
('Acoustic Emission', 'transformer', 'Diagnostic Test', 'Acoustic emission monitoring'),
('SF6 Gas Analysis', 'transformer', 'Gas Test', 'SF6 gas quality analysis for GIS transformers'),
('Vibration Test', 'transformer', 'Mechanical Test', 'Vibration level measurement'),
('Core Ground Test', 'transformer', 'Electrical Test', 'Core ground current measurement'),
('Visual Inspection', 'transformer', 'Visual', 'Internal and external visual inspection')
ON CONFLICT (test_name, asset_type) DO NOTHING;

-- Insert Generator Tests (20 tests)
INSERT INTO test_types (test_name, asset_type, test_category, description) VALUES 
('Stator Winding Resistance', 'generator', 'Electrical Test', 'Stator winding DC resistance per phase'),
('Rotor Winding Resistance', 'generator', 'Electrical Test', 'Rotor winding DC resistance'),
('Stator Insulation Resistance', 'generator', 'Electrical Test', 'Stator insulation resistance and PI'),
('Rotor Insulation Resistance', 'generator', 'Electrical Test', 'Rotor insulation resistance'),
('Polarization Index', 'generator', 'Electrical Test', 'Polarization Index measurement'),
('DC Hi-Pot Test', 'generator', 'Electrical Test', 'DC High Potential test'),
('AC Hi-Pot Test', 'generator', 'Electrical Test', 'AC High Potential withstand test'),
('Partial Discharge', 'generator', 'Insulation Test', 'Partial discharge measurement'),
('Tan Delta', 'generator', 'Insulation Test', 'Dissipation factor / Power factor'),
('Capacitance Test', 'generator', 'Insulation Test', 'Stator winding capacitance'),
('Open Circuit Test', 'generator', 'Performance Test', 'Open circuit characteristics'),
('Short Circuit Test', 'generator', 'Performance Test', 'Short circuit characteristics'),
('Load Test', 'generator', 'Performance Test', 'Load performance and efficiency'),
('Vibration Analysis', 'generator', 'Mechanical Test', 'Vibration spectrum analysis'),
('Shaft Voltage Test', 'generator', 'Electrical Test', 'Shaft voltage and bearing current'),
('Air Gap Measurement', 'generator', 'Mechanical Test', 'Rotor-stator air gap measurement'),
('Rotor Balance', 'generator', 'Mechanical Test', 'Rotor dynamic balancing'),
('Over Speed Test', 'generator', 'Mechanical Test', 'Overspeed protection test'),
('Excitation System Test', 'generator', 'Control Test', 'AVR and excitation system performance'),
('Thermography', 'generator', 'Thermal Test', 'Infrared thermography inspection')
ON CONFLICT (test_name, asset_type) DO NOTHING;

-- Insert Motor Tests (20 tests)
INSERT INTO test_types (test_name, asset_type, test_category, description) VALUES 
('Winding Resistance', 'motor', 'Electrical Test', 'Stator winding DC resistance per phase'),
('Insulation Resistance', 'motor', 'Electrical Test', 'Insulation resistance and PI'),
('Polarization Index', 'motor', 'Electrical Test', 'Polarization Index measurement'),
('DC Hi-Pot Test', 'motor', 'Electrical Test', 'DC High Potential test'),
('AC Hi-Pot Test', 'motor', 'Electrical Test', 'AC High Potential withstand test'),
('Surge Test', 'motor', 'Electrical Test', 'Surge comparison test for turn insulation'),
('Partial Discharge', 'motor', 'Insulation Test', 'Partial discharge measurement'),
('Tan Delta', 'motor', 'Insulation Test', 'Dissipation factor measurement'),
('Capacitance Test', 'motor', 'Insulation Test', 'Winding capacitance measurement'),
('No Load Test', 'motor', 'Performance Test', 'No load current and losses'),
('Locked Rotor Test', 'motor', 'Performance Test', 'Locked rotor current and torque'),
('Load Test', 'motor', 'Performance Test', 'Load performance and efficiency'),
('Vibration Analysis', 'motor', 'Mechanical Test', 'Vibration spectrum analysis'),
('Bearing Temperature', 'motor', 'Thermal Test', 'Bearing temperature measurement'),
('Winding Temperature', 'motor', 'Thermal Test', 'Winding temperature rise'),
('Shaft Alignment', 'motor', 'Mechanical Test', 'Shaft alignment check'),
('Air Gap Measurement', 'motor', 'Mechanical Test', 'Air gap measurement'),
('Rotor Balance', 'motor', 'Mechanical Test', 'Rotor dynamic balancing'),
('Current Signature Analysis', 'motor', 'Diagnostic Test', 'Motor current signature analysis'),
('Thermography', 'motor', 'Thermal Test', 'Infrared thermography inspection')
ON CONFLICT (test_name, asset_type) DO NOTHING;

-- Verify insertion
SELECT asset_type, COUNT(*) as test_count FROM test_types GROUP BY asset_type;
