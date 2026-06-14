-- STEP 3: Generator-Specific Table
-- Supports all generator types: Diesel, Gas Turbine, Steam Turbine, Hydro, Wind, Solar

DROP TABLE IF EXISTS generators CASCADE;
CREATE TABLE generators (
    asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    
    -- =====================================================
    -- BASIC GENERATOR SPECIFICATIONS
    -- =====================================================
    generator_type VARCHAR(50) CHECK (generator_type IN ('synchronous', 'induction', 'permanent_magnet', 'others')),
    prime_mover_type VARCHAR(50) CHECK (prime_mover_type IN ('diesel', 'gas_turbine', 'steam_turbine', 'hydro_turbine', 'wind_turbine', 'gas_engine', 'others')),
    fuel_type VARCHAR(50),
    
    -- Power Ratings
    power_rating_mw DECIMAL(10,3),
    power_rating_mva DECIMAL(10,3),
    power_factor DECIMAL(4,3),
    efficiency_percent DECIMAL(5,2),
    
    -- =====================================================
    -- ELECTRICAL PARAMETERS
    -- =====================================================
    voltage_kv DECIMAL(10,2),
    current_a DECIMAL(10,2),
    frequency_hz DECIMAL(5,2),
    number_of_phases INTEGER DEFAULT 3,
    stator_connection VARCHAR(20) CHECK (stator_connection IN ('star', 'delta')),
    rotor_connection VARCHAR(20) CHECK (rotor_connection IN ('star', 'delta')),
    
    -- =====================================================
    -- SYNCHRONOUS GENERATOR SPECIFIC (Grid-connected)
    -- =====================================================
    synchronous_reactance_xd DECIMAL(10,4),
    transient_reactance_xd DECIMAL(10,4),
    subtransient_reactance_xd DECIMAL(10,4),
    negative_sequence_reactance_x2 DECIMAL(10,4),
    zero_sequence_reactance_x0 DECIMAL(10,4),
    time_constant_tdo DECIMAL(10,2),
    inertia_constant_h DECIMAL(10,2),
    short_circuit_ratio DECIMAL(5,3),
    
    -- =====================================================
    -- INDUCTION GENERATOR SPECIFIC (Wind, Small Hydro)
    -- =====================================================
    rotor_resistance_r2 DECIMAL(10,4),
    stator_resistance_r1 DECIMAL(10,4),
    magnetizing_reactance_xm DECIMAL(10,4),
    slip_at_rated_load DECIMAL(6,4),
    
    -- =====================================================
    -- PHYSICAL CHARACTERISTICS
    -- =====================================================
    cooling_method VARCHAR(50) CHECK (cooling_method IN ('air', 'hydrogen', 'water', 'oil')),
    insulation_class VARCHAR(20),
    enclosure_type VARCHAR(50),
    mounting_type VARCHAR(50) CHECK (mounting_type IN ('horizontal', 'vertical')),
    bearing_type VARCHAR(50),
    number_of_poles INTEGER,
    rotor_speed_rpm INTEGER,
    weight_kg DECIMAL(10,2),
    dimensions VARCHAR(200),
    
    -- =====================================================
    -- OPERATIONAL LIMITS
    -- =====================================================
    max_continuous_power_mw DECIMAL(10,3),
    max_overload_power_mw DECIMAL(10,3),
    max_overload_duration_seconds INTEGER,
    min_load_percent DECIMAL(5,2),
    ramp_up_rate_mw_per_min DECIMAL(8,2),
    ramp_down_rate_mw_per_min DECIMAL(8,2),
    
    -- =====================================================
    -- ENVIRONMENTAL & COMPLIANCE
    -- =====================================================
    noise_level_db DECIMAL(5,2),
    emissions_co2_kg_per_mwh DECIMAL(10,2),
    emissions_nox_ppm DECIMAL(8,2),
    emissions_sox_ppm DECIMAL(8,2),
    emissions_particulate_mg_per_nm3 DECIMAL(8,2),
    
    -- =====================================================
    -- EFFICIENCY CURVES (JSON storage)
    -- =====================================================
    efficiency_curve JSONB,
    heat_rate_curve JSONB,
    
    -- =====================================================
    -- AUDIT FIELDS
    -- =====================================================
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_generators_asset_id ON generators(asset_id);
CREATE INDEX idx_generators_type ON generators(generator_type);
CREATE INDEX idx_generators_prime_mover ON generators(prime_mover_type);
CREATE INDEX idx_generators_power_rating ON generators(power_rating_mw);
CREATE INDEX idx_generators_fuel_type ON generators(fuel_type);
CREATE INDEX idx_generators_manufacturer ON generators(manufacturer);
CREATE INDEX idx_generators_status ON generators(operational_status);

-- Comments
COMMENT ON TABLE generators IS 'Generator-specific information for all generator types';
COMMENT ON COLUMN generators.generator_type IS 'Type of generator: synchronous, induction, permanent_magnet';
COMMENT ON COLUMN generators.prime_mover_type IS 'Prime mover: diesel, gas_turbine, steam_turbine, hydro_turbine, wind_turbine';
COMMENT ON COLUMN generators.power_rating_mw IS 'Rated power in Megawatts';
COMMENT ON COLUMN generators.synchronous_reactance_xd IS 'Direct axis synchronous reactance (per unit)';

-- Verification
SELECT 'generators' as table_name, COUNT(*) as row_count FROM generators;