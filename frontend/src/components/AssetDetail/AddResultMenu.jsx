// frontend/src/components/AssetDetail/AddResultMenu.jsx

import React, { useState } from 'react';
import MultiRowTable from './MultiRowTable';
import ExcelImportModal from './ExcelImportModal';
import PDFImportModal from './PDFImportModal';
import TestResultForm from './TestResultForm';
import API from '../../services/api';

const AddResultMenu = ({ assetId, testTypeId, testFields, onClose, onSuccess }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [singleFormData, setSingleFormData] = useState({
    test_date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  const options = [
    { id: 'single', title: '✏️ Manual Single', description: 'Enter one sample at a time', icon: '📝' },
    { id: 'table', title: '📋 Table Entry', description: 'Enter up to 10 samples with copy-paste', icon: '📊' },
    { id: 'excel', title: '📊 Excel Import', description: 'Upload Excel file with multiple samples', icon: '📈' },
    { id: 'pdf', title: '📄 PDF Import', description: 'Upload PDF report and auto-extract data', icon: '📑' }
  ];

  const handleOptionClick = (optionId) => {
    setSelectedOption(optionId);
  };

  const handleBack = () => {
    setSelectedOption(null);
    setSingleFormData({ test_date: new Date().toISOString().split('T')[0] });
  };

  const handleSuccess = () => {
    onSuccess();
  };

  // Handle single form submission
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const parameters = testFields.map(field => {
        const value = singleFormData[field.field_name];
        return {
          field_name: field.field_name,
          field_value: field.data_type === 'number' ? parseFloat(value) || null : null,
          field_value_text: field.data_type === 'text' ? value : null,
          field_value_date: field.data_type === 'date' ? value : null,
          field_value_boolean: field.data_type === 'boolean' ? (value === 'true') : null,
          unit: field.unit
        };
      });

      const testData = {
        asset_id: parseInt(assetId),
        test_type_id: parseInt(testTypeId),
        test_date: singleFormData.test_date,
        lab_name: singleFormData.lab_name || null,
        notes: singleFormData.notes || null,
        parameters: parameters
      };

      const response = await API.post('/test-results/', testData);
      
      if (response.status === 200 || response.status === 201) {
        alert('Test result added successfully!');
        handleSuccess();
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle table entry success
  const handleTableSuccess = (data) => {
    console.log('✅ Table data received:', data);
    handleSuccess();
  };

  // Show Manual Single form
  if (selectedOption === 'single') {
    return (
      <TestResultForm
        editingResult={null}
        selectedTestTypeName="DGA"
        testFields={testFields}
        testFormData={singleFormData}
        setTestFormData={setSingleFormData}
        onSubmit={handleSingleSubmit}
        onCancel={handleBack}
      />
    );
  }

  // Show Table Entry
  if (selectedOption === 'table') {
    return (
      <MultiRowTable
        assetId={assetId}
        testTypeId={testTypeId}
        onBack={handleBack}
        onCancel={onClose}
        onSuccess={handleTableSuccess}
      />
    );
  }

  // Show Excel Import
  if (selectedOption === 'excel') {
    return (
      <ExcelImportModal
        assetId={assetId}
        testTypeId={testTypeId}
        onBack={handleBack}
        onCancel={onClose}
        onSuccess={handleSuccess}
      />
    );
  }

  // Show PDF Import
  if (selectedOption === 'pdf') {
    return (
      <PDFImportModal
        assetId={assetId}
        testTypeId={testTypeId}
        onBack={handleBack}
        onCancel={onClose}
        onSuccess={handleSuccess}
      />
    );
  }

  // DEFAULT: Show menu
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>📊 Add Test Results</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        <p style={styles.subtitle}>Select how you want to add test results:</p>
        <div style={styles.optionsGrid}>
          {options.map((option) => (
            <div
              key={option.id}
              style={styles.optionCard}
              onClick={() => handleOptionClick(option.id)}
            >
              <div style={styles.optionIcon}>{option.icon}</div>
              <h3>{option.title}</h3>
              <p>{option.description}</p>
            </div>
          ))}
        </div>
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
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '700px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px',
    fontSize: '14px'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  optionCard: {
    padding: '20px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  },
  optionIcon: {
    fontSize: '36px',
    marginBottom: '12px',
    display: 'block'
  }
};

export default AddResultMenu;