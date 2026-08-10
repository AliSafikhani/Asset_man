/**
 * Report constants — shared between the entry point and the render tree.
 * File: frontend/src/features/report/reportConstants.js
 */

// Gases plotted on the DGA trend chart (log Y). Order = legend order.
export const TREND_GAS_KEYS = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2'];

// The transformer report's selectable modules. Data-driven so adding a future
// module is a one-line change here (plus a page component).
export const MODULES = [
  { key: 'dga', label: 'DGA', desc: 'Dissolved Gas Analysis — multi-method diagnostics' },
  { key: 'iec62874', label: 'IEC 62874', desc: 'Paper thermal degradation (2-FAL / CO₂)' },
  { key: 'rul', label: 'RUL', desc: 'Remaining life (IEC 60076-7 thermal ageing)' },
];

// The multi-method DGA table columns, in display order.
// key   -> field on each results_table row
// label -> abbreviated header (kept short: table is table-layout:fixed, ~9px)
// kind  -> 'status' (colored status text) or 'diag' (fault code + colour dot)
export const DGA_COLUMNS = [
  { key: 'iec', label: 'IEC', kind: 'status' },
  { key: 'ieee', label: 'IEEE', kind: 'status' },
  { key: 'duval_1', label: 'Duv1', kind: 'diag' },
  { key: 'duval_4', label: 'Duv4', kind: 'diag' },
  { key: 'duval_5', label: 'Duv5', kind: 'diag' },
  { key: 'duval_6', label: 'Duv6', kind: 'diag' },
  { key: 'pentagon_1', label: 'Pen1', kind: 'diag' },
  { key: 'pentagon_2', label: 'Pen2', kind: 'diag' },
  { key: 'iec60599', label: 'IEC599', kind: 'diag' },
  { key: 'rogers', label: 'Rogers', kind: 'diag' },
  { key: 'doernenburg', label: 'Doern', kind: 'diag' },
  { key: 'ml', label: 'ML', kind: 'diag' },
];
