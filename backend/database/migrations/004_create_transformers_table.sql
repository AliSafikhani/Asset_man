-- STEP 4: Transformer-Specific Table
-- Supports all transformer types: Power, Distribution, Auto, Instrument

DROP TABLE IF EXISTS transformers CASCADE;
CREATE TABLE transformers (
    asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    
    -- =====================================================
    -- BASIC TRANSFORMER SPECIFICATIONS
    -- =====================================================
    transformer_type VARCHAR(50) CHECK (transformer_type IN ('power', 'distribution', 'auto', 'instrument', 'rectifier', 'furnace')),
    cooling_type VARCHAR(50) CHECK (cooling_type IN ('onan', 'onaf', 'ofaf', 'ofwf', 'odaf', 'dry_type', 'cast_resin')),
    winding_configuration VARCHAR(50) CHECK (winding_configuration IN ('core', 'shell')),
    number_of_windings INTEGER DEFAULT 2,
    
    -- =====================================================
    -- POWER RATINGS
    -- =====================================================
    power_rating_mva DECIMAL(10,3),
    power_rating_mva_forced DECIMAL(10,3),
    
    -- =====================================================
    -- VOLTAGE RATINGS
    -- =====================================================
    hv_voltage_kv DECIMAL(10,2),
    lv_voltage_kv DECIMAL(10,2),
    tertiary_voltage_kv DECIMAL(10,2),
    hv_tap_range_percent DECIMAL(5,2),
    hv_tap_step_percent DECIMAL(5,2),
    number_of_taps INTEGER,
    
    -- =====================================================
    -- IMPEDANCE & REACTANCE
    -- =====================================================
    impedance_percent DECIMAL(6,3),
    hv_resistance_ohms DECIMAL(10,4),
    lv_resistance_ohms DECIMAL(10,4),
    magnetizing_current_percent DECIMAL(6,4),
    zero_sequence_impedance_percent DECIMAL(6,4),
    
    -- =====================================================
    -- INSULATION & DIELECTRIC
    -- =====================================================
    insulation_type VARCHAR(50) CHECK (insulation_type IN ('oil', 'dry', 'gas_sf6', 'ester')),
    insulation_class VARCHAR(20),
    insulation_level_hv_kv DECIMAL(8,2),
    insulation_level_lv_kv DECIMAL(8,2),
    partial_discharge_limit_pc INTEGER,
    
    -- =====================================================
    -- PHYSICAL CHARACTERISTICS
    -- =====================================================
    vector_group VARCHAR(10),
    frequency_hz DECIMAL(5,2),
    oil_type VARCHAR(50),
    oil_volume_liters DECIMAL(10,2),
    weight_kg DECIMAL(10,2),
    oil_weight_kg DECIMAL(8,2),
    core_weight_kg DECIMAL(8,2),
    winding_weight_kg DECIMAL(8,2),
    dimensions VARCHAR(200),
    
    -- =====================================================
    -- OPERATIONAL PARAMETERS
    -- =====================================================
    no_load_loss_w DECIMAL(10,2),
    load_loss_w DECIMAL(10,2),
    efficiency_percent DECIMAL(5,2),
    temperature_rise_oil_c DECIMAL(5,2),
    temperature_rise_winding_c DECIMAL(5,2),
    
    -- =====================================================
    -- ACCESSORIES
    -- =====================================================
    has_on_load_tap_changer BOOLEAN DEFAULT FALSE,
    olTc_type VARCHAR(50),
    has_buchholz_relay BOOLEAN DEFAULT TRUE,
    has_pressure_relief BOOLEAN DEFAULT TRUE,
    has_silica_gel_breath BOOLEAN DEFAULT TRUE,
    has_oil_conservator BOOLEAN DEFAULT TRUE,
    has_thermometer_pockets BOOLEAN DEFAULT TRUE,
    has_lightning_arresters BOOLEAN DEFAULT TRUE,
    
    -- =====================================================
    -- AUDIT FIELDS
    -- =====================================================
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_transformers_asset_id ON transformers(asset_id);
CREATE INDEX idx_transformers_type ON transformers(transformer_type);
CREATE INDEX idx_transformers_cooling ON transformers(cooling_type);
CREATE INDEX idx_transformers_power_rating ON transformers(power_rating_mva);
CREATE INDEX idx_transformers_hv_voltage ON transformers(hv_voltage_kv);
CREATE INDEX idx_transformers_lv_voltage ON transformers(lv_voltage_kv);
CREATE INDEX idx_transformers_vector_group ON transformers(vector_group);

-- Comments
COMMENT ON TABLE transformers IS 'Transformer-specific information for all transformer types';
COMMENT ON COLUMN transformers.transformer_type IS 'Type: power, distribution, auto, instrument';
COMMENT ON COLUMN transformers.power_rating_mva IS 'Rated power in MVA';
COMMENT ON COLUMN transformers.impedance_percent IS 'Short circuit impedance percentage';
COMMENT ON COLUMN transformers.vector_group IS 'Vector group (e.g., Dyn11, YNd1, YNyn0)';

-- Verification
SELECT 'transformers' as table_name, COUNT(*) as row_count FROM transformers;