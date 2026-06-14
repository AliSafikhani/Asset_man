-- Table: test_results (header)
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    test_type_id INTEGER NOT NULL REFERENCES test_types(id),
    test_date DATE NOT NULL,
    lab_name VARCHAR(200),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: test_parameters (values for each field)
CREATE TABLE IF NOT EXISTS test_parameters (
    id SERIAL PRIMARY KEY,
    test_result_id INTEGER NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value DECIMAL(15,4),
    field_value_text TEXT,
    field_value_date DATE,
    field_value_boolean BOOLEAN,
    unit VARCHAR(50),
    is_pass BOOLEAN,
    limit_min DECIMAL(15,4),
    limit_max DECIMAL(15,4),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_test_results_asset ON test_results(asset_id);
CREATE INDEX idx_test_results_test_type ON test_results(test_type_id);
CREATE INDEX idx_test_results_date ON test_results(test_date);
CREATE INDEX idx_test_params_result ON test_parameters(test_result_id);
CREATE INDEX idx_test_params_field ON test_parameters(field_name);

-- Comments
COMMENT ON TABLE test_results IS 'Header record for each test performed';
COMMENT ON TABLE test_parameters IS 'Individual parameter values for each test result';
