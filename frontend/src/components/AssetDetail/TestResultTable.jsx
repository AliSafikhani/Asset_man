// frontend/src/components/AssetDetail/TestResultTable.jsx

import React from 'react';

const TestResultTable = ({
  testResults,
  testFields,
  visibleColumns,
  selectedRows,
  selectAll,
  onSelectAll,
  onRowSelect,
  onEdit,
  onDelete,
  ieeeStatusMap = {}
}) => {
  
  // Get IEEE status for a result
  const getIeeeStatus = (resultId) => {
    if (ieeeStatusMap && ieeeStatusMap[resultId]) {
      return ieeeStatusMap[resultId];
    }
    return null;
  };

  // Render IEEE status badge
  const renderIeeeStatus = (status) => {
    if (!status) {
      return <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>;
    }
    
    const colors = {
      0: { bg: '#f1f5f9', text: '#64748b', label: 'Unknown' },
      1: { bg: '#dcfce7', text: '#16a34a', label: 'Normal' },
      2: { bg: '#fef3c7', text: '#d97706', label: 'Investigate' },
      3: { bg: '#fee2e2', text: '#dc2626', label: 'Action Required' }
    };
    
    const style = colors[status.status] || colors[0];
    
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.text,
        whiteSpace: 'nowrap'
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            {visibleColumns.checkbox && (
              <th style={{ ...styles.th, width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={onSelectAll}
                  style={styles.checkbox}
                />
              </th>
            )}
            {visibleColumns.test_date && (
              <th style={styles.th}>Test Date</th>
            )}
            {visibleColumns.lab_name && (
              <th style={styles.th}>Lab</th>
            )}
            {testFields
              .filter(field => visibleColumns[field.field_name])
              .map(field => (
                <th key={field.id} style={styles.th}>
                  {field.display_name}
                  {field.unit && <span style={styles.unit}>({field.unit})</span>}
                </th>
              ))}
            {/* IEEE Status Column */}
            <th style={{ ...styles.th, minWidth: '120px', background: '#f8fafc', borderLeft: '2px solid #e2e8f0' }}>
              IEEE Status
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '400' }}>
                C57.104-2019
              </span>
            </th>
            {visibleColumns.notes && (
              <th style={styles.th}>Notes</th>
            )}
            {visibleColumns.actions && (
              <th style={{ ...styles.th, width: '120px' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {testResults.length === 0 ? (
            <tr>
              <td colSpan={Object.values(visibleColumns).filter(v => v).length + 2} style={styles.emptyState}>
                No test results available
              </td>
            </tr>
          ) : (
            testResults.map((result) => {
              const ieeeStatus = getIeeeStatus(result.id);
              return (
                <tr key={result.id} style={styles.row}>
                  {visibleColumns.checkbox && (
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(result.id)}
                        onChange={() => onRowSelect(result.id)}
                        style={styles.checkbox}
                      />
                    </td>
                  )}
                  {visibleColumns.test_date && (
                    <td style={styles.td}>
                      {new Date(result.test_date).toLocaleDateString()}
                    </td>
                  )}
                  {visibleColumns.lab_name && (
                    <td style={styles.td}>{result.lab_name || '-'}</td>
                  )}
                  {testFields
                    .filter(field => visibleColumns[field.field_name])
                    .map(field => {
                      const param = result.parameters.find(
                        p => p.field_name === field.field_name
                      );
                      let value = '-';
                      if (param) {
                        if (param.field_value !== null && param.field_value !== undefined) {
                          value = param.field_value;
                        } else if (param.field_value_text) {
                          value = param.field_value_text;
                        } else if (param.field_value_date) {
                          value = new Date(param.field_value_date).toLocaleDateString();
                        } else if (param.field_value_boolean !== null) {
                          value = param.field_value_boolean ? 'Yes' : 'No';
                        }
                      }
                      return (
                        <td key={field.id} style={styles.td}>
                          {value}
                        </td>
                      );
                    })}
                  {/* IEEE Status Cell */}
                  <td style={{
                    ...styles.td,
                    background: '#fafbfc',
                    borderLeft: '2px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    {renderIeeeStatus(ieeeStatus)}
                  </td>
                  {visibleColumns.notes && (
                    <td style={styles.td}>{result.notes || '-'}</td>
                  )}
                  {visibleColumns.actions && (
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => onEdit(result)}
                          style={styles.editButton}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDelete(result.id)}
                          style={styles.deleteButton}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  headerRow: {
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#475569',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '10px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#0f172a',
    fontSize: '13px'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },
  unit: {
    fontSize: '10px',
    color: '#94a3b8',
    marginLeft: '4px',
    fontWeight: '400'
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8'
  },
  actionButtons: {
    display: 'flex',
    gap: '6px'
  },
  editButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: '#f1f5f9',
    fontSize: '14px',
    transition: 'background 0.2s'
  },
  deleteButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: '#fef2f2',
    fontSize: '14px',
    transition: 'background 0.2s'
  }
};

export default TestResultTable;