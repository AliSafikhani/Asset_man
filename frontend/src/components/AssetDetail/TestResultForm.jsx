// TestResultForm.jsx
import React from 'react';

const TestResultForm = ({ 
  editingResult, 
  selectedTestTypeName, 
  testFields, 
  testFormData, 
  setTestFormData, 
  onSubmit, 
  onCancel 
}) => {
  const renderTestField = (field) => {
    const value = testFormData[field.field_name] || '';
    switch(field.data_type) {
      case 'number':
        return (
          <input 
            key={field.id} 
            type="number" 
            step="any" 
            placeholder={`${field.display_name} (${field.unit || ''})`} 
            value={value} 
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} 
            required={field.is_required} 
            style={styles.input} 
          />
        );
      case 'date':
        return (
          <input 
            key={field.id} 
            type="date" 
            value={value} 
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} 
            required={field.is_required} 
            style={styles.input} 
          />
        );
      case 'select':
        return (
          <select 
            key={field.id} 
            value={value} 
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} 
            required={field.is_required} 
            style={styles.input}
          >
            <option value="">Select {field.display_name}</option>
            {(field.allowed_values || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      default:
        return (
          <input 
            key={field.id} 
            type="text" 
            placeholder={field.display_name} 
            value={value} 
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} 
            required={field.is_required} 
            style={styles.input} 
          />
        );
    }
  };

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2>{editingResult ? 'Edit' : 'Add'} Test Result - {selectedTestTypeName}</h2>
        <form onSubmit={onSubmit}>
          <label style={styles.label}>Test Date *</label>
          <input 
            type="date" 
            value={testFormData.test_date || ''} 
            onChange={(e) => setTestFormData({...testFormData, test_date: e.target.value})} 
            required 
            style={styles.input} 
          />
          
          {testFields.map(field => (
            <div key={field.id}>
              <label style={styles.fieldLabel}>
                {field.display_name} {field.is_required && <span style={{color: 'red'}}>*</span>}
              </label>
              {renderTestField(field)}
            </div>
          ))}
          
          <input 
            type="text" 
            placeholder="Laboratory Name" 
            value={testFormData.lab_name || ''} 
            onChange={(e) => setTestFormData({...testFormData, lab_name: e.target.value})} 
            style={styles.input} 
          />
          <textarea 
            placeholder="Notes / Remarks" 
            value={testFormData.notes || ''} 
            onChange={(e) => setTestFormData({...testFormData, notes: e.target.value})} 
            style={styles.textarea} 
            rows="3" 
          />
          <div style={styles.modalButtons}>
            <button type="submit" style={styles.saveButton}>
              {editingResult ? 'Update' : 'Save'}
            </button>
            <button type="button" onClick={onCancel} style={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  modal: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000 
  },
  modalContent: { 
    backgroundColor: 'white', 
    padding: '30px', 
    borderRadius: '10px', 
    width: '600px', 
    maxHeight: '80vh', 
    overflow: 'auto' 
  },
  input: { 
    width: '100%', 
    padding: '10px', 
    margin: '10px 0', 
    border: '1px solid #ddd', 
    borderRadius: '5px', 
    boxSizing: 'border-box' 
  },
  textarea: { 
    width: '100%', 
    padding: '10px', 
    margin: '10px 0', 
    border: '1px solid #ddd', 
    borderRadius: '5px', 
    boxSizing: 'border-box', 
    fontFamily: 'inherit' 
  },
  label: { 
    fontWeight: 'bold', 
    marginTop: '10px', 
    display: 'block' 
  },
  fieldLabel: { 
    fontSize: '13px', 
    fontWeight: 'bold', 
    marginTop: '10px', 
    display: 'block' 
  },
  modalButtons: { 
    display: 'flex', 
    gap: '10px', 
    marginTop: '20px' 
  },
  saveButton: { 
    padding: '10px 20px', 
    backgroundColor: '#4CAF50', 
    color: 'white', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    flex: 1 
  },
  cancelButton: { 
    padding: '10px 20px', 
    backgroundColor: '#6c757d', 
    color: 'white', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    flex: 1 
  }
};

export default TestResultForm;