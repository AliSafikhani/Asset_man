-- Migration: Add DCS Signal Mapping, Alarm Rules, and Maintenance Events tables

-- Table: dcs_signal_mappings
CREATE TABLE IF NOT EXISTS dcs_signal_mappings (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    signal_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    unit VARCHAR(50),
    table_name VARCHAR(200) NOT NULL,
    column_name VARCHAR(200) NOT NULL,
    data_type VARCHAR(50) DEFAULT 'float',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: alarm_rules_enhanced
CREATE TABLE IF NOT EXISTS alarm_rules_enhanced (
    id SERIAL PRIMARY KEY,
    signal_mapping_id INTEGER NOT NULL REFERENCES dcs_signal_mappings(id) ON DELETE CASCADE,
    alarm_level INTEGER NOT NULL CHECK (alarm_level BETWEEN 1 AND 5),
    condition_type VARCHAR(20) CHECK (condition_type IN ('above', 'below', 'between', 'rate_of_change')),
    threshold_min DECIMAL(15,4),
    threshold_max DECIMAL(15,4),
    severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'warning', 'advisory', 'info')),
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: maintenance_events
CREATE TABLE IF NOT EXISTS maintenance_events (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    actions_taken TEXT,
    recommendations TEXT,
    cost DECIMAL(12,2),
    downtime_hours DECIMAL(8,2),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: event_attachments
CREATE TABLE IF NOT EXISTS event_attachments (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES maintenance_events(id) ON DELETE CASCADE,
    file_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_dcs_signal_asset ON dcs_signal_mappings(asset_id);
CREATE INDEX idx_alarm_signal ON alarm_rules_enhanced(signal_mapping_id);
CREATE INDEX idx_event_asset ON maintenance_events(asset_id);
CREATE INDEX idx_event_date ON maintenance_events(event_date);

-- Comments
COMMENT ON TABLE dcs_signal_mappings IS 'Maps DCS table/column signals to assets';
COMMENT ON TABLE alarm_rules_enhanced IS '5-level alarm configuration per DCS signal';
COMMENT ON TABLE maintenance_events IS 'Maintenance and event reports for assets';

-- Verification
SELECT 'dcs_signal_mappings' as table_name, COUNT(*) as row_count FROM dcs_signal_mappings
UNION ALL
SELECT 'alarm_rules_enhanced', COUNT(*) FROM alarm_rules_enhanced
UNION ALL
SELECT 'maintenance_events', COUNT(*) FROM maintenance_events;
