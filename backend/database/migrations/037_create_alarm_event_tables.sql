-- =====================================================
-- ALARM MANAGEMENT TABLES
-- =====================================================

-- Alarm Rules Table
CREATE TABLE IF NOT EXISTS alarm_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    signal_mapping_id INTEGER REFERENCES dcs_signal_mappings(id) ON DELETE CASCADE,
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('high', 'low', 'range', 'rate_of_change')),
    threshold_min DECIMAL(15,4),
    threshold_max DECIMAL(15,4),
    unit VARCHAR(50),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'warning', 'info')),
    delay_seconds INTEGER DEFAULT 0,
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    notification_methods TEXT[] DEFAULT '{"dashboard"}',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alarm History Table
CREATE TABLE IF NOT EXISTS alarm_history (
    id SERIAL PRIMARY KEY,
    alarm_rule_id INTEGER REFERENCES alarm_rules(id),
    asset_id INTEGER REFERENCES assets(id),
    signal_mapping_id INTEGER REFERENCES dcs_signal_mappings(id),
    actual_value DECIMAL(15,4),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    notes TEXT
);

-- Indexes
CREATE INDEX idx_alarm_rules_asset ON alarm_rules(asset_id);
CREATE INDEX idx_alarm_rules_signal ON alarm_rules(signal_mapping_id);
CREATE INDEX idx_alarm_rules_active ON alarm_rules(is_active);
CREATE INDEX idx_alarm_history_asset ON alarm_history(asset_id);
CREATE INDEX idx_alarm_history_triggered ON alarm_history(triggered_at);
CREATE INDEX idx_alarm_history_status ON alarm_history(status);

-- =====================================================
-- EVENT MANAGEMENT TABLES
-- =====================================================

-- Events / Work Orders Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('maintenance', 'failure', 'inspection', 'test', 'repair', 'replacement')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    reported_date DATE NOT NULL,
    reported_by INTEGER REFERENCES users(id),
    description TEXT,
    assigned_to INTEGER REFERENCES users(id),
    due_date DATE,
    completed_date DATE,
    actions_taken TEXT,
    cost DECIMAL(12,2),
    downtime_hours DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Checklist Items
CREATE TABLE IF NOT EXISTS event_checklist (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    task_name VARCHAR(500) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Event Parts/Resources Used
CREATE TABLE IF NOT EXISTS event_parts (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    part_name VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2)
);

-- Event Comments/Updates
CREATE TABLE IF NOT EXISTS event_comments (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_events_asset ON events(asset_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_priority ON events(priority);
CREATE INDEX idx_events_reported_date ON events(reported_date);
CREATE INDEX idx_events_due_date ON events(due_date);
CREATE INDEX idx_event_checklist_event ON event_checklist(event_id);
CREATE INDEX idx_event_parts_event ON event_parts(event_id);
CREATE INDEX idx_event_comments_event ON event_comments(event_id);

-- Comments
COMMENT ON TABLE alarm_rules IS 'Configuration rules for generating alarms from DCS signals';
COMMENT ON TABLE alarm_history IS 'Historical record of triggered alarms';
COMMENT ON TABLE events IS 'Work orders and maintenance events';
COMMENT ON TABLE event_checklist IS 'Checklist items for each event';
COMMENT ON TABLE event_parts IS 'Parts and materials used in events';
COMMENT ON TABLE event_comments IS 'Comments and updates on events';

SELECT 'Alarm and Event tables created successfully' as status;
