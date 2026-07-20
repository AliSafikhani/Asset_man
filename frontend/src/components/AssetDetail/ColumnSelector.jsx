import React from 'react';

const ColumnSelector = ({ 
  visibleColumns, 
  testFields, 
  onToggle, 
  onClose,
  onShowAll,
  onShowDefault
}) => {
  // ---- Build the complete list of column keys ----
  // 1. Special columns (always present)
  const specialKeys = [
    'checkbox',
    'test_date',
    'lab_name',
    'notes',
    'actions',
  ];
  // Add IEEE/IEC status only if they exist in visibleColumns (i.e., DGA test type)
  if (visibleColumns.ieee_status !== undefined) specialKeys.push('ieee_status');
  if (visibleColumns.iec_status !== undefined) specialKeys.push('iec_status');

  // 2. Parameter fields (all from testFields, no exclusions)
  const paramKeys = testFields.map(field => field.field_name);

  // 3. Combine and remove duplicates (just in case)
  const allKeys = [...new Set([...specialKeys, ...paramKeys])];

  // ---- Helper to get display name ----
  const getDisplayName = (key) => {
    const specialNames = {
      checkbox: 'Select All',
      test_date: 'Test Date',
      lab_name: 'Laboratory Name',
      notes: 'Notes',
      actions: 'Actions',
      ieee_status: 'IEEE Status',
      iec_status: 'IEC Status',
    };
    if (specialNames[key]) return specialNames[key];
    const field = testFields.find(f => f.field_name === key);
    return field ? field.display_name : key;
  };

  return (
    <div style={styles.columnSelector}>
      <div style={styles.columnSelectorHeader}>
        <span>Select Columns to Display</span>
        <button onClick={onClose} style={styles.closeSelectorButton}>✕</button>
      </div>
      <div style={styles.columnSelectorGrid}>
        {allKeys.map(key => (
          <label key={key} style={styles.columnSelectorItem}>
            <input
              type="checkbox"
              checked={visibleColumns[key] !== false}
              onChange={() => onToggle(key)}
            />
            {getDisplayName(key)}
          </label>
        ))}
      </div>
      <div style={styles.columnSelectorFooter}>
        <button onClick={onShowAll} style={styles.selectorActionButton}>
          Show All
        </button>
        <button onClick={onShowDefault} style={styles.selectorActionButton}>
          Show Default
        </button>
      </div>
    </div>
  );
};

const styles = {
  columnSelector: { 
    backgroundColor: '#f8f9fa', 
    border: '1px solid #dee2e6', 
    borderRadius: '8px', 
    padding: '15px', 
    marginBottom: '20px'
  },
  columnSelectorHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  closeSelectorButton: { 
    background: 'none', 
    border: 'none', 
    fontSize: '20px', 
    cursor: 'pointer', 
    color: '#666' 
  },
  columnSelectorGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
    gap: '8px' 
  },
  columnSelectorItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontSize: '14px',
    cursor: 'pointer'
  },
  columnSelectorFooter: { 
    display: 'flex', 
    gap: '10px', 
    marginTop: '15px', 
    paddingTop: '15px', 
    borderTop: '1px solid #dee2e6' 
  },
  selectorActionButton: { 
    padding: '6px 12px', 
    backgroundColor: '#6c757d', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontSize: '12px' 
  }
};

export default ColumnSelector;