// frontend/src/components/AssetDetail/ExcelImportModal.jsx

import React, { useState } from 'react';
import API from '../../services/api';

const ExcelImportModal = ({ assetId, testTypeId, onBack, onCancel, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [step, setStep] = useState('upload'); // 'upload' or 'preview'
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await API.post('/upload/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success && response.data.samples.length > 0) {
        const samplesWithSelection = response.data.samples.map(s => ({
          ...s,
          selected: true,
          temp: s.temp || 61
        }));
        setSamples(samplesWithSelection);
        setStep('preview');
      } else {
        setError('No valid DGA data found in the file.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (index, field, value) => {
    const updated = [...samples];
    updated[index][field] = value;
    setSamples(updated);
  };

  const handleToggleSelect = (index) => {
    const updated = [...samples];
    updated[index].selected = !updated[index].selected;
    setSamples(updated);
  };

  const handleSelectAll = () => {
    const allSelected = samples.every(s => s.selected !== false);
    const updated = samples.map(s => ({ ...s, selected: !allSelected }));
    setSamples(updated);
  };

  const handleConfirm = async () => {
    const selectedSamples = samples.filter(s => s.selected !== false);
    if (selectedSamples.length === 0) {
      setError('Please select at least one sample to import.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const batchData = {
        samples: selectedSamples.map(s => ({
          asset_id: parseInt(assetId),
          test_type_id: parseInt(testTypeId),
          test_date: s.date,
          lab_name: 'Default Lab',
          notes: '',
          parameters: [
            { field_name: 'h2', field_value: parseFloat(s.h2) || 0 },
            { field_name: 'ch4', field_value: parseFloat(s.ch4) || 0 },
            { field_name: 'c2h2', field_value: parseFloat(s.c2h2) || 0 },
            { field_name: 'c2h4', field_value: parseFloat(s.c2h4) || 0 },
            { field_name: 'c2h6', field_value: parseFloat(s.c2h6) || 0 },
            { field_name: 'co', field_value: parseFloat(s.co) || 0 },
            { field_name: 'co2', field_value: parseFloat(s.co2) || 0 },
            { field_name: 'o2', field_value: parseFloat(s.o2) || 0 },
            { field_name: 'n2', field_value: parseFloat(s.n2) || 0 },
            { field_name: 'sample_temp', field_value: parseFloat(s.temp) || 61 }
          ]
        }))
      };

      const response = await API.post('/test-results/batch', batchData);
      
      if (response.data.success > 0) {
        onSuccess(response.data);
      } else {
        setError('No samples were inserted. Please check your data.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error importing samples');
    } finally {
      setImporting(false);
    }
  };

  // Upload step
  if (step === 'upload') {
    return (
      <div style={styles.overlay} onClick={onCancel}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h2>📊 Import from Excel</h2>
            <button style={styles.closeButton} onClick={onCancel}>✕</button>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.uploadArea}>
            <div style={styles.uploadIcon}>📁</div>
            <h3>Upload Excel File</h3>
            <p style={styles.uploadText}>Supported formats: .xlsx, .xls</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={styles.fileInput}
            />
            {file && (
              <div style={styles.fileInfo}>
                ✅ {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <div style={styles.uploadActions}>
              <button onClick={onBack} style={styles.backButton}>← Back</button>
              <button 
                onClick={handleUpload} 
                disabled={!file || loading}
                style={{
                  ...styles.uploadButton,
                  opacity: (!file || loading) ? 0.6 : 1
                }}
              >
                {loading ? '⏳ Uploading...' : '📤 Upload & Preview'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Preview step
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>📊 Preview Excel Data</h2>
          <button style={styles.closeButton} onClick={onCancel}>✕</button>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.previewInfo}>
          <span>✅ Found {samples.length} samples from Excel</span>
          <button onClick={handleSelectAll} style={styles.selectAllButton}>
            {samples.every(s => s.selected !== false) ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input type="checkbox" checked={samples.every(s => s.selected !== false)} onChange={handleSelectAll} />
                </th>
                <th>#</th>
                <th>Date</th>
                <th>H2</th>
                <th>CH4</th>
                <th>C2H2</th>
                <th>C2H4</th>
                <th>C2H6</th>
                <th>CO</th>
                <th>CO2</th>
                <th>O2</th>
                <th>N2</th>
                <th>Temp</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample, index) => (
                <tr key={sample.id} style={sample.selected === false ? styles.rowDeselected : {}}>
                  <td>
                    <input
                      type="checkbox"
                      checked={sample.selected !== false}
                      onChange={() => handleToggleSelect(index)}
                    />
                  </td>
                  <td>{sample.id}</td>
                  <td>
                    <input
                      type="date"
                      value={sample.date}
                      onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                      style={styles.cellInput}
                    />
                  </td>
                  {['h2','ch4','c2h2','c2h4','c2h6','co','co2','o2','n2'].map(field => (
                    <td key={field}>
                      <input
                        type="text"
                        value={sample[field] || ''}
                        onChange={(e) => handleCellChange(index, field, e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>
                  ))}
                  <td>
                    <input
                      type="text"
                      value={sample.temp || 61}
                      onChange={(e) => handleCellChange(index, 'temp', e.target.value)}
                      style={styles.cellInput}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.footer}>
          <button onClick={() => setStep('upload')} style={styles.backButton}>← Back</button>
          <div style={styles.actions}>
            <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
            <button onClick={handleConfirm} disabled={importing} style={styles.submitButton}>
              {importing ? '⏳ Importing...' : '✅ Import Selected'}
            </button>
          </div>
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
    padding: '24px',
    maxWidth: '95vw',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  error: {
    padding: '12px 16px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #f44336'
  },
  uploadArea: {
    textAlign: 'center',
    padding: '40px 20px',
    border: '2px dashed #ddd',
    borderRadius: '12px'
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  uploadText: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '16px'
  },
  fileInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
    maxWidth: '300px'
  },
  fileInfo: {
    marginTop: '12px',
    color: '#4CAF50',
    fontWeight: '500'
  },
  uploadActions: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  backButton: {
    padding: '8px 20px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  uploadButton: {
    padding: '8px 24px',
    background: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  previewInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '8px 12px',
    background: '#e8f5e9',
    borderRadius: '6px'
  },
  selectAllButton: {
    padding: '4px 12px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  cellInput: {
    width: '65px',
    padding: '4px 6px',
    border: '1px solid #e0e0e0',
    borderRadius: '3px',
    fontSize: '12px'
  },
  rowDeselected: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0'
  },
  actions: {
    display: 'flex',
    gap: '10px'
  },
  cancelButton: {
    padding: '8px 20px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '8px 24px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  }
};

export default ExcelImportModal;