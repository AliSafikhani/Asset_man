-- First, get a plant ID (use the first plant in your database)
-- Insert 10 sample DCS signals (KKS codes) for testing

INSERT INTO dcs_signals (plant_id, kks_code, signal_name, unit, data_type, description) VALUES
(1, '10MBA01', 'Generator Active Power', 'MW', 'float', 'Generator real power output'),
(1, '10MBA02', 'Generator Reactive Power', 'MVAR', 'float', 'Generator reactive power'),
(1, '10MBA03', 'Generator Terminal Voltage', 'kV', 'float', 'Generator voltage at terminals'),
(1, '10MBA04', 'Generator Stator Current', 'A', 'float', 'Generator stator winding current'),
(1, '10MBA05', 'Generator Frequency', 'Hz', 'float', 'Grid frequency'),
(1, '10MBA06', 'Generator Bearing Temperature', '?C', 'float', 'Drive end bearing temperature'),
(1, '10MBA07', 'Generator Winding Temperature', '?C', 'float', 'Stator winding temperature'),
(1, '10MBA08', 'Generator Vibration', 'mm/s', 'float', 'Shaft vibration level'),
(1, '10MBA09', 'Transformer Load', 'MVA', 'float', 'Transformer apparent power load'),
(1, '10MBA10', 'Transformer Top Oil Temperature', '?C', 'float', 'Top oil temperature');

SELECT 'Sample DCS signals inserted' as status;
