// frontend/src/components/AssetDetail/ColumnSelector.jsx
import React from 'react';

const ColumnSelector = ({
  visibleColumns,
  testFields,
  onToggle,
  onClose,
  onShowAll,
  onShowDefault,
}) => {
  // Build list of all column keys
  const allKeys = [
    'checkbox',
    'test_date',
    'lab_name',
    'notes',
    'actions',
    ...testFields.map(f => f.field_name),
  ];

  const getDisplayName = (key) => {
    const special = {
      checkbox: 'Select All',
      test_date: 'Test Date',
      notes: 'Notes',
      lab_name: 'Laboratory Name',
      actions: 'Actions',
    };
    if (special[key]) return special[key];
    const field = testFields.find(f => f.field_name === key);
    return field ? field.display_name : key;
  };

  return (
    <div style={styles.columnSelector}>
      <div style={styles.header}>
        <span style={styles.title}>Select Columns to Display</span>
        <button onClick={onClose} style={styles.closeButton}>✕</button>
      </div>
      <div style={styles.grid}>
        {allKeys.map(key => (
          <label key={key} style={styles.item}>
            <input
              type="checkbox"
              checked={visibleColumns[key] !== false}
              onChange={() => onToggle(key)}
            />
            {getDisplayName(key)}
          </label>
        ))}
      </div>
      <div style={styles.footer}>
        <button onClick={onShowAll} style={styles.footerButton}>Show All</button>
        <button onClick={onShowDefault} style={styles.footerButton}>Show Default</button>
      </div>
    </div>
  );
};

const styles = {
  columnSelector: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontWeight: '600',
    color: '#0f172a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#475569',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: '#1e293b',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0',
  },
  footerButton: {
    padding: '4px 12px',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#1e293b',
  },
};

export default ColumnSelector;