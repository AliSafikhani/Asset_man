-- ============================================================
-- MIGRATION: 047_create_rul_signal_config.sql
-- Description: Per-asset mapping of the 3 DCS signals the RUL
--              (thermal life, IEC 60076-7) algorithm consumes.
--              Signal ids are logical references to
--              dcs_db.dcs_signal_characteristic.id (separate DB).
-- Date: 2026-08-03
-- ============================================================

DROP TABLE IF EXISTS rul_signal_config CASCADE;
CREATE TABLE rul_signal_config (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

    -- Logical references to dcs_db.dcs_signal_characteristic.id
    top_oil_signal_id INTEGER,
    ambient_signal_id INTEGER,
    current_signal_id INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(asset_id)
);

CREATE INDEX idx_rul_signal_config_asset ON rul_signal_config(asset_id);
