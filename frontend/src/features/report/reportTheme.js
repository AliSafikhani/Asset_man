/**
 * Report theme — hex-only palette + shared style objects.
 * File: frontend/src/features/report/reportTheme.js
 *
 * Everything the report DOM renders uses these hex values (NO oklch/lab/MUI
 * theme tokens) so html2canvas-pro captures colours faithfully and the PDF is
 * deterministic. Mirrors the idiom already used by RULResults.jsx / IEC62874.jsx.
 */

// A4 @ 96 dpi, in CSS pixels — one node = one PDF page.
export const PAGE_W_PX = 794;
export const PAGE_H_PX = 1123;
export const PAGE_PAD_PX = 40;
export const CAPTURE_SCALE = 2;

export const colors = {
  ink: '#0f172a',
  slate: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  bg: '#ffffff',
  panel: '#f8fafc',
  brandDark: '#1e293b',
  brandDarker: '#0f172a',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  indigo: '#667eea',
};

// Series colours for the DGA multi-gas trend (log Y).
export const gasColors = {
  h2: '#ef4444',
  ch4: '#f59e0b',
  c2h2: '#8b5cf6',
  c2h4: '#3b82f6',
  c2h6: '#10b981',
  co: '#0ea5e9',
  co2: '#64748b',
};

export const gasLabels = {
  h2: 'H₂',
  ch4: 'CH₄',
  c2h2: 'C₂H₂',
  c2h4: 'C₂H₄',
  c2h6: 'C₂H₆',
  co: 'CO',
  co2: 'CO₂',
};

export const styles = {
  sectionTitle: {
    margin: '0 0 12px',
    fontSize: 15,
    fontWeight: 700,
    color: colors.ink,
  },
  cardTitle: {
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.muted,
  },
  card: {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: 12,
    padding: 16,
  },
  pageHeader: {
    background: colors.brandDark,
    borderRadius: 12,
    padding: '16px 22px',
    marginBottom: 18,
    color: colors.bg,
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: PAGE_PAD_PX,
    right: PAGE_PAD_PX,
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 9,
    color: colors.faint,
    borderTop: `1px solid ${colors.line}`,
    paddingTop: 6,
  },
};
