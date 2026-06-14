-- DCS Signal Master Table
CREATE TABLE IF NOT EXISTS dcs_signals (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER REFERENCES plants(id),
    kks_code VARCHAR(100) NOT NULL,
    signal_name VARCHAR(200),
    unit VARCHAR(50),
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'float',
    is_assigned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset-DCS Signal Mapping
CREATE TABLE IF NOT EXISTS asset_dcs_mappings (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id),
    dcs_signal_id INTEGER REFERENCES dcs_signals(id),
    display_name VARCHAR(200),
    unit VARCHAR(50),
    min_alarm DECIMAL,
    max_alarm DECIMAL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simulated DCS Data
CREATE TABLE IF NOT EXISTS dcs_data (
    id BIGSERIAL PRIMARY KEY,
    dcs_signal_id INTEGER REFERENCES dcs_signals(id),
    timestamp TIMESTAMP NOT NULL,
    value DECIMAL(15,4),
    quality VARCHAR(20) DEFAULT 'GOOD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_dcs_signals_plant ON dcs_signals(plant_id);
CREATE INDEX idx_dcs_signals_kks ON dcs_signals(kks_code);
CREATE INDEX idx_asset_dcs_asset ON asset_dcs_mappings(asset_id);
CREATE INDEX idx_asset_dcs_signal ON asset_dcs_mappings(dcs_signal_id);
CREATE INDEX idx_dcs_data_signal ON dcs_data(dcs_signal_id);
CREATE INDEX idx_dcs_data_timestamp ON dcs_data(timestamp);

-- Comments
COMMENT ON TABLE dcs_signals IS 'Master list of DCS signals available in a plant';
COMMENT ON TABLE asset_dcs_mappings IS 'Maps DCS signals to specific assets';
COMMENT ON TABLE dcs_data IS 'Simulated DCS time-series data at 1Hz frequency';

SELECT 'DCS tables created successfully' as status;
