-- ============================================================
-- MIGRATION: 002_add_signal_monitoring.sql
-- Description: Add tables for live monitoring module
-- Date: 2026-07-29
-- ============================================================

-- ============================================================
-- 1. SIGNAL GROUPS (User-defined groups per plant)
-- ============================================================
DROP TABLE IF EXISTS signal_groups CASCADE;
CREATE TABLE signal_groups (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    group_name VARCHAR(50) NOT NULL,
    description TEXT,
    color_hex VARCHAR(7) DEFAULT '#808080',
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plant_id, group_name)
);

CREATE INDEX idx_signal_groups_plant ON signal_groups(plant_id);


-- ============================================================
-- 2. SIGNAL CONFIGURATION (Per-signal settings for a plant)
-- ============================================================
DROP TABLE IF EXISTS signal_configuration CASCADE;
CREATE TABLE signal_configuration (
    id SERIAL PRIMARY KEY,
    signal_id INTEGER NOT NULL,                    -- Logical reference to dcs_db.signal.id
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    
    -- Assignment
    asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
    group_id INTEGER REFERENCES signal_groups(id) ON DELETE SET NULL,
    
    -- Display settings
    custom_name VARCHAR(100),
    custom_unit VARCHAR(20),
    color_hex VARCHAR(7) DEFAULT '#2196F3',
    line_type VARCHAR(20) DEFAULT 'solid',         -- solid, dashed, dotted, dashdot
    line_width INTEGER DEFAULT 2,
    scale_factor DECIMAL(5,2) DEFAULT 1.00,
    y_axis_side VARCHAR(10) DEFAULT 'left',        -- left, right
    
    -- Alarm settings
    alert_threshold_min DECIMAL(15,4),
    alert_threshold_max DECIMAL(15,4),
    is_threshold_enabled BOOLEAN DEFAULT FALSE,
    
    -- Visibility
    is_visible BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(signal_id, plant_id)
);

CREATE INDEX idx_signal_config_signal ON signal_configuration(signal_id);
CREATE INDEX idx_signal_config_plant ON signal_configuration(plant_id);
CREATE INDEX idx_signal_config_asset ON signal_configuration(asset_id);
CREATE INDEX idx_signal_config_group ON signal_configuration(group_id);


-- ============================================================
-- 3. SIGNAL VISUALIZATION SETTINGS (Per-user, per-signal)
-- ============================================================
DROP TABLE IF EXISTS signal_visualization_settings CASCADE;
CREATE TABLE signal_visualization_settings (
    id SERIAL PRIMARY KEY,
    signal_config_id INTEGER NOT NULL REFERENCES signal_configuration(id) ON DELETE CASCADE,
    user_id INTEGER,
    
    -- Chart-specific settings
    is_hidden BOOLEAN DEFAULT FALSE,
    custom_color_hex VARCHAR(7),
    custom_line_type VARCHAR(20),
    custom_line_width INTEGER,
    custom_scale_factor DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(signal_config_id, user_id)
);

CREATE INDEX idx_signal_vis_config ON signal_visualization_settings(signal_config_id);
CREATE INDEX idx_signal_vis_user ON signal_visualization_settings(user_id);


-- ============================================================
-- 4. ALARM HISTORY (For monitoring alerts)
-- ============================================================
DROP TABLE IF EXISTS signal_alarm_history CASCADE;
CREATE TABLE signal_alarm_history (
    id SERIAL PRIMARY KEY,
    signal_config_id INTEGER NOT NULL REFERENCES signal_configuration(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
    
    alarm_type VARCHAR(20) NOT NULL,               -- 'MIN', 'MAX', 'RATE'
    triggered_value DECIMAL(15,4) NOT NULL,
    threshold_value DECIMAL(15,4) NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning',        -- 'info', 'warning', 'critical'
    
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by INTEGER,
    cleared_at TIMESTAMP WITH TIME ZONE,
    is_cleared BOOLEAN DEFAULT FALSE,
    
    notes TEXT
);

CREATE INDEX idx_alarm_history_config ON signal_alarm_history(signal_config_id);
CREATE INDEX idx_alarm_history_asset ON signal_alarm_history(asset_id);
CREATE INDEX idx_alarm_history_triggered ON signal_alarm_history(triggered_at);
CREATE INDEX idx_alarm_history_cleared ON signal_alarm_history(cleared_at);


-- ============================================================
-- 5. USER-DEFINED COMPARISON GROUPS
-- ============================================================
DROP TABLE IF EXISTS comparison_groups CASCADE;
CREATE TABLE comparison_groups (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_type VARCHAR(50),                        -- 'voltage', 'current', 'temperature', 'vibration'
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comparison_groups_plant ON comparison_groups(plant_id);


-- ============================================================
-- 6. COMPARISON GROUP ASSIGNMENTS
-- ============================================================
DROP TABLE IF EXISTS comparison_group_items CASCADE;
CREATE TABLE comparison_group_items (
    id SERIAL PRIMARY KEY,
    comparison_group_id INTEGER NOT NULL REFERENCES comparison_groups(id) ON DELETE CASCADE,
    signal_config_id INTEGER NOT NULL REFERENCES signal_configuration(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comparison_group_id, signal_config_id)
);

CREATE INDEX idx_comp_group_items_group ON comparison_group_items(comparison_group_id);
CREATE INDEX idx_comp_group_items_config ON comparison_group_items(signal_config_id);


-- ============================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_signal_monitoring_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signal_groups_updated_at BEFORE UPDATE ON signal_groups
    FOR EACH ROW EXECUTE FUNCTION update_signal_monitoring_updated_at();

CREATE TRIGGER update_signal_config_updated_at BEFORE UPDATE ON signal_configuration
    FOR EACH ROW EXECUTE FUNCTION update_signal_monitoring_updated_at();

CREATE TRIGGER update_signal_vis_settings_updated_at BEFORE UPDATE ON signal_visualization_settings
    FOR EACH ROW EXECUTE FUNCTION update_signal_monitoring_updated_at();

CREATE TRIGGER update_comparison_groups_updated_at BEFORE UPDATE ON comparison_groups
    FOR EACH ROW EXECUTE FUNCTION update_signal_monitoring_updated_at();


-- ============================================================
-- SEED DATA: Default Groups
-- ============================================================
-- These will be added per-plant dynamically via the API.
-- This is just placeholder seed data for reference.

INSERT INTO signal_groups (plant_id, group_name, description, color_hex, sort_order)
SELECT id, 'Voltage', 'Voltage measurements', '#FF5722', 1
FROM plants WHERE code = 'SPP001'
ON CONFLICT DO NOTHING;

INSERT INTO signal_groups (plant_id, group_name, description, color_hex, sort_order)
SELECT id, 'Current', 'Current measurements', '#2196F3', 2
FROM plants WHERE code = 'SPP001'
ON CONFLICT DO NOTHING;

INSERT INTO signal_groups (plant_id, group_name, description, color_hex, sort_order)
SELECT id, 'Temperature', 'Temperature measurements', '#FF9800', 3
FROM plants WHERE code = 'SPP001'
ON CONFLICT DO NOTHING;

INSERT INTO signal_groups (plant_id, group_name, description, color_hex, sort_order)
SELECT id, 'Vibration', 'Vibration measurements', '#4CAF50', 4
FROM plants WHERE code = 'SPP001'
ON CONFLICT DO NOTHING;


-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'signal_groups' AS table_name, COUNT(*) AS row_count FROM signal_groups
UNION ALL
SELECT 'signal_configuration', COUNT(*) FROM signal_configuration
UNION ALL
SELECT 'signal_visualization_settings', COUNT(*) FROM signal_visualization_settings
UNION ALL
SELECT 'signal_alarm_history', COUNT(*) FROM signal_alarm_history
UNION ALL
SELECT 'comparison_groups', COUNT(*) FROM comparison_groups
UNION ALL
SELECT 'comparison_group_items', COUNT(*) FROM comparison_group_items;