# 01_schema.sql created
-- PostgreSQL Schema for Main Application
-- Handles users, static data, and metadata

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing (alternative to application-level hashing)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'analyst', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    request_count INTEGER DEFAULT 0,
    last_request_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- REFRESH TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- =====================================================
-- STATIC RECORDS TABLE (for 10k+ records)
-- =====================================================
CREATE TABLE IF NOT EXISTS static_records (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    data_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'boolean', 'json', 'date')),
    value JSONB NOT NULL,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 100),
    view_count INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for static_records
CREATE INDEX idx_static_records_title ON static_records(title);
CREATE INDEX idx_static_records_category ON static_records(category);
CREATE INDEX idx_static_records_data_type ON static_records(data_type);
CREATE INDEX idx_static_records_is_public ON static_records(is_public);
CREATE INDEX idx_static_records_priority ON static_records(priority);
CREATE INDEX idx_static_records_created_at ON static_records(created_at);
CREATE INDEX idx_static_records_is_deleted ON static_records(is_deleted);
CREATE INDEX idx_static_records_tags ON static_records USING GIN(tags);
CREATE INDEX idx_static_records_metadata ON static_records USING GIN(metadata);
CREATE INDEX idx_category_priority ON static_records(category, priority);

-- Full-text search index
CREATE INDEX idx_static_records_search ON static_records USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- =====================================================
-- TEST DATASETS TABLE (for 1000+ datasets with 100 parameters)
-- =====================================================
CREATE TABLE IF NOT EXISTS test_datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50),
    parameters JSONB NOT NULL, -- Stores 100+ parameters as key-value pairs
    metadata JSONB DEFAULT '{}',
    dataset_size INTEGER DEFAULT 0, -- Number of data points
    file_path VARCHAR(500), -- Optional path to large dataset file
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}'
);

-- Indexes for test_datasets
CREATE INDEX idx_test_datasets_name ON test_datasets(name);
CREATE INDEX idx_test_datasets_created_by ON test_datasets(created_by);
CREATE INDEX idx_test_datasets_created_at ON test_datasets(created_at);
CREATE INDEX idx_test_datasets_is_archived ON test_datasets(is_archived);
CREATE INDEX idx_test_datasets_tags ON test_datasets USING GIN(tags);
CREATE INDEX idx_test_datasets_parameters ON test_datasets USING GIN(parameters);
CREATE INDEX idx_test_datasets_metadata ON test_datasets USING GIN(metadata);

-- =====================================================
-- ANALYTICS QUERIES TABLE (for storing user queries)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query_type VARCHAR(50) NOT NULL,
    query_params JSONB,
    result_count INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics_queries
CREATE INDEX idx_analytics_queries_user_id ON analytics_queries(user_id);
CREATE INDEX idx_analytics_queries_created_at ON analytics_queries(created_at);
CREATE INDEX idx_analytics_queries_query_type ON analytics_queries(query_type);

-- =====================================================
-- AUDIT LOG TABLE (for tracking changes)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_log
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_static_records_updated_at 
    BEFORE UPDATE ON static_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_datasets_updated_at 
    BEFORE UPDATE ON test_datasets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log changes to audit_log
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_data)
        VALUES (current_setting('audit.current_user_id', TRUE)::INTEGER, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (current_setting('audit.current_user_id', TRUE)::INTEGER, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
        VALUES (current_setting('audit.current_user_id', TRUE)::INTEGER, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers (commented out by default - enable if needed)
-- CREATE TRIGGER audit_users_trigger AFTER INSERT OR UPDATE OR DELETE ON users
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
-- CREATE TRIGGER audit_static_records_trigger AFTER INSERT OR UPDATE OR DELETE ON static_records
--     FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- INITIAL SEED DATA
-- =====================================================

-- Create default admin user (password: Admin123!)
-- Password hash is for "Admin123!" - CHANGE THIS IN PRODUCTION
INSERT INTO users (email, username, full_name, hashed_password, role, is_active, is_verified)
VALUES (
    'admin@example.com',
    'admin',
    'System Administrator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKy4tMqGVcwN1Pq', -- Admin123!
    'admin',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Create default viewer user (password: Viewer123!)
INSERT INTO users (email, username, full_name, hashed_password, role, is_active, is_verified)
VALUES (
    'viewer@example.com',
    'viewer',
    'Test Viewer',
    '$2b$12$YKqpeOxrL9rZVsJhsKhwteXim63FUXZSH6nsVq7Y8j7IHz5uVcXTO', -- Viewer123!
    'viewer',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to cleanup old refresh tokens
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() - INTERVAL '30 days'
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get database statistics
CREATE OR REPLACE FUNCTION get_db_stats()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    total_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        relname::TEXT,
        n_live_tup::BIGINT,
        pg_size_pretty(pg_total_relation_size(relid))::TEXT
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
END;
$$ LANGUAGE plpgsql;

-- Comment on tables
COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE static_records IS 'Static data records - supports 10k+ records with pagination';
COMMENT ON TABLE test_datasets IS 'Test datasets with 100+ parameters each - supports 1000+ datasets';
COMMENT ON TABLE refresh_tokens IS 'JWT refresh tokens for authentication';
COMMENT ON TABLE audit_log IS 'Audit log for tracking all data changes';