-- STEP 5: Motor-Specific Table
-- Supports all motor types: Induction, Synchronous, DC

DROP TABLE IF EXISTS motors CASCADE;
CREATE TABLE motors (
    asset_id INTEGER PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    
    -- =====================================================
    -- BASIC MOTOR SPECIFICATIONS
    -- =====================================================
    motor_type VARCHAR(50) CHECK (motor_type IN ('induction', 'synchronous', 'dc', 'permanent_magnet', 'servo', 'stepper')),
    frame_size VARCHAR(50),
    mounting_type VARCHAR(50) CHECK (mounting_type IN ('foot', 'flange', 'vertical', 'horizontal', 'face')),
    duty_type VARCHAR(50) CHECK (duty_type IN ('s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9')),
    enclosure_type VARCHAR(50) CHECK (enclosure_type IN ('tefc', 'odp', 'wpii', 'explosion_proof', 'totally_enclosed', 'drip_proof')),
    
    -- =====================================================
    -- POWER RATINGS
    -- =====================================================
    power_hp DECIMAL(10,2),
    power_kw DECIMAL(10,2),
    service_factor DECIMAL(4,2),
    locked_rotor_kva_code VARCHAR(5),
    
    -- =====================================================
    -- ELECTRICAL PARAMETERS (Motor Side)
    -- =====================================================
    voltage_v DECIMAL(8,2),
    current_a DECIMAL(8,2),
    starting_current_a DECIMAL(8,2),
    frequency_hz DECIMAL(5,2),
    number_of_phases INTEGER DEFAULT 3,
    connection_type VARCHAR(20) CHECK (connection_type IN ('star', 'delta', 'part_winding')),
    
    -- =====================================================
    -- INDUCTION MOTOR SPECIFIC
    -- =====================================================
    synchronous_speed_rpm INTEGER,
    full_load_speed_rpm INTEGER,
    slip_percent DECIMAL(6,4),
    rotor_type VARCHAR(30) CHECK (rotor_type IN ('squirrel_cage', 'wound_rotor')),
    nema_design VARCHAR(10) CHECK (nema_design IN ('a', 'b', 'c', 'd')),
    locked_rotor_torque_percent DECIMAL(6,2),
    breakdown_torque_percent DECIMAL(6,2),
    pull_up_torque_percent DECIMAL(6,2),
    
    -- =====================================================
    -- SYNCHRONOUS MOTOR SPECIFIC
    -- =====================================================
    excitation_type VARCHAR(50) CHECK (excitation_type IN ('brushless', 'static', 'dc_exciter', 'permanent_magnet')),
    excitation_voltage_v DECIMAL(6,2),
    excitation_current_a DECIMAL(6,2),
    power_factor DECIMAL(4,3),
    starting_method VARCHAR(50) CHECK (starting_method IN ('amortisseur_winding', 'pony_motor', 'vfd', 'reduced_voltage')),
    
    -- =====================================================
    -- DC MOTOR SPECIFIC
    -- =====================================================
    field_type VARCHAR(30) CHECK (field_type IN ('shunt', 'series', 'compound', 'permanent_magnet')),
    armature_voltage_v DECIMAL(6,2),
    armature_current_a DECIMAL(6,2),
    field_voltage_v DECIMAL(6,2),
    field_current_a DECIMAL(6,2),
    base_speed_rpm INTEGER,
    max_speed_rpm INTEGER,
    
    -- =====================================================
    -- EFFICIENCY
    -- =====================================================
    efficiency_class VARCHAR(20) CHECK (efficiency_class IN ('ie1', 'ie2', 'ie3', 'ie4', 'ie5', 'premium', 'standard')),
    efficiency_100_percent DECIMAL(5,2),
    efficiency_75_percent DECIMAL(5,2),
    efficiency_50_percent DECIMAL(5,2),
    efficiency_25_percent DECIMAL(5,2),
    
    -- =====================================================
    -- PHYSICAL & MECHANICAL
    -- =====================================================
    bearing_type VARCHAR(30) CHECK (bearing_type IN ('ball', 'roller', 'sleeve', 'magnetic')),
    bearing_front_type VARCHAR(30),
    bearing_rear_type VARCHAR(30),
    shaft_diameter_mm DECIMAL(6,2),
    shaft_height_mm DECIMAL(6,2),
    weight_kg DECIMAL(10,2),
    dimensions VARCHAR(200),
    inertia_kg_m2 DECIMAL(10,4),
    
    -- =====================================================
    -- ENVIRONMENTAL
    -- =====================================================
    insulation_class VARCHAR(10) CHECK (insulation_class IN ('a', 'b', 'f', 'h')),
    insulation_system VARCHAR(50),
    temperature_rise_c DECIMAL(5,2),
    ambient_temperature_c DECIMAL(5,2),
    altitude_m INTEGER,
    ip_rating VARCHAR(10),
    
    -- =====================================================
    -- VFD COMPATIBILITY
    -- =====================================================
    vfd_compatible BOOLEAN DEFAULT FALSE,
    vfd_friendly_insulation BOOLEAN DEFAULT FALSE,
    min_frequency_hz DECIMAL(5,2),
    max_frequency_hz DECIMAL(5,2),
    
    -- =====================================================
    -- AUDIT FIELDS
    -- =====================================================
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_motors_asset_id ON motors(asset_id);
CREATE INDEX idx_motors_type ON motors(motor_type);
CREATE INDEX idx_motors_power_hp ON motors(power_hp);
CREATE INDEX idx_motors_speed ON motors(synchronous_speed_rpm);
CREATE INDEX idx_motors_efficiency_class ON motors(efficiency_class);
CREATE INDEX idx_motors_frame_size ON motors(frame_size);

-- Comments
COMMENT ON TABLE motors IS 'Motor-specific information for all motor types';
COMMENT ON COLUMN motors.motor_type IS 'Type: induction, synchronous, dc';
COMMENT ON COLUMN motors.power_hp IS 'Rated power in Horsepower';
COMMENT ON COLUMN motors.efficiency_class IS 'IE efficiency class (IE1 to IE5)';
COMMENT ON COLUMN motors.nema_design IS 'NEMA design letter (A, B, C, D)';

-- Verification
SELECT 'motors' as table_name, COUNT(*) as row_count FROM motors;