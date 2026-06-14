-- =====================================================
-- PROPER CLEANUP WITH CASCADE
-- =====================================================

-- First, delete all test results (they reference test_types)
DELETE FROM test_results;
DELETE FROM test_parameters;

-- Then delete all field definitions
DELETE FROM test_field_definitions;

-- Now delete all test types
DELETE FROM test_types;

-- Insert exactly 20 TRANSFORMER tests
INSERT INTO test_types (test_name, asset_type, test_category, description) VALUES
('DGA', 'transformer', 'Oil Test', 'Dissolved Gas Analysis - 9 gases'),
('Oil Quality', 'transformer', 'Oil Test', 'Oil quality parameters'),
('Insulation Resistance', 'transformer', 'Electrical Test', 'Insulation resistance measurement'),
('Winding Resistance', 'transformer', 'Electrical Test', 'Winding resistance measurement'),
('Turns Ratio', 'transformer', 'Electrical Test', 'Transformer turns ratio test'),
('Furan Analysis', 'transformer', 'Oil Test', 'Furanic compounds analysis'),
('PCB Analysis', 'transformer', 'Oil Test', 'PCB contamination analysis'),
('Magnetizing Current', 'transformer', 'Electrical Test', 'Excitation current measurement'),
('Leakage Reactance', 'transformer', 'Electrical Test', 'Leakage reactance measurement'),
('Capacitance & Tan Delta', 'transformer', 'Insulation Test', 'Capacitance and dissipation factor'),
('Partial Discharge', 'transformer', 'Insulation Test', 'Partial discharge measurement'),
('SFRA', 'transformer', 'Diagnostic Test', 'Sweep Frequency Response Analysis'),
('Bushing Test', 'transformer', 'Component Test', 'Bushing insulation test'),
('OLTC Test', 'transformer', 'Mechanical Test', 'On-Load Tap Changer test'),
('Thermography', 'transformer', 'Thermal Test', 'Infrared thermography'),
('Acoustic Emission', 'transformer', 'Diagnostic Test', 'Acoustic emission monitoring'),
('SF6 Gas Analysis', 'transformer', 'Gas Test', 'SF6 gas quality analysis'),
('Vibration Test', 'transformer', 'Mechanical Test', 'Vibration measurement'),
('Core Ground Test', 'transformer', 'Electrical Test', 'Core ground current test'),
('Visual Inspection', 'transformer', 'Visual', 'Visual inspection report');

-- Insert exactly 20 GENERATOR tests
INSERT INTO test_types (test_name, asset_type, test_category, description) VALUES
('Stator Winding Resistance', 'generator', 'Electrical Test', 'Stator DC resistance measurement'),
('Rotor Winding Resistance', 'generator', 'Electrical Test', 'Rotor DC resistance measurement'),
('Stator Insulation Resistance', 'generator', 'Electrical Test', 'Stator insulation resistance'),
('Rotor Insulation Resistance', 'generator', 'Electrical Test', 'Rotor insulation resistance'),
('Polarization Index', 'generator', 'Electrical Test', 'Polarization Index measurement'),
('DC Hi-Pot Test', 'generator', 'Electrical Test', 'DC High Potential test'),
('AC Hi-Pot Test', 'generator', 'Electrical Test', 'AC High Potential test'),
('Partial Discharge', 'generator', 'Insulation Test', 'Partial discharge measurement'),
('Tan Delta', 'generator', 'Insulation Test', 'Dissipation factor test'),
('Capacitance Test', 'generator', 'Insulation Test', 'Capacitance measurement'),
('Open Circuit Test', 'generator', 'Performance Test', 'Open circuit characteristics'),
('Short Circuit Test', 'generator', 'Performance Test', 'Short circuit characteristics'),
('Load Test', 'generator', 'Performance Test', 'Load performance test'),
('Vibration Analysis', 'generator', 'Mechanical Test', 'Vibration measurement'),
('Shaft Voltage Test', 'generator', 'Electrical Test', 'Shaft voltage measurement'),
('Air Gap Measurement', 'generator', 'Mechanical Test', 'Air gap measurement'),
('Rotor Balance', 'generator', 'Mechanical Test', 'Rotor balancing test'),
('Over Speed Test', 'generator', 'Mechanical Test', 'Overspeed protection test'),
('Excitation System Test', 'generator', 'Control Test', 'Excitation system test'),
('Thermography', 'generator', 'Thermal Test', 'Infrared thermography');

-- Insert exactly 20 MOTOR tests
INSERT INTO test_types (test_name, asset_type, test_category, description) VALUES
('Winding Resistance', 'motor', 'Electrical Test', 'Stator winding resistance'),
('Insulation Resistance', 'motor', 'Electrical Test', 'Insulation resistance test'),
('Polarization Index', 'motor', 'Electrical Test', 'Polarization Index measurement'),
('DC Hi-Pot Test', 'motor', 'Electrical Test', 'DC High Potential test'),
('AC Hi-Pot Test', 'motor', 'Electrical Test', 'AC High Potential test'),
('Surge Test', 'motor', 'Electrical Test', 'Surge comparison test'),
('Partial Discharge', 'motor', 'Insulation Test', 'Partial discharge measurement'),
('Tan Delta', 'motor', 'Insulation Test', 'Dissipation factor test'),
('Capacitance Test', 'motor', 'Insulation Test', 'Capacitance measurement'),
('No Load Test', 'motor', 'Performance Test', 'No load performance test'),
('Locked Rotor Test', 'motor', 'Performance Test', 'Locked rotor test'),
('Load Test', 'motor', 'Performance Test', 'Load performance test'),
('Vibration Analysis', 'motor', 'Mechanical Test', 'Vibration measurement'),
('Bearing Temperature', 'motor', 'Thermal Test', 'Bearing temperature measurement'),
('Winding Temperature', 'motor', 'Thermal Test', 'Winding temperature measurement'),
('Shaft Alignment', 'motor', 'Mechanical Test', 'Shaft alignment check'),
('Air Gap Measurement', 'motor', 'Mechanical Test', 'Air gap measurement'),
('Rotor Balance', 'motor', 'Mechanical Test', 'Rotor balancing test'),
('Current Signature Analysis', 'motor', 'Diagnostic Test', 'Motor current signature analysis'),
('Thermography', 'motor', 'Thermal Test', 'Infrared thermography');

-- Verify counts
SELECT 'TRANSFORMER' as asset_type, COUNT(*) as test_count FROM test_types WHERE asset_type = 'transformer'
UNION ALL
SELECT 'GENERATOR', COUNT(*) FROM test_types WHERE asset_type = 'generator'
UNION ALL
SELECT 'MOTOR', COUNT(*) FROM test_types WHERE asset_type = 'motor';
