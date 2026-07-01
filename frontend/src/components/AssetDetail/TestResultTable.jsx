// TestResultTable.jsx
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
  onDelete
}) => {
  return (
    <div style={styles.tableWrapper}>
      <table style={styles.dataTable}>
        <thead>
          <tr>
            {visibleColumns.checkbox !== false && (
              <th style={styles.thCheckbox}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={onSelectAll}
                  style={styles.checkbox}
                />
              </th>
            )}
            {visibleColumns.test_date !== false && (
              <th style={styles.th}>Test Date</th>
            )}
            {visibleColumns.lab_name !== false && (
              <th style={styles.th}>Lab Name</th>
            )}
            {testFields.map(field => {
              if (visibleColumns[field.field_name] === false) return null;
              return (
                <th key={field.id} style={styles.th}>{field.display_name}</th>
              );
            })}
            {visibleColumns.notes !== false && (
              <th style={styles.th}>Notes</th>
            )}
            {visibleColumns.actions !== false && (
              <th style={styles.th}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {testResults.map(result => {
            const isChecked = selectedRows.includes(result.id);
            return (
              <tr key={result.id} style={isChecked ? styles.trSelected : styles.tr}>
                {visibleColumns.checkbox !== false && (
                  <td style={styles.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onRowSelect(result.id)}
                      style={styles.checkbox}
                    />
                  </td>
                )}
                {visibleColumns.test_date !== false && (
                  <td style={styles.td}>{new Date(result.test_date).toLocaleDateString()}</td>
                )}
                {visibleColumns.lab_name !== false && (
                  <td style={styles.td}>{result.lab_name || '-'}</td>
                )}
                {testFields.map(field => {
                  if (visibleColumns[field.field_name] === false) return null;
                  const param = result.parameters?.find(p => p.field_name === field.field_name);
                  let value = '-';
                  let unit = '';
                  
                  if (param) {
                    if (param.field_value !== null) {
                      value = param.field_value;
                      unit = param.unit || '';
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
                      {value} {unit}
                    </td>
                  );
                })}
                {visibleColumns.notes !== false && (
                  <td style={styles.tdNotes}>{result.notes || '-'}</td>
                )}
                {visibleColumns.actions !== false && (
                  <td style={styles.tdActions}>
                    <button onClick={() => onEdit(result)} style={styles.editButton}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(result.id)} style={styles.deleteButton}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  tableWrapper: { overflow: 'hidden' },
  dataTable: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    fontSize: '14px',
    tableLayout: 'fixed'
  },
  th: { 
    padding: '10px 8px', 
    textAlign: 'left', 
    backgroundColor: '#f8f9fa', 
    borderBottom: '2px solid #dee2e6', 
    fontWeight: 'bold',
    fontSize: '12px',
    wordBreak: 'break-word',
    maxWidth: '150px'
  },
  thCheckbox: { 
    padding: '10px 8px', 
    textAlign: 'center', 
    backgroundColor: '#f8f9fa', 
    borderBottom: '2px solid #dee2e6', 
    width: '40px' 
  },
  td: { 
    padding: '8px 8px', 
    borderBottom: '1px solid #dee2e6',
    fontSize: '12px',
    wordBreak: 'break-word',
    maxWidth: '150px'
  },
  tdCheckbox: { 
    padding: '8px 8px', 
    borderBottom: '1px solid #dee2e6', 
    textAlign: 'center',
    width: '40px'
  },
  tdNotes: { 
    padding: '8px 8px', 
    borderBottom: '1px solid #dee2e6',
    fontSize: '12px',
    wordBreak: 'break-word',
    maxWidth: '200px'
  },
  tdActions: { 
    padding: '8px 8px', 
    borderBottom: '1px solid #dee2e6',
    whiteSpace: 'nowrap',
    width: '120px'
  },
  tr: { transition: 'background-color 0.2s' },
  trSelected: { backgroundColor: '#e3f2fd' },
  checkbox: { cursor: 'pointer', width: '16px', height: '16px' },
  editButton: { marginRight: '8px', padding: '4px 10px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
  deleteButton: { padding: '4px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }
};

export default TestResultTable;