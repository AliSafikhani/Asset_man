// frontend/src/components/AssetDetail/ExcelImportModal.jsx
// frontend/src/components/AssetDetail/ExcelImportModal.jsx

import React, { useState } from 'react';
import API from '../../services/api';

const ExcelImportModal = ({ assetId, testTypeId, onBack, onCancel, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [step, setStep] = useState('upload');
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
            <div>
              <span style={styles.headerIcon}>📊</span>
              <h2 style={styles.headerTitle}>Import from Excel</h2>
            </div>
            <button style={styles.closeButton} onClick={onCancel}>✕</button>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}

          <div 
            style={styles.uploadArea}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div style={styles.uploadIcon}>📁</div>
            <h3 style={styles.uploadTitle}>Upload Excel File</h3>
            <p style={styles.uploadText}>Drag & drop your file here, or click to browse</p>
            <p style={styles.uploadFormat}>Supported formats: .xlsx, .xls</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={styles.fileInput}
              id="fileInput"
            />
            <label htmlFor="fileInput" style={styles.browseButton}>
              Browse Files
            </label>
            {file && (
              <div style={styles.fileInfo}>
                <span style={styles.fileIcon}>✅</span>
                <span style={styles.fileName}>{file.name}</span>
                <span style={styles.fileSize}>({(file.size / 1024).toFixed(1)} KB)</span>
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
                {loading ? '⏳ Processing...' : '📤 Upload & Preview'}
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
          <div>
            <span style={styles.headerIcon}>📊</span>
            <h2 style={styles.headerTitle}>Preview Excel Data</h2>
          </div>
          <button style={styles.closeButton} onClick={onCancel}>✕</button>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.previewHeader}>
          <div style={styles.previewInfo}>
            <span style={styles.previewBadge}>✅ {samples.length} Samples Found</span>
            <span style={styles.previewHint}>💡 Edit values directly in the table below</span>
          </div>
          <button onClick={handleSelectAll} style={styles.selectAllButton}>
            {samples.every(s => s.selected !== false) ? '🔽 Deselect All' : '✅ Select All'}
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thCheckbox}>
                    <input 
                      type="checkbox" 
                      checked={samples.every(s => s.selected !== false)} 
                      onChange={handleSelectAll}
                      style={styles.checkbox}
                    />
                  </th>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>H2</th>
                  <th style={styles.th}>CH4</th>
                  <th style={styles.th}>C2H2</th>
                  <th style={styles.th}>C2H4</th>
                  <th style={styles.th}>C2H6</th>
                  <th style={styles.th}>CO</th>
                  <th style={styles.th}>CO2</th>
                  <th style={styles.th}>O2</th>
                  <th style={styles.th}>N2</th>
                  <th style={styles.th}>Temp</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample, index) => (
                  <tr key={sample.id} style={sample.selected === false ? styles.rowDeselected : styles.row}>
                    <td style={styles.tdCheckbox}>
                      <input
                        type="checkbox"
                        checked={sample.selected !== false}
                        onChange={() => handleToggleSelect(index)}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.tdNumber}>{sample.id}</td>
                    <td style={styles.td}>
                      <input
                        type="date"
                        value={sample.date}
                        onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>
                    {['h2','ch4','c2h2','c2h4','c2h6','co','co2','o2','n2'].map(field => (
                      <td key={field} style={styles.td}>
                        <input
                          type="text"
                          value={sample[field] || ''}
                          onChange={(e) => handleCellChange(index, field, e.target.value)}
                          style={styles.cellInput}
                          placeholder="ppm"
                        />
                      </td>
                    ))}
                    <td style={styles.td}>
                      <input
                        type="text"
                        value={sample.temp || 61}
                        onChange={(e) => handleCellChange(index, 'temp', e.target.value)}
                        style={styles.cellInput}
                        placeholder="°C"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

// ... styles continue below
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
    animation: 'fadeIn 0.3s ease'
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '95vw',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexShrink: 0
  },
  headerIcon: {
    fontSize: '24px',
    marginRight: '12px'
  },
  headerTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
    display: 'inline-block'
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
  error: {
    padding: '12px 16px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #f44336',
    fontSize: '14px',
    flexShrink: 0
  },
  uploadArea: {
    textAlign: 'center',
    padding: '48px 20px',
    border: '2px dashed #ddd',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  uploadTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    color: '#333'
  },
  uploadText: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '4px'
  },
  uploadFormat: {
    color: '#aaa',
    fontSize: '13px',
    marginBottom: '20px'
  },
  fileInput: {
    display: 'none'
  },
  browseButton: {
    padding: '10px 28px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    ':hover': {
      background: '#5a6fd6',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
    }
  },
  fileInfo: {
    marginTop: '16px',
    padding: '12px 20px',
    background: '#e8f5e9',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  fileIcon: {
    fontSize: '18px'
  },
  fileName: {
    fontWeight: '500',
    color: '#2e7d32'
  },
  fileSize: {
    color: '#666',
    fontSize: '13px'
  },
  uploadActions: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  },
  backButton: {
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
  uploadButton: {
    padding: '10px 28px',
    background: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    ':hover:not(:disabled)': {
      background: '#f57c00',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(255,152,0,0.4)'
    },
    ':disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexShrink: 0
  },
  previewInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  previewBadge: {
    padding: '6px 14px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500'
  },
  previewHint: {
    fontSize: '13px',
    color: '#888'
  },
  selectAllButton: {
    padding: '6px 16px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    ':hover': {
      background: '#43A047'
    }
  },
  tableWrapper: {
    overflow: 'hidden',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    flex: 1
  },
  tableScroll: {
    overflow: 'auto',
    maxHeight: '400px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    padding: '10px 8px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: '600',
    fontSize: '12px',
    color: '#555',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    whiteSpace: 'nowrap',
    minWidth: '60px'
  },
  thCheckbox: {
    padding: '10px 8px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    width: '40px',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  td: {
    padding: '6px 4px',
    borderBottom: '1px solid #eee'
  },
  tdCheckbox: {
    padding: '6px 4px',
    borderBottom: '1px solid #eee',
    textAlign: 'center'
  },
  tdNumber: {
    padding: '6px 4px',
    borderBottom: '1px solid #eee',
    textAlign: 'center',
    fontWeight: '600',
    color: '#888',
    fontSize: '12px'
  },
  row: {
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  rowDeselected: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 0.7
    }
  },
  checkbox: {
    cursor: 'pointer',
    width: '16px',
    height: '16px',
    accentColor: '#4CAF50'
  },
  cellInput: {
    width: '100%',
    minWidth: '50px',
    padding: '4px 6px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '13px',
    transition: 'border-color 0.2s',
    background: 'white'
  },
  cellInputFocus: {
    outline: 'none',
    borderColor: '#667eea',
    boxShadow: '0 0 0 3px rgba(102,126,234,0.1)'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0',
    marginTop: '16px',
    flexShrink: 0
  },
  actions: {
    display: 'flex',
    gap: '10px'
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


export default ExcelImportModal;