// frontend/src/components/AssetDetail/PDFImportModal.jsx

import React, { useState } from 'react';
import API from '../../services/api';

const PDFImportModal = ({ assetId, testTypeId, onBack, onCancel, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [step, setStep] = useState('upload');
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

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
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await API.post('/upload/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success && response.data.samples.length > 0) {
        const samplesWithSelection = response.data.samples.map((s, index) => ({
          ...s,
          id: index + 1,
          selected: true,
          temp: s.temp || 61
        }));
        setSamples(samplesWithSelection);
        setSelectedCount(samplesWithSelection.length);
        setStep('preview');
      } else {
        setError('No valid DGA data found in the PDF. Please check the file format.');
      }
    } catch (err) {
      console.error('PDF upload error:', err);
      setError(err.response?.data?.detail || 'Error processing PDF file');
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
    setSelectedCount(updated.filter(s => s.selected !== false).length);
  };

  const handleSelectAll = () => {
    const allSelected = samples.every(s => s.selected !== false);
    const updated = samples.map(s => ({ ...s, selected: !allSelected }));
    setSamples(updated);
    setSelectedCount(updated.filter(s => s.selected !== false).length);
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

      // const response = await API.post('/test-results/batch', batchData);
      const response = await API.post('/test-results/batch', batchData);

      
      if (response.data.success > 0) {
        onSuccess(response.data);
      } else {
        setError('No samples were inserted. Please check your data.');
      }
    } catch (err) {
      console.error('Batch import error:', err);
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
            <div style={styles.headerLeft}>
              <span style={styles.headerIcon}>📄</span>
              <h2 style={styles.headerTitle}>Import from PDF</h2>
              <span style={styles.headerBadge}>Auto-Extract</span>
            </div>
            <button style={styles.closeButton} onClick={onCancel}>✕</button>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}

          <div 
            style={file ? styles.uploadAreaWithFile : styles.uploadArea}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div style={styles.uploadIcon}>📄</div>
            <h3 style={styles.uploadTitle}>Upload PDF Report</h3>
            <p style={styles.uploadText}>Drag & drop your PDF file here, or click to browse</p>
            <p style={styles.uploadFormat}>Supported format: <strong>.pdf</strong></p>
            <p style={styles.uploadNote}>💡 The system will automatically extract DGA data from the PDF</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              style={styles.fileInput}
              id="pdfFileInput"
            />
            <label htmlFor="pdfFileInput" style={styles.browseButton}>
              📂 Browse Files
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
                  opacity: (!file || loading) ? 0.6 : 1,
                  cursor: (!file || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Processing PDF...' : '📤 Extract Data'}
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
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>📄</span>
            <h2 style={styles.headerTitle}>Preview Extracted Data</h2>
            <span style={styles.headerBadge}>{samples.length} Samples</span>
          </div>
          <button style={styles.closeButton} onClick={onCancel}>✕</button>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.previewHeader}>
          <div style={styles.previewInfo}>
            <span style={styles.previewBadge}>✅ {samples.length} Samples Found</span>
            <span style={styles.previewCount}>📌 {selectedCount} Selected</span>
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
                      checked={samples.every(s => s.selected !== false) && samples.length > 0} 
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

        <div style={styles.summaryBar}>
          <span>📊 {samples.length} total samples</span>
          <span>✅ {selectedCount} selected for import</span>
          <span>📅 {samples.filter(s => s.date).length} with valid dates</span>
        </div>

        <div style={styles.footer}>
          <button onClick={() => setStep('upload')} style={styles.backButton}>← Back</button>
          <div style={styles.actions}>
            <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
            <button onClick={handleConfirm} disabled={importing || selectedCount === 0} style={{
              ...styles.submitButton,
              opacity: (importing || selectedCount === 0) ? 0.6 : 1,
              cursor: (importing || selectedCount === 0) ? 'not-allowed' : 'pointer'
            }}>
              {importing ? '⏳ Importing...' : `✅ Import ${selectedCount} Samples`}
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
    padding: '28px',
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
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  headerIcon: {
    fontSize: '28px'
  },
  headerTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e'
  },
  headerBadge: {
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
  uploadAreaWithFile: {
    textAlign: 'center',
    padding: '40px 20px',
    border: '2px solid #4CAF50',
    borderRadius: '16px',
    backgroundColor: '#f1f8e9',
    transition: 'all 0.3s ease',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadIcon: {
    fontSize: '56px',
    marginBottom: '12px'
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
    color: '#666',
    fontSize: '13px',
    marginBottom: '4px'
  },
  uploadNote: {
    color: '#999',
    fontSize: '13px',
    marginBottom: '20px'
  },
  fileInput: {
    display: 'none'
  },
  browseButton: {
    padding: '12px 32px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    ':hover': {
      background: '#5a6fd6',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 16px rgba(102,126,234,0.4)'
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
    background: '#9C27B0',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    ':hover:not(:disabled)': {
      background: '#7B1FA2',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
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
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: '8px'
  },
  previewInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  previewBadge: {
    padding: '6px 14px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500'
  },
  previewCount: {
    padding: '6px 14px',
    background: '#e3f2fd',
    color: '#1565c0',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500'
  },
  previewHint: {
    fontSize: '13px',
    color: '#888'
  },
  selectAllButton: {
    padding: '6px 18px',
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
    maxHeight: '350px'
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
  summaryBar: {
    display: 'flex',
    gap: '24px',
    padding: '10px 16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginTop: '12px',
    fontSize: '13px',
    color: '#555',
    flexShrink: 0,
    flexWrap: 'wrap'
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

export default PDFImportModal;