-- ============================================================
-- MIGRATION: 048_create_oil_originality.sql
-- Description: History of oil-originality (اصالت روغن) analyses.
--              One row per submitted DSC/DTA sample, linked to a plant.
--              Stores the submitted sample curves, the combined verdict,
--              and the full engine output used by the detail page.
-- Date: 2026-08-11
-- ============================================================

DROP TABLE IF EXISTS oil_originality_records CASCADE;
CREATE TABLE oil_originality_records (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,

    -- Per-plant running number shown in the list.
    record_number INTEGER NOT NULL,

    -- User-supplied metadata.
    custom_name VARCHAR(255) NOT NULL,
    sample_date TIMESTAMP,

    -- Combined verdict.
    final_status VARCHAR(20),
    total_score INTEGER,

    -- Per-method verdicts + delta metrics.
    dsc_status VARCHAR(20),
    dta_status VARCHAR(20),
    dsc_details JSONB DEFAULT '{}'::jsonb,
    dta_details JSONB DEFAULT '{}'::jsonb,

    -- Raw submitted sample curves and full engine output.
    input_data JSONB DEFAULT '{}'::jsonb,
    result_data JSONB DEFAULT '{}'::jsonb,

    notes TEXT,
    created_by INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oil_originality_plant ON oil_originality_records(plant_id);
CREATE UNIQUE INDEX uq_oil_originality_plant_number
    ON oil_originality_records(plant_id, record_number);
