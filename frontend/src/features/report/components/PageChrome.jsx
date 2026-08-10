/**
 * PageChrome — shared page header band + footer for report pages.
 * File: frontend/src/features/report/components/PageChrome.jsx
 */

import { styles, colors } from '../reportTheme';

// Dark header band with a title, subtitle, and small right-aligned meta.
export const PageHeader = ({ title, subtitle, right }) => (
  <div
    style={{
      ...styles.pageHeader,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>
      )}
    </div>
    {right && <div style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'right' }}>{right}</div>}
  </div>
);

// Fixed footer: plant/asset on the left, page x of y on the right.
export const PageFooter = ({ left, pageNo, pageCount }) => (
  <div style={styles.footer}>
    <span>{left}</span>
    <span>
      Page {pageNo} of {pageCount}
    </span>
  </div>
);

// Little colored dot used in the DGA table diagnostic cells.
export const Dot = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: color || colors.faint,
      marginRight: 4,
      verticalAlign: 'middle',
    }}
  />
);
