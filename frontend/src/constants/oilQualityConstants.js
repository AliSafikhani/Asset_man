// frontend/src/constants/oilQualityConstants.js
//
// Single source of truth for the Oil Quality Control (IEC 60296 + IEC 60422:2024)
// frontend module. The canonical `field_name` of every parameter MUST stay
// identical here, in migration 049_oil_quality_iec_fields.sql, and in the
// algorithm package metadata.py (PARAM_META names + REMAP_60296).
//
// OIL_QUALITY_GROUPS drives the add/edit form subsections. The analyze +
// trend dashboards are fed live from the backend, so display/units there come
// from the API payload — these constants are only for form rendering + badges.

export const OPERATING_STATES = [
  { value: 'in_service', label: 'In Service' },
  { value: 'before_energization', label: 'Before Energization' },
];

// Ordered form subsections (mirror PARAM_META groups in metadata.py).
export const OIL_QUALITY_GROUPS = [
  {
    key: 'routine',
    label: 'Routine (IEC 60422 §7.2–7.8)',
    params: [
      { field_name: 'colour', display: 'Colour', unit: 'ISO', data_type: 'number', subclause: '7.2', method: 'ISO 2049', required: true },
      { field_name: 'appearance', display: 'Appearance', unit: '', data_type: 'select', options: ['Clear', 'Cloudy', 'Sediment'], subclause: '7.3', method: 'Visual', required: true },
      { field_name: 'breakdown_voltage', display: 'Breakdown Voltage', unit: 'kV', data_type: 'number', subclause: '7.4', method: 'IEC 60156', required: true },
      { field_name: 'water_content', display: 'Water Content', unit: 'mg/kg', data_type: 'number', subclause: '7.5', method: 'IEC 60814', required: true },
      { field_name: 'acidity', display: 'Acidity (Neutralization No.)', unit: 'mg KOH/g', data_type: 'number', subclause: '7.6', method: 'IEC 62021', required: true },
      { field_name: 'dielectric_dissipation_90', display: 'Dissipation Factor (tan δ, 90°C)', unit: 'tan δ', data_type: 'number', subclause: '7.7', method: 'IEC 60247', required: true },
      { field_name: 'inhibitor_content', display: 'Inhibitor Content', unit: '%', data_type: 'number', subclause: '7.8', method: 'IEC 60666', required: true },
    ],
  },
  {
    key: 'complementary',
    label: 'Complementary (IEC 60422 §7.9–7.12)',
    params: [
      { field_name: 'sediments', display: 'Sediments', unit: '%', data_type: 'number', subclause: '7.9', method: 'IEC 62961', required: false },
      { field_name: 'interfacial_tension', display: 'Interfacial Tension', unit: 'mN/m', data_type: 'number', subclause: '7.11', method: 'ISO 6295', required: false },
      { field_name: 'particles', display: 'Particle Count', unit: 'count', data_type: 'number', subclause: '7.12', method: 'IEC 60970', required: false, info_only: true },
    ],
  },
  {
    key: 'special',
    label: 'Special (IEC 60422 §7.10–7.20)',
    params: [
      { field_name: 'sludge', display: 'Sludge', unit: '%', data_type: 'number', subclause: '7.10', method: 'IEC 62961', required: false },
      { field_name: 'flash_point', display: 'Flash Point', unit: '°C', data_type: 'number', subclause: '7.13', method: 'ISO 2719', required: false },
      { field_name: 'compatibility', display: 'Compatibility', unit: '', data_type: 'text', subclause: '7.14', method: 'IEC 60422 Annex', required: false, info_only: true },
      { field_name: 'pour_point', display: 'Pour Point', unit: '°C', data_type: 'number', subclause: '7.15', method: 'ISO 3016', required: false },
      { field_name: 'density_20', display: 'Density (20°C)', unit: 'kg/m³', data_type: 'number', subclause: '7.16', method: 'ISO 3675', required: false },
      { field_name: 'viscosity_40', display: 'Kinematic Viscosity (40°C)', unit: 'mm²/s', data_type: 'number', subclause: '7.17', method: 'ISO 3104', required: false },
      { field_name: 'pcb', display: 'PCB Content', unit: 'mg/kg', data_type: 'number', subclause: '7.18', method: 'IEC 61619', required: false },
      { field_name: 'corrosive_sulphur', display: 'Corrosive Sulphur', unit: '', data_type: 'select', options: ['Non-corrosive', 'Corrosive'], subclause: '7.19.2', method: 'DIN 51353', required: false },
      { field_name: 'potentially_corrosive_sulphur', display: 'Potentially Corrosive Sulphur', unit: '', data_type: 'select', options: ['Non-corrosive', 'Corrosive'], subclause: '7.19.3', method: 'IEC 62535', required: false },
      { field_name: 'dbds', display: 'DBDS', unit: 'mg/kg', data_type: 'number', subclause: '7.19.4', method: 'IEC 62697', required: false },
      { field_name: 'passivator_content', display: 'Passivator Content', unit: 'mg/kg', data_type: 'number', subclause: '7.20', method: 'IEC 60666', required: false },
    ],
  },
  {
    key: 'new_oil',
    label: 'New-oil additional (IEC 60296 only)',
    params: [
      { field_name: 'kinematic_viscosity_low', display: 'Kinematic Viscosity (−30°C)', unit: 'mm²/s', data_type: 'number', method: 'ISO 3104', required: false },
      { field_name: 'total_sulphur', display: 'Total Sulphur', unit: '%', data_type: 'number', method: 'ISO 14596', required: false },
      { field_name: 'furfural', display: 'Furfural (2-FAL)', unit: 'mg/kg', data_type: 'number', method: 'IEC 61198', required: false },
      { field_name: 'stray_gassing_h2', display: 'Stray Gassing H₂', unit: 'µl/l', data_type: 'number', method: 'IEC 60296 Annex', required: false },
      { field_name: 'stray_gassing_ch4', display: 'Stray Gassing CH₄', unit: 'µl/l', data_type: 'number', method: 'IEC 60296 Annex', required: false },
      { field_name: 'stray_gassing_c2h6', display: 'Stray Gassing C₂H₆', unit: 'µl/l', data_type: 'number', method: 'IEC 60296 Annex', required: false },
      { field_name: 'oxidation_stability_acidity', display: 'Oxidation Stability – Acidity', unit: 'mg KOH/g', data_type: 'number', method: 'IEC 61125', required: false },
      { field_name: 'oxidation_stability_sludge', display: 'Oxidation Stability – Sludge', unit: '%', data_type: 'number', method: 'IEC 61125', required: false },
      { field_name: 'oxidation_stability_ddf', display: 'Oxidation Stability – DDF', unit: 'tan δ', data_type: 'number', method: 'IEC 61125', required: false },
      { field_name: 'pca', display: 'PCA Content', unit: '%', data_type: 'number', method: 'IP 346', required: false },
      { field_name: 'gassing_tendency', display: 'Gassing Tendency', unit: 'µl/min', data_type: 'number', method: 'IEC 60628 A', required: false },
    ],
  },
];

// Flat lookup: field_name -> param meta (for prefill / labels).
export const OIL_QUALITY_PARAM_BY_NAME = OIL_QUALITY_GROUPS.reduce((acc, g) => {
  g.params.forEach((p) => { acc[p.field_name] = { ...p, group: g.key }; });
  return acc;
}, {});

// ---- Status → badge color maps ---------------------------------------- //

// IEC 60422:2024 condition statuses.
export const STATUS_60422_COLORS = {
  NORMAL: { bg: '#dcfce7', color: '#166534', label: 'NORMAL' },
  ATTENTION: { bg: '#fef3c7', color: '#92400e', label: 'ATTENTION' },
  ACTION: { bg: '#fee2e2', color: '#991b1b', label: 'ACTION' },
  UNKNOWN: { bg: '#f1f5f9', color: '#64748b', label: 'UNKNOWN' },
};

// IEC 60296 new-oil acceptance statuses.
export const STATUS_60296_COLORS = {
  OK: { bg: '#dcfce7', color: '#166534', label: 'OK' },
  FAIR: { bg: '#fef3c7', color: '#92400e', label: 'FAIR' },
  NOT_OK: { bg: '#fee2e2', color: '#991b1b', label: 'NOT OK' },
  UNKNOWN: { bg: '#f1f5f9', color: '#64748b', label: 'UNKNOWN' },
};

// Recommendation severity badges (dashboard recommendations panel).
export const REC_LEVEL_COLORS = {
  ACTION: { bg: '#fee2e2', color: '#991b1b', label: 'ACTION' },
  ATTENTION: { bg: '#fef3c7', color: '#92400e', label: 'ATTENTION' },
  DANGEROUS_TREND: { bg: '#fee2e2', color: '#991b1b', label: 'TREND' },
};

// Trend / overall risk badges.
export const RISK_COLORS = {
  DANGEROUS: { bg: '#fee2e2', color: '#991b1b', label: 'DANGEROUS' },
  NORMAL: { bg: '#dcfce7', color: '#166534', label: 'NORMAL' },
  STABLE: { bg: '#dcfce7', color: '#166534', label: 'STABLE' },
};

// Final recommendation banner colors.
export const FINAL_REC_COLORS = {
  'ACTION REQUIRED': { color: '#dc2626' },
  ATTENTION: { color: '#d97706' },
  'NO ACTION': { color: '#16a34a' },
};

export function badge60422(status) {
  return STATUS_60422_COLORS[String(status || '').toUpperCase()] || STATUS_60422_COLORS.UNKNOWN;
}

export function badge60296(status) {
  return STATUS_60296_COLORS[String(status || '').toUpperCase()] || STATUS_60296_COLORS.UNKNOWN;
}

// Trend direction arrow (↗ rising / ↘ falling / → flat) + color by danger.
export function trendArrow(slopePerYear, dangerous) {
  const s = Number(slopePerYear) || 0;
  const arrow = s > 0.0001 ? '↗' : s < -0.0001 ? '↘' : '→';
  const color = dangerous ? '#dc2626' : '#2563eb';
  return { arrow, color };
}

// Group key -> human label (for coverage rows / tabs).
export const GROUP_LABELS = {
  routine: 'Routine',
  complementary: 'Complementary',
  special: 'Special',
  new_oil: 'New-oil',
};
