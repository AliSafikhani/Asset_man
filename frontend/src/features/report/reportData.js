/**
 * Report data transforms — JSON payload → per-page render props.
 * File: frontend/src/features/report/reportData.js
 *
 * Pure functions only (no React). The log-scale sanitizer is the important one:
 * a Recharts log axis breaks on 0 / negative / null, so gas points are clamped
 * to a positive floor and the domain is computed as powers of ten.
 */

import { TREND_GAS_KEYS } from './reportConstants';

// ---- formatters ----
export const fmtDate = (iso) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return isNaN(d) ? String(iso) : d.toLocaleDateString();
};

export const num = (v, digits = 1) =>
  v === null || v === undefined || isNaN(v) ? 'N/A' : Number(v).toFixed(digits);

export const displayValue = (v) =>
  v !== null && v !== undefined && v !== '' ? v : 'N/A';

// ---- DGA gas trend: log-scale sanitizer ----
// Returns { rows, series, yMin, yMax } ready for a fixed-size Recharts LineChart.
// Non-positive / null gas values are clamped to a positive floor so the log
// axis renders; the floor is remembered per-series so the legend can note it.
export const buildGasTrend = (gasTrend) => {
  const rows = Array.isArray(gasTrend) ? gasTrend : [];
  if (!rows.length) return { rows: [], series: [], yMin: 1, yMax: 10 };

  const FLOOR = 0.1; // ppm — below the practical detection floor for DGA gases
  let maxVal = FLOOR;

  const activeKeys = TREND_GAS_KEYS.filter((k) =>
    rows.some((r) => Number(r[k]) > 0)
  );

  const cleanRows = rows.map((r) => {
    const out = { date: fmtDate(r.date) };
    for (const k of activeKeys) {
      const v = Number(r[k]);
      const safe = !isFinite(v) || v <= 0 ? FLOOR : v;
      out[k] = safe;
      if (safe > maxVal) maxVal = safe;
    }
    return out;
  });

  // Domain as powers of ten around [FLOOR, maxVal].
  const yMin = FLOOR;
  const yMax = Math.pow(10, Math.ceil(Math.log10(maxVal)));

  return { rows: cleanRows, series: activeKeys, yMin, yMax };
};

// ---- DGA table pagination ----
// The first DGA page also carries the trend chart, so it fits fewer table rows.
export const DGA_ROWS_FIRST = 12;
export const DGA_ROWS_CONT = 26;

// How many A4 pages the DGA block needs for a given payload.
export const dgaPageCount = (dga) => {
  const rows = dga?.results_table?.length || 0;
  if (rows <= DGA_ROWS_FIRST) return 1;
  return 1 + Math.ceil((rows - DGA_ROWS_FIRST) / DGA_ROWS_CONT);
};

// Slice the table rows for a given DGA page index (0-based within the block).
export const dgaRowsForPage = (rows, idx) => {
  if (idx === 0) return rows.slice(0, DGA_ROWS_FIRST);
  const start = DGA_ROWS_FIRST + (idx - 1) * DGA_ROWS_CONT;
  return rows.slice(start, start + DGA_ROWS_CONT);
};

// ---- RUL time-series downsampler (mirrors RULResults.jsx) ----
const MAX_CHART_POINTS = 600;

export const buildRulChartData = (ts) => {
  if (!ts || !ts.timestamps || !ts.timestamps.length) return [];
  const n = ts.timestamps.length;
  const step = Math.max(1, Math.ceil(n / MAX_CHART_POINTS));
  const rows = [];
  for (let i = 0; i < n; i += step) {
    rows.push({
      t: ts.timestamps[i],
      hot_spot: ts.hot_spot_temperature?.[i] ?? null,
      top_oil: ts.top_oil_temperature?.[i] ?? null,
      ambient: ts.ambient_temperature?.[i] ?? null,
      faa: ts.faa?.[i] ?? null,
      load_factor: ts.load_factor?.[i] ?? null,
    });
  }
  return rows;
};

// Green → amber → red by remaining-life fraction of design life.
export const lifeColor = (remaining, design) => {
  if (!design) return '#10b981';
  const frac = remaining / design;
  if (frac >= 0.33) return '#10b981';
  if (frac >= 0.15) return '#f59e0b';
  return '#ef4444';
};

// A safe filename stem: {plant}_{assetCode}_Transformer_Report_{YYYYMMDD}.
export const reportFileName = (cover, isoDate) => {
  const plant = (cover?.plant_name || 'plant').replace(/[^\w.-]+/g, '_');
  const code = (cover?.asset?.asset_code || 'asset').replace(/[^\w.-]+/g, '_');
  const stamp = (isoDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return `${plant}_${code}_Transformer_Report_${stamp}.pdf`;
};
