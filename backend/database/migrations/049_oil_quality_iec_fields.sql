-- =====================================================
-- Oil Quality Control (IEC 60296 + IEC 60422:2024) field definitions
-- Migration: 049_oil_quality_iec_fields.sql
-- =====================================================
-- Replaces the 7 legacy "Oil Quality" (transformer) flat fields (migration 031)
-- with the canonical IEC parameter set consumed by the algorithm package
-- (backend/algorithms/transformer/oil_quality_control/metadata.py) and the
-- frontend (frontend/src/constants/oilQualityConstants.js).
--
-- The canonical field_name of every parameter MUST stay identical across:
--   * this migration
--   * metadata.py  (PARAM_META names + REMAP_60296)
--   * oilQualityConstants.js
-- This is the single coupling point for the module.
--
-- Idempotent: re-running deletes then re-inserts the full set.
-- =====================================================

-- 1. Remove ALL existing Oil Quality field definitions (transformer),
--    including the 7 legacy ones (dielectric_strength, moisture, acidity,
--    interfacial_tension, color, density, viscosity).
DELETE FROM test_field_definitions
WHERE test_type_id = (
    SELECT id FROM test_types
    WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
);

-- 2. Insert the meta field (operating_state) + the 32 canonical parameters.
--    display_order 0 = operating_state; routine 1-7; complementary 8-10;
--    special 11-21; new-oil (IEC 60296 only) 22-32.
INSERT INTO test_field_definitions (
    test_type_id, field_name, display_name, unit, data_type,
    is_required, display_order, allowed_values, description
)
-- ---- Meta ----
SELECT id, 'operating_state', 'Operating State', NULL, 'select', true, 0,
       '["before_energization","in_service"]'::jsonb,
       'IEC 60422 routing: before_energization -> Table 3, in_service -> Table 5'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'

-- ---- Group 1: Routine (IEC 60422 7.2-7.8) ----
UNION ALL SELECT id, 'colour', 'Colour', 'ISO', 'number', true, 1,
       NULL, 'IEC 60422 7.2 / ISO 2049'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'appearance', 'Appearance', NULL, 'select', true, 2,
       '["Clear","Cloudy","Sediment"]'::jsonb, 'IEC 60422 7.3 (visual)'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'breakdown_voltage', 'Breakdown Voltage', 'kV', 'number', true, 3,
       NULL, 'IEC 60422 7.4 / IEC 60156'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'water_content', 'Water Content', 'mg/kg', 'number', true, 4,
       NULL, 'IEC 60422 7.5 / IEC 60814'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'acidity', 'Acidity (Neutralization No.)', 'mg KOH/g', 'number', true, 5,
       NULL, 'IEC 60422 7.6 / IEC 62021 (60296 neutralization_number)'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'dielectric_dissipation_90', 'Dissipation Factor (tan d, 90C)', 'tan d', 'number', true, 6,
       NULL, 'IEC 60422 7.7 / IEC 60247'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'inhibitor_content', 'Inhibitor Content', '%', 'number', true, 7,
       NULL, 'IEC 60422 7.8 / IEC 60666'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'

-- ---- Group 2: Complementary (IEC 60422 7.9-7.12) ----
UNION ALL SELECT id, 'sediments', 'Sediments', '%', 'number', false, 8,
       NULL, 'IEC 60422 7.9 / IEC 62961'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'interfacial_tension', 'Interfacial Tension', 'mN/m', 'number', false, 9,
       NULL, 'IEC 60422 7.11 / ISO 6295'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'particles', 'Particle Count', 'count', 'number', false, 10,
       NULL, 'IEC 60422 7.12 / IEC 60970 (info only)'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'

-- ---- Group 3: Special (IEC 60422 7.10-7.20) ----
UNION ALL SELECT id, 'sludge', 'Sludge', '%', 'number', false, 11,
       NULL, 'IEC 60422 7.10 / IEC 62961'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'flash_point', 'Flash Point', 'C', 'number', false, 12,
       NULL, 'IEC 60422 7.13 / ISO 2719'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'compatibility', 'Compatibility', NULL, 'text', false, 13,
       NULL, 'IEC 60422 7.14 Annex (info only)'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'pour_point', 'Pour Point', 'C', 'number', false, 14,
       NULL, 'IEC 60422 7.15 / ISO 3016'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'density_20', 'Density (20C)', 'kg/m3', 'number', false, 15,
       NULL, 'IEC 60422 7.16 / ISO 3675'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'viscosity_40', 'Kinematic Viscosity (40C)', 'mm2/s', 'number', false, 16,
       NULL, 'IEC 60422 7.17 / ISO 3104 (60296 kinematic_viscosity_40)'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'pcb', 'PCB Content', 'mg/kg', 'number', false, 17,
       NULL, 'IEC 60422 7.18 / IEC 61619'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'corrosive_sulphur', 'Corrosive Sulphur', NULL, 'select', false, 18,
       '["Non-corrosive","Corrosive"]'::jsonb, 'IEC 60422 7.19.2 / DIN 51353'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'potentially_corrosive_sulphur', 'Potentially Corrosive Sulphur', NULL, 'select', false, 19,
       '["Non-corrosive","Corrosive"]'::jsonb, 'IEC 60422 7.19.3 / IEC 62535'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'dbds', 'DBDS', 'mg/kg', 'number', false, 20,
       NULL, 'IEC 60422 7.19.4 / IEC 62697'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'passivator_content', 'Passivator Content', 'mg/kg', 'number', false, 21,
       NULL, 'IEC 60422 7.20 / IEC 60666 (60296 metal_passivator)'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'

-- ---- Group 4: New-oil additional (IEC 60296 only) ----
UNION ALL SELECT id, 'kinematic_viscosity_low', 'Kinematic Viscosity (-30C)', 'mm2/s', 'number', false, 22,
       NULL, 'IEC 60296 / ISO 3104 (60296 kinematic_viscosity_-30)'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'total_sulphur', 'Total Sulphur', '%', 'number', false, 23,
       NULL, 'IEC 60296 / ISO 14596'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'furfural', 'Furfural (2-FAL)', 'mg/kg', 'number', false, 24,
       NULL, 'IEC 60296 / IEC 61198'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'stray_gassing_h2', 'Stray Gassing H2', 'ul/l', 'number', false, 25,
       NULL, 'IEC 60296 Annex'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'stray_gassing_ch4', 'Stray Gassing CH4', 'ul/l', 'number', false, 26,
       NULL, 'IEC 60296 Annex'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'stray_gassing_c2h6', 'Stray Gassing C2H6', 'ul/l', 'number', false, 27,
       NULL, 'IEC 60296 Annex'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'oxidation_stability_acidity', 'Oxidation Stability - Acidity', 'mg KOH/g', 'number', false, 28,
       NULL, 'IEC 60296 / IEC 61125'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'oxidation_stability_sludge', 'Oxidation Stability - Sludge', '%', 'number', false, 29,
       NULL, 'IEC 60296 / IEC 61125'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'oxidation_stability_ddf', 'Oxidation Stability - DDF', 'tan d', 'number', false, 30,
       NULL, 'IEC 60296 / IEC 61125'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'pca', 'PCA Content', '%', 'number', false, 31,
       NULL, 'IEC 60296 / IP 346'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
UNION ALL SELECT id, 'gassing_tendency', 'Gassing Tendency', 'ul/min', 'number', false, 32,
       NULL, 'IEC 60296 / IEC 60628 A'
  FROM test_types WHERE test_name = 'Oil Quality' AND asset_type = 'transformer';

-- 3. Verify
SELECT 'Oil Quality fields installed: ' || COUNT(*)::text AS status
FROM test_field_definitions
WHERE test_type_id = (
    SELECT id FROM test_types
    WHERE test_name = 'Oil Quality' AND asset_type = 'transformer'
);

-- =====================================================
-- ROLLBACK (restore legacy 7 fields): re-run migration 031's Oil Quality block.
-- =====================================================
