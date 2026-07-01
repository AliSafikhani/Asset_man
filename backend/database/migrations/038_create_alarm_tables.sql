-- Create alarm_rules table
CREATE TABLE IF NOT EXISTS alarm_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    signal_mapping_id INTEGER,
    condition_type VARCHAR(20) NOT NULL,
    threshold_min DECIMAL,
    threshold_max DECIMAL,
    unit VARCHAR(50),
    severity VARCHAR(20) NOT NULL,
    delay_seconds INTEGER DEFAULT 0,
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notification_methods TEXT[],
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create alarm_history table
CREATE TABLE IF NOT EXISTS alarm_history (
    id SERIAL PRIMARY KEY,
    alarm_rule_id INTEGER REFERENCES alarm_rules(id),
    asset_id INTEGER REFERENCES assets(id),
    signal_mapping_id INTEGER,
    actual_value DECIMAL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT
);

-- Create indexes
CREATE INDEX idx_alarm_rules_asset ON alarm_rules(asset_id);
CREATE INDEX idx_alarm_history_asset ON alarm_history(asset_id);
CREATE INDEX idx_alarm_history_status ON alarm_history(status);

SELECT 'Alarm tables created successfully' as status;
