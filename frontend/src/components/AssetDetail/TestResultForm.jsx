// frontend/src/components/AssetDetail/TestResultForm.jsx

import React, { useState } from 'react';

const TestResultForm = ({ 
  editingResult, 
  selectedTestTypeName, 
  testFields, 
  testFormData, 
  setTestFormData, 
  onSubmit, 
  onCancel,
  isSubmitting = false
}) => {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setTestFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!testFormData.test_date) {
      newErrors.test_date = 'Test Date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(e);
    }
  };

  const gasFields = testFields.filter(f => 
    ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2', 'tdcg', 'sample_temp'].includes(f.field_name)
  );

  const otherFields = testFields.filter(f => 
    !['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2', 'tdcg', 'sample_temp'].includes(f.field_name)
  );

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>✏️</span>
            <h2 style={styles.headerTitle}>
              {editingResult ? 'Edit Test Result' : 'Add Test Result'}
            </h2>
            <span style={styles.testTypeBadge}>{selectedTestTypeName}</span>
          </div>
          <button style={styles.closeButton} onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Test Date */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Test Date <span style={styles.required}>*</span>
              </label>
              <input
                type="date"
                value={testFormData.test_date || ''}
                onChange={(e) => handleChange('test_date', e.target.value)}
                style={{
                  ...styles.input,
                  ...(errors.test_date ? styles.inputError : {})
                }}
              />
              {errors.test_date && <span style={styles.errorText}>{errors.test_date}</span>}
            </div>

            {/* Laboratory Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Laboratory Name</label>
              <input
                type="text"
                value={testFormData.lab_name || ''}
                onChange={(e) => handleChange('lab_name', e.target.value)}
                style={styles.input}
                placeholder="Enter lab name"
              />
            </div>
          </div>

          {/* Gas Values Section */}
          {gasFields.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>🧪</span>
                <h3 style={styles.sectionTitle}>Gas Concentrations (ppm)</h3>
              </div>
              <div style={styles.gasGrid}>
                {gasFields.map(field => {
                  const fieldName = field.field_name;
                  const displayName = field.display_name || fieldName.toUpperCase();
                  const value = testFormData[fieldName] || '';
                  
                  return (
                    <div key={field.id} style={styles.gasGroup}>
                      <label style={styles.gasLabel}>
                        {displayName}
                        {field.unit && <span style={styles.unitLabel}>({field.unit})</span>}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => handleChange(fieldName, e.target.value)}
                        style={styles.gasInput}
                        placeholder="0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Fields */}
          {otherFields.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>📋</span>
                <h3 style={styles.sectionTitle}>Additional Information</h3>
              </div>
              <div style={styles.otherGrid}>
                {otherFields.map(field => {
                  const fieldName = field.field_name;
                  const displayName = field.display_name || fieldName.toUpperCase();
                  const value = testFormData[fieldName] || '';
                  
                  if (field.data_type === 'text' || field.data_type === 'string') {
                    return (
                      <div key={field.id} style={styles.formGroup}>
                        <label style={styles.label}>{displayName}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(fieldName, e.target.value)}
                          style={styles.input}
                          placeholder={`Enter ${displayName.toLowerCase()}`}
                        />
                      </div>
                    );
                  } else if (field.data_type === 'number') {
                    return (
                      <div key={field.id} style={styles.formGroup}>
                        <label style={styles.label}>
                          {displayName}
                          {field.unit && <span style={styles.unitLabel}>({field.unit})</span>}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={value}
                          onChange={(e) => handleChange(fieldName, e.target.value)}
                          style={styles.input}
                          placeholder="0"
                        />
                      </div>
                    );
                  } else if (field.data_type === 'boolean') {
                    return (
                      <div key={field.id} style={styles.formGroup}>
                        <label style={styles.label}>{displayName}</label>
                        <select
                          value={value}
                          onChange={(e) => handleChange(fieldName, e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Select</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>📝</span>
              <h3 style={styles.sectionTitle}>Notes & Remarks</h3>
            </div>
            <textarea
              value={testFormData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              style={styles.textarea}
              placeholder="Add any additional notes or remarks..."
              rows={3}
            />
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onCancel} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={styles.submitButton}>
              {isSubmitting ? '⏳ Saving...' : editingResult ? '💾 Update' : '💾 Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '800px',
    width: '95%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexShrink: 0
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  headerIcon: {
    fontSize: '24px'
  },
  headerTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e'
  },
  testTypeBadge: {
    padding: '4px 14px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    ':hover': {
      background: '#f0f0f0',
      color: '#333'
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#555'
  },
  required: {
    color: '#f44336'
  },
  unitLabel: {
    fontSize: '11px',
    color: '#999',
    marginLeft: '4px',
    fontWeight: '400'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box'
  },
  inputError: {
    borderColor: '#f44336'
  },
  errorText: {
    fontSize: '12px',
    color: '#f44336',
    marginTop: '4px'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white'
  },
  section: {
    border: '1px solid #eee',
    borderRadius: '12px',
    padding: '16px',
    background: '#fafafa'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  sectionIcon: {
    fontSize: '18px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  gasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px'
  },
  gasGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  gasLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#555'
  },
  gasInput: {
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white'
  },
  otherGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #eee',
    flexShrink: 0
  },
  cancelButton: {
    padding: '10px 24px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    transition: 'all 0.2s',
    ':hover': {
      background: '#e0e0e0'
    }
  },
  submitButton: {
    padding: '10px 28px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    ':hover:not(:disabled)': {
      background: '#43A047',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(76,175,80,0.4)'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  }
};

export default TestResultForm;