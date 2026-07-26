-- backend\database\migrations\043_create_maintenance_activities_table.sql
-- STEP 1: Maintenance Activities Table (Unified for Generators, Motors, and Transformers)
-- Supports polymorphic asset types via extra_data JSONB field

DROP TABLE IF EXISTS maintenance_activities CASCADE;
CREATE TABLE maintenance_activities (
    id SERIAL PRIMARY KEY,

    -- Hierarchy (Denormalized for fast filtering; sourced automatically from the selected asset)
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

    -- Activity Core Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    maintenance_order VARCHAR(50) NOT NULL CHECK (maintenance_order IN ('minor', 'major', 'emergency', 'overhaul')),
    maintenance_section VARCHAR(100) NOT NULL, -- Contextual: 'Oil'/'Winding' for Transformer; 'Engine'/'Alternator' for Generator; 'Bearings'/'Stator' for Motor
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    -- Workflow Status
    status VARCHAR(30) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'scheduled', 'in_progress', 'completed', 'canceled', 'on_hold')),

    -- Scheduling & Execution Timeline
    scheduled_date TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,

    -- Human Resources
    assigned_technician INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Operational Metrics
    meter_reading DECIMAL(12, 2), -- Runtime hours / cycles at the time of maintenance
    downtime_minutes INTEGER DEFAULT 0, -- Auto-calculated from actual_start and completion_date

    -- Financials
    labor_cost DECIMAL(10, 2) DEFAULT 0.00,
    parts_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED, -- Auto-calculated by DB

    -- Findings & Documentation
    findings_description TEXT,
    action_taken TEXT,
    attachments JSONB DEFAULT '[]', -- Stores array of file paths or S3 object URLs
    recommended_next_date TIMESTAMP WITH TIME ZONE,

    -- Asset-Specific Dynamic Data (The "Customization" layer)
    -- For Generator: {"oil_pressure_psi": 45, "coolant_temp_c": 82, "fuel_level_pct": 75}
    -- For Motor: {"winding_resistance_ohms": 2.4, "vibration_mm_s": 1.1, "amp_draw_l1": 15.2}
    -- For Transformer: {"oil_temp_c": 75, "dissolved_gas_h2_ppm": 3, "moisture_content_ppm": 12}
    extra_data JSONB DEFAULT '{}',

    -- Audit Trail
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes (Optimized for your filters)
CREATE INDEX idx_maintenance_activities_plant_id ON maintenance_activities(plant_id);
CREATE INDEX idx_maintenance_activities_asset_id ON maintenance_activities(asset_id);
CREATE INDEX idx_maintenance_activities_status ON maintenance_activities(status);
CREATE INDEX idx_maintenance_activities_scheduled_date ON maintenance_activities(scheduled_date);
CREATE INDEX idx_maintenance_activities_priority ON maintenance_activities(priority);
CREATE INDEX idx_maintenance_activities_maintenance_order ON maintenance_activities(maintenance_order);
CREATE INDEX idx_maintenance_activities_assigned_technician ON maintenance_activities(assigned_technician);

-- JSONB Indexes for fast querying of dynamic fields
CREATE INDEX idx_maintenance_activities_extra_data ON maintenance_activities USING GIN(extra_data);
CREATE INDEX idx_maintenance_activities_attachments ON maintenance_activities USING GIN(attachments);

-- Table & Column Comments
COMMENT ON TABLE maintenance_activities IS 'Unified maintenance history for Generators, Motors, and Transformers';
COMMENT ON COLUMN maintenance_activities.plant_id IS 'Denormalized plant ID for rapid plant-level dashboards without JOINs';
COMMENT ON COLUMN maintenance_activities.maintenance_section IS 'Specific subsystem: Oil/Winding/OLTC for Transformers; Engine/Alternator for Generators; Bearings/Stator for Motors';
COMMENT ON COLUMN maintenance_activities.downtime_minutes IS 'Calculated automatically by the backend from actual_start and completion_date';
COMMENT ON COLUMN maintenance_activities.total_cost IS 'Auto-generated DB column: labor_cost + parts_cost';
COMMENT ON COLUMN maintenance_activities.extra_data IS 'JSON bag for asset-type-specific readings and parameters';

-- Verification Query
SELECT 'maintenance_activities' as table_name, COUNT(*) as row_count FROM maintenance_activities;