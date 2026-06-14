-- Generate simulated 1 Hz data for the last 24 hours
-- This creates a sine wave pattern with random noise

DO $$
DECLARE
    signal_record RECORD;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    current_time TIMESTAMP;
    base_value DECIMAL;
    amplitude DECIMAL;
    noise DECIMAL;
    val DECIMAL;
BEGIN
    -- Set time range: last 24 hours
    start_time := NOW() - INTERVAL '24 hours';
    end_time := NOW();
    
    -- For each DCS signal
    FOR signal_record IN SELECT id, signal_name, unit FROM dcs_signals LOOP
        -- Define base value and amplitude based on signal type
        CASE signal_record.signal_name
            WHEN 'Generator Active Power' THEN base_value := 50; amplitude := 30;
            WHEN 'Generator Reactive Power' THEN base_value := 20; amplitude := 15;
            WHEN 'Generator Terminal Voltage' THEN base_value := 11; amplitude := 0.5;
            WHEN 'Generator Stator Current' THEN base_value := 3000; amplitude := 500;
            WHEN 'Generator Frequency' THEN base_value := 50; amplitude := 0.2;
            WHEN 'Generator Bearing Temperature' THEN base_value := 65; amplitude := 10;
            WHEN 'Generator Winding Temperature' THEN base_value := 85; amplitude := 15;
            WHEN 'Generator Vibration' THEN base_value := 2.5; amplitude := 1.5;
            WHEN 'Transformer Load' THEN base_value := 40; amplitude := 20;
            WHEN 'Transformer Top Oil Temperature' THEN base_value := 75; amplitude := 15;
            ELSE base_value := 50; amplitude := 25;
        END CASE;
        
        -- Generate data points at 1 Hz
        current_time := start_time;
        WHILE current_time <= end_time LOOP
            -- Calculate sine wave value with random noise
            -- Use timestamp to create wave pattern
            noise := (random() - 0.5) * amplitude * 0.1;
            val := base_value + amplitude * SIN(EXTRACT(EPOCH FROM current_time) / 3600 * 3.14159) + noise;
            
            -- Ensure value stays within reasonable range
            IF val < 0 THEN val := 0; END IF;
            
            -- Insert the data point
            INSERT INTO dcs_data (dcs_signal_id, timestamp, value, quality)
            VALUES (signal_record.id, current_time, val, 'GOOD');
            
            -- Increment by 1 second
            current_time := current_time + INTERVAL '1 second';
        END LOOP;
        
        RAISE NOTICE 'Generated data for signal: %', signal_record.signal_name;
    END LOOP;
    
    RAISE NOTICE 'Data generation complete!';
END $$;

SELECT 'Simulated DCS data generated' as status;
