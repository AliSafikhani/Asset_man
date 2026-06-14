-- STEP 2: Asset Base Table (Common fields for all asset types)
-- Supports: Generators, Transformers, and Motors

-- Asset base table (polymorphic inheritance)
DROP TABLE IF EXISTS assets CASCADE;
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    
    -- Hierarchy (which plant owns this asset)
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    
    -- Asset identification
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('generator', 'transformer', 'motor')),
    asset_name VARCHAR(200) NOT NULL,
    asset_code VARCHAR(100) UNIQUE NOT NULL,
    asset_tag VARCHAR(100),
    
    -- Manufacturer information
    manufacturer VARCHAR(200),
    model VARCHAR(200),
    serial_number VARCHAR(200),
    manufacturing_year INTEGER,
    installation_date DATE,
    commissioning_date DATE,
    
    -- Operational status
    operational_status VARCHAR(50) DEFAULT 'active' CHECK (operational_status IN ('active', 'standby', 'maintenance', 'failed', 'decommissioned')),
    asset_health_score DECIMAL(5,2), -- 0-100 score
    criticality_level VARCHAR(20) CHECK (criticality_level IN ('critical', 'high', 'medium', 'low')),
    
    -- Location information
    location_within_plant VARCHAR(200),
    gps_coordinates POINT,
    bay_number VARCHAR(50),
    substation_name VARCHAR(200),
    
    -- Technical documentation
    technical_documentation_url TEXT,
    photo_url TEXT,
    nameplate_data JSONB,
    
    -- Warranty and lifecycle
    warranty_start_date DATE,
    warranty_end_date DATE,
    expected_life_years INTEGER,
    remaining_life_years INTEGER,
    
    -- Metadata and audit
    metadata JSONB DEFAULT '{}',
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_assets_plant_id ON assets(plant_id);
CREATE INDEX idx_assets_asset_code ON assets(asset_code);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_assets_status ON assets(operational_status);
CREATE INDEX idx_assets_health_score ON assets(asset_health_score);
CREATE INDEX idx_assets_criticality ON assets(criticality_level);
CREATE INDEX idx_assets_manufacturer ON assets(manufacturer);
CREATE INDEX idx_assets_installation_date ON assets(installation_date);
CREATE INDEX idx_assets_gps ON assets USING GIST(gps_coordinates);
CREATE INDEX idx_assets_metadata ON assets USING GIN(metadata);

-- Comment on table and columns
COMMENT ON TABLE assets IS 'Base table for all assets (Generators, Transformers, Motors)';
COMMENT ON COLUMN assets.asset_type IS 'Type of asset: generator, transformer, or motor';
COMMENT ON COLUMN assets.asset_health_score IS 'Calculated health score from 0-100 based on tests and monitoring';
COMMENT ON COLUMN assets.criticality_level IS 'Asset criticality for maintenance prioritization';

-- Verification query
SELECT 'assets' as table_name, COUNT(*) as row_count FROM assets;