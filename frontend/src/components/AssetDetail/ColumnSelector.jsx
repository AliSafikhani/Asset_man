// ColumnSelector.jsx
import React from 'react';

// Fields to exclude from the column selector
const EXCLUDED_FIELDS = ['laboratory_name', 'sample_temp'];

const ColumnSelector = ({ 
  visibleColumns, 
  testFields, 
  onToggle, 
  onClose,
  onShowAll,
  onShowDefault
}) => {
  // Double filter to ensure duplicates are removed
  const filteredFields = testFields.filter(field => !EXCLUDED_FIELDS.includes(field.field_name));

  return (
    <div style={styles.columnSelector}>
      <div style={styles.columnSelectorHeader}>
        <span>Select Columns to Display</span>
        <button onClick={onClose} style={styles.closeSelectorButton}>✕</button>
      </div>
      <div style={styles.columnSelectorGrid}>
        <label style={styles.columnSelectorItem}>
          <input
            type="checkbox"
            checked={visibleColumns.checkbox !== false}
            onChange={() => onToggle('checkbox')}
          />
          Select All
        </label>
        <label style={styles.columnSelectorItem}>
          <input
            type="checkbox"
            checked={visibleColumns.test_date !== false}
            onChange={() => onToggle('test_date')}
          />
          Test Date
        </label>
        {/* COMMENT OUT OR REMOVE the Lab Name section to completely hide it */}
        {/* <label style={styles.columnSelectorItem}>
          <input
            type="checkbox"
            checked={visibleColumns.lab_name !== false}
            onChange={() => onToggle('lab_name')}
          />
          Lab Name
        </label> */}
        {filteredFields.map(field => (
          <label key={field.id} style={styles.columnSelectorItem}>
            <input
              type="checkbox"
              checked={visibleColumns[field.field_name] !== false}
              onChange={() => onToggle(field.field_name)}
            />
            {field.display_name}
          </label>
        ))}
        <label style={styles.columnSelectorItem}>
          <input
            type="checkbox"
            checked={visibleColumns.notes !== false}
            onChange={() => onToggle('notes')}
          />
          Notes
        </label>
        <label style={styles.columnSelectorItem}>
          <input
            type="checkbox"
            checked={visibleColumns.actions !== false}
            onChange={() => onToggle('actions')}
          />
          Actions
        </label>
      </div>
      <div style={styles.columnSelectorFooter}>
        <button onClick={onShowAll} style={styles.selectorActionButton}>
          Show All
        </button>
        <button onClick={onShowDefault} style={styles.selectorActionButton}>
          Show Default (Gases)
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