-- Create test_field_definitions table
CREATE TABLE IF NOT EXISTS test_field_definitions (
    id SERIAL PRIMARY KEY,
    test_type_id INTEGER NOT NULL REFERENCES test_types(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    unit VARCHAR(50),
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'number',
    is_required BOOLEAN DEFAULT FALSE,
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    allowed_values JSONB,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_type_id, field_name)
);

-- Create indexes
CREATE INDEX idx_field_def_test_type ON test_field_definitions(test_type_id);
CREATE INDEX idx_field_def_order ON test_field_definitions(display_order);

-- Verify table creation
SELECT 'test_field_definitions table created' as status;
