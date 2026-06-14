-- STEP 1: Create organization hierarchy tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: CENTROIDS
DROP TABLE IF EXISTS centroids CASCADE;
CREATE TABLE centroids (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    abbreviation VARCHAR(20),
    contact_person VARCHAR(200),
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    timezone VARCHAR(100) DEFAULT 'UTC',
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_centroids_code ON centroids(code);

-- Table 2: COMPANIES
DROP TABLE IF EXISTS companies CASCADE;
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    centroid_id INTEGER NOT NULL REFERENCES centroids(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    abbreviation VARCHAR(20),
    company_type VARCHAR(50),
    contact_person VARCHAR(200),
    contact_email VARCHAR(200),
    contact_phone VARCHAR(50),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_centroid ON companies(centroid_id);

-- Table 3: PLANTS
DROP TABLE IF EXISTS plants CASCADE;
CREATE TABLE plants (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    plant_type VARCHAR(50),
    plant_manager_name VARCHAR(200),
    plant_manager_email VARCHAR(200),
    plant_manager_phone VARCHAR(50),
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    gps_coordinates POINT,
    commissioning_date DATE,
    operational_status VARCHAR(50) DEFAULT 'operational',
    installed_capacity_mw DECIMAL(12,3),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plants_code ON plants(code);
CREATE INDEX idx_plants_company ON plants(company_id);
CREATE INDEX idx_plants_status ON plants(operational_status);

-- Table 4: PLANT SECTIONS
DROP TABLE IF EXISTS plant_sections CASCADE;
CREATE TABLE plant_sections (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    section_type VARCHAR(50),
    description TEXT,
    parent_section_id INTEGER REFERENCES plant_sections(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plant_sections_plant ON plant_sections(plant_id);
CREATE INDEX idx_plant_sections_parent ON plant_sections(parent_section_id);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS database\migrations\001_create_hierarchy_tables.sql
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
database\migrations\001_create_hierarchy_tables.sql LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_centroids_updated_at ON centroids;
CREATE TRIGGER update_centroids_updated_at BEFORE UPDATE ON centroids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plants_updated_at ON plants;
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON plants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plant_sections_updated_at ON plant_sections;
CREATE TRIGGER update_plant_sections_updated_at BEFORE UPDATE ON plant_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data
INSERT INTO centroids (name, code, abbreviation, contact_email, status, country)
VALUES ('Global Energy Management', 'GEM001', 'GEM', 'admin@globalenergy.com', 'active', 'USA');

INSERT INTO companies (centroid_id, name, code, abbreviation, company_type, contact_email, status, country)
SELECT id, 'Sample Energy Company', 'SEC001', 'SEC', 'utility', 'contact@sampleenergy.com', 'active', 'USA'
FROM centroids WHERE code = 'GEM001';

INSERT INTO plants (company_id, name, code, plant_type, plant_manager_email, operational_status, country)
SELECT c.id, 'Sample Power Plant', 'SPP001', 'power_plant', 'plantmanager@sampleenergy.com', 'operational', 'USA'
FROM companies c WHERE c.code = 'SEC001';

-- Verification
SELECT 'centroids' as table_name, COUNT(*) as row_count FROM centroids
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'plants', COUNT(*) FROM plants
UNION ALL
SELECT 'plant_sections', COUNT(*) FROM plant_sections;