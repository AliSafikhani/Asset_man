/**
 * Small presentational components for the report pages.
 * File: frontend/src/features/report/components/ReportCard.jsx
 *
 * Mirrors the inline-style Card pattern from RULResults / IEC62874, scoped to
 * report sizing (tighter padding, smaller type).
 */

import { styles } from '../reportTheme';

export const ReportCard = ({ children, style }) => (
  <div style={{ ...styles.card, ...style }}>{children}</div>
);

export const SectionTitle = ({ children, style }) => (
  <h3 style={{ ...styles.sectionTitle, ...style }}>{children}</h3>
);

export const CardTitle = ({ children, style }) => (
  <h4 style={{ ...styles.cardTitle, ...style }}>{children}</h4>
);

// Inline label/value row helper for compact nameplate tables.
export const Row = ({ label, value, style }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      padding: '4px 0',
      borderBottom: '1px solid #f1f5f9',
      ...style,
    }}
  >
    <span style={{ color: '#94a3b8' }}>{label}</span>
    <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
  </div>
);

// A compact stat tile (label + big value + optional sub-line).
export const StatTile = ({ label, value, sub, valueColor = '#0f172a' }) => (
  <div style={{ ...styles.card, padding: 14 }}>
    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: valueColor, marginTop: 2 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
  </div>
);

// A thin colored progress/score bar (reused by RUL remaining-life & IEC decision).
export const GaugeBar = ({ pct, color }) => (
  <div style={{ marginTop: 8 }}>
    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct || 0))}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
        }}
      />
    </div>
  </div>
);

// A small status pill (used for IEC LOW/TYPICAL/HIGH badges).
export const StatusPill = ({ text, bg, color }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      background: bg,
      color,
    }}
  >
    {text}
  </span>
);
