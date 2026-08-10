/**
 * DGATable — the wide multi-method DGA diagnostic table.
 * File: frontend/src/features/report/components/DGATable.jsx
 *
 * table-layout:fixed + ~9px font so 14 columns (Date + IEC/IEEE status + 10
 * diagnostic methods) fit one A4 width. Each diagnostic cell shows a colour dot
 * + the fault code; status cells show the coloured status text.
 */

import { DGA_COLUMNS } from '../reportConstants';
import { fmtDate } from '../reportData';
import { colors } from '../reportTheme';
import { Dot } from './PageChrome';

const th = {
  fontSize: 9,
  fontWeight: 700,
  color: '#475569',
  background: '#f1f5f9',
  padding: '6px 3px',
  borderBottom: `1px solid ${colors.line}`,
  textAlign: 'center',
};

const td = {
  fontSize: 9,
  color: colors.slate,
  padding: '5px 3px',
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const Cell = ({ col, value }) => {
  if (!value) return <td style={td}>—</td>;
  if (col.kind === 'status') {
    return (
      <td style={{ ...td, color: value.color || colors.slate, fontWeight: 600 }}>
        {value.status || '—'}
      </td>
    );
  }
  // diagnostic: colour dot + fault code (title carries the full name)
  return (
    <td style={td} title={value.name || ''}>
      <Dot color={value.color} />
      {value.code || '—'}
    </td>
  );
};

const DGATable = ({ rows }) => {
  if (!rows || !rows.length) {
    return (
      <div style={{ fontSize: 11, color: colors.faint, padding: '12px 0' }}>
        No DGA samples available for this transformer.
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th style={{ ...th, width: 62, textAlign: 'left', paddingLeft: 4 }}>Date</th>
          {DGA_COLUMNS.map((c) => (
            <th key={c.key} style={th}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td style={{ ...td, textAlign: 'left', paddingLeft: 4, fontWeight: 600, color: colors.ink }}>
              {fmtDate(r.date)}
            </td>
            {DGA_COLUMNS.map((c) => (
              <Cell key={c.key} col={c} value={r[c.key]} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DGATable;
