# 01_hypertable.sql created
-- TimescaleDB Schema for Time-Series Data (1 kHz real-time data)
-- This handles the high-frequency real-time data from sensors

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- =====================================================
-- REALTIME DATA HYPERTABLE (for 1 kHz data)
-- =====================================================

-- Create the realtime_data table
CREATE TABLE IF NOT EXISTS realtime_data (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    stream_id VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    value_vector DOUBLE PRECISION[], -- For multi-dimensional data (x,y,z)
    quality FLOAT DEFAULT 1.0, -- Data quality indicator (0-1)
    metadata JSONB DEFAULT '{}',
    user_id INTEGER, -- Optional user ID if data is user-specific
    tags TEXT[] DEFAULT '{}'
);

-- Convert to hypertable with 1-day chunk interval
SELECT create_hypertable(
    'realtime_data', 
    'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create indexes for efficient querying
CREATE INDEX idx_realtime_stream_time ON realtime_data (stream_id, time DESC);
CREATE INDEX idx_realtime_time_desc ON realtime_data (time DESC);
CREATE INDEX idx_realtime_metadata ON realtime_data USING GIN(metadata);
CREATE INDEX idx_realtime_tags ON realtime_data USING GIN(tags);

-- =====================================================
-- CONTINUOUS AGGREGATES (for downsampling)
-- =====================================================

-- 1-second aggregate (downsampled from 1 kHz to 1 Hz)
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_data_1s
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket(INTERVAL '1 second', time) AS bucket,
    stream_id,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    STDDEV(value) AS stddev_value,
    AVG(quality) AS avg_quality,
    COUNT(*) AS sample_count
FROM realtime_data
GROUP BY bucket, stream_id
WITH NO DATA;

-- Add refresh policy for 1-second aggregate (refresh every minute)
SELECT add_continuous_aggregate_policy('realtime_data_1s',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute'
);

-- 1-minute aggregate (for longer-term trends)
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_data_1m
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket(INTERVAL '1 minute', time) AS bucket,
    stream_id,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    STDDEV(value) AS stddev_value,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY value) AS p99_value,
    AVG(quality) AS avg_quality,
    COUNT(*) AS sample_count
FROM realtime_data
GROUP BY bucket, stream_id
WITH NO DATA;

-- Add refresh policy for 1-minute aggregate (refresh every 5 minutes)
SELECT add_continuous_aggregate_policy('realtime_data_1m',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes'
);

-- 1-hour aggregate (for historical analysis)
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_data_1h
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket(INTERVAL '1 hour', time) AS bucket,
    stream_id,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    STDDEV(value) AS stddev_value,
    AVG(quality) AS avg_quality,
    COUNT(*) AS sample_count
FROM realtime_data
GROUP BY bucket, stream_id
WITH NO DATA;

-- Add refresh policy for 1-hour aggregate (refresh every hour)
SELECT add_continuous_aggregate_policy('realtime_data_1h',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

-- =====================================================
-- COMPRESSION POLICIES (for data older than 7 days)
-- =====================================================

-- Enable compression on the hypertable
ALTER TABLE realtime_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'stream_id',
    timescaledb.compress_orderby = 'time DESC'
);

-- Add compression policy (compress data older than 7 days)
SELECT add_compression_policy('realtime_data', INTERVAL '7 days');

-- =====================================================
-- DATA RETENTION POLICY (delete data older than 90 days)
-- =====================================================
SELECT add_retention_policy('realtime_data', INTERVAL '90 days');

-- =====================================================
-- FUNCTIONS FOR REAL-TIME DATA QUERIES
-- =====================================================

-- Function to get latest value for a stream
CREATE OR REPLACE FUNCTION get_latest_value(p_stream_id VARCHAR)
RETURNS TABLE(
    latest_time TIMESTAMP WITH TIME ZONE,
    latest_value DOUBLE PRECISION,
    quality FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT time, value, quality
    FROM realtime_data
    WHERE stream_id = p_stream_id
    ORDER BY time DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get time-weighted average
CREATE OR REPLACE FUNCTION get_time_weighted_average(
    p_stream_id VARCHAR,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    result DOUBLE PRECISION;
BEGIN
    SELECT AVG(value) INTO result
    FROM (
        SELECT 
            time,
            value,
            LEAD(time) OVER (ORDER BY time) AS next_time
        FROM realtime_data
        WHERE stream_id = p_stream_id
            AND time BETWEEN p_start_time AND p_end_time
    ) AS t
    WHERE next_time IS NOT NULL;
    
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to detect anomalies (values outside 3 standard deviations)
CREATE OR REPLACE FUNCTION detect_anomalies(
    p_stream_id VARCHAR,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_threshold FLOAT DEFAULT 3.0
)
RETURNS TABLE(
    anomaly_time TIMESTAMP WITH TIME ZONE,
    anomaly_value DOUBLE PRECISION,
    z_score FLOAT
) AS $$
DECLARE
    mean_val DOUBLE PRECISION;
    stddev_val DOUBLE PRECISION;
BEGIN
    -- Calculate mean and standard deviation
    SELECT AVG(value), STDDEV(value) INTO mean_val, stddev_val
    FROM realtime_data
    WHERE stream_id = p_stream_id
        AND time BETWEEN p_start_time AND p_end_time;
    
    -- Return anomalies
    RETURN QUERY
    SELECT 
        time,
        value,
        ABS((value - mean_val) / NULLIF(stddev_val, 0)) AS z_score
    FROM realtime_data
    WHERE stream_id = p_stream_id
        AND time BETWEEN p_start_time AND p_end_time
        AND ABS(value - mean_val) > p_threshold * stddev_val
    ORDER BY time DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STREAM CONFIGURATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stream_config (
    stream_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency_hz INTEGER NOT NULL DEFAULT 1000,
    data_type VARCHAR(20) DEFAULT 'float',
    unit VARCHAR(50),
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    alarm_threshold_high DOUBLE PRECISION,
    alarm_threshold_low DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default stream configurations
INSERT INTO stream_config (stream_id, name, description, frequency_hz, data_type, unit, min_value, max_value, alarm_threshold_high, alarm_threshold_low)
VALUES 
    ('sensor_1', 'Temperature Sensor 1', 'Main temperature sensor', 1000, 'float', '°C', -10, 100, 90, 0),
    ('sensor_2', 'Pressure Sensor', 'Hydraulic pressure sensor', 1000, 'float', 'kPa', 80, 120, 115, 85),
    ('vibration', 'Vibration Monitor', '3-axis vibration sensor', 1000, 'vector', 'mm/s', 0, 50, 40, NULL),
    ('current', 'Current Sensor', 'Motor current sensor', 1000, 'float', 'A', 0, 100, 80, 10)
ON CONFLICT (stream_id) DO NOT UPDATE;

-- =====================================================
-- ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS realtime_alerts (
    id SERIAL PRIMARY KEY,
    stream_id VARCHAR(100) REFERENCES stream_config(stream_id),
    alert_type VARCHAR(50) NOT NULL, -- 'high', 'low', 'anomaly'
    alert_value DOUBLE PRECISION NOT NULL,
    threshold_value DOUBLE PRECISION,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_alerts_stream_id ON realtime_alerts(stream_id);
CREATE INDEX idx_alerts_triggered_at ON realtime_alerts(triggered_at);
CREATE INDEX idx_alerts_resolved ON realtime_alerts(resolved_at);

-- =====================================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to analyze chunk statistics
CREATE OR REPLACE FUNCTION get_chunk_stats()
RETURNS TABLE(
    chunk_name TEXT,
    num_rows BIGINT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    size_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        chunk_schema || '.' || chunk_name AS chunk_name,
        num_rows,
        range_start::TIMESTAMP WITH TIME ZONE AS start_time,
        range_end::TIMESTAMP WITH TIME ZONE AS end_time,
        pg_total_relation_size(format('%I.%I', chunk_schema, chunk_name)) AS size_bytes
    FROM timescaledb_information.chunks
    WHERE hypertable_name = 'realtime_data'
    ORDER BY range_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to recommend chunk interval based on data rate
CREATE OR REPLACE FUNCTION recommend_chunk_interval()
RETURNS INTERVAL AS $$
DECLARE
    daily_inserts BIGINT;
    recommended INTERVAL;
BEGIN
    -- Calculate average daily inserts
    SELECT COUNT(*) / 30 INTO daily_inserts
    FROM realtime_data
    WHERE time > NOW() - INTERVAL '30 days';
    
    -- Recommend chunk size (aim for ~10 million rows per chunk)
    IF daily_inserts < 100000 THEN
        recommended := INTERVAL '7 days';
    ELSIF daily_inserts < 1000000 THEN
        recommended := INTERVAL '1 day';
    ELSE
        recommended := INTERVAL '12 hours';
    END IF;
    
    RETURN recommended;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR DASHBOARDS
-- =====================================================

-- View for real-time dashboard (last 5 minutes of data)
CREATE OR REPLACE VIEW realtime_dashboard AS
SELECT 
    stream_id,
    time,
    value,
    quality,
    CASE 
        WHEN sc.alarm_threshold_high IS NOT NULL AND value > sc.alarm_threshold_high THEN 'critical'
        WHEN sc.alarm_threshold_low IS NOT NULL AND value < sc.alarm_threshold_low THEN 'critical'
        WHEN quality < 0.8 THEN 'warning'
        ELSE 'normal'
    END AS status
FROM realtime_data rd
LEFT JOIN stream_config sc USING (stream_id)
WHERE time > NOW() - INTERVAL '5 minutes'
ORDER BY stream_id, time DESC;

-- View for stream health statistics
CREATE OR REPLACE VIEW stream_health AS
SELECT 
    stream_id,
    COUNT(*) AS total_points_last_hour,
    AVG(quality) AS avg_quality,
    MIN(time) AS oldest_data,
    MAX(time) AS newest_data,
    EXTRACT(EPOCH FROM (NOW() - MAX(time))) AS seconds_since_last_update
FROM realtime_data
WHERE time > NOW() - INTERVAL '1 hour'
GROUP BY stream_id;

COMMENT ON TABLE realtime_data IS 'Time-series table for 1 kHz real-time sensor data';
COMMENT ON VIEW realtime_data_1s IS '1-second aggregates for downsampled real-time data';
COMMENT ON VIEW realtime_data_1m IS '1-minute aggregates for trending';
COMMENT ON VIEW realtime_data_1h IS '1-hour aggregates for historical analysis';