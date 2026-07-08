// frontend/src/components/AssetDetail/MultiRowTable.jsx

import React, { useState } from 'react';
import API from '../../services/api';

const MultiRowTable = ({ assetId, testTypeId, onBack, onCancel, onSuccess }) => {
  const [rows, setRows] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [samples, setSamples] = useState(
    Array(5).fill().map((_, i) => ({
      id: i + 1,
      date: new Date().toISOString().split('T')[0],
      h2: '',
      ch4: '',
      c2h2: '',
      c2h4: '',
      c2h6: '',
      co: '',
      co2: '',
      o2: '',
      n2: '',
      temp: '61'
    }))
  );

  const handleRowCountChange = (e) => {
    const newCount = parseInt(e.target.value) || 1;
    setRows(Math.min(10, Math.max(1, newCount)));
    
    const currentCount = samples.length;
    if (newCount > currentCount) {
      const newRows = Array(newCount - currentCount).fill().map((_, i) => ({
        id: currentCount + i + 1,
        date: new Date().toISOString().split('T')[0],
        h2: '',
        ch4: '',
        c2h2: '',
        c2h4: '',
        c2h6: '',
        co: '',
        co2: '',
        o2: '',
        n2: '',
        temp: '61'
      }));
      setSamples([...samples, ...newRows]);
    } else {
      setSamples(samples.slice(0, newCount));
    }
  };

  const handleCellChange = (index, field, value) => {
    const updated = [...samples];
    updated[index][field] = value;
    setSamples(updated);
  };

  const handlePaste = (e, index, field) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const lines = pasteData.split(/\r\n|\n|\r/).filter(line => line.trim());
    
    if (lines.length > 1) {
      const updated = [...samples];
      lines.forEach((value, i) => {
        const targetIndex = index + i;
        if (targetIndex < updated.length) {
          updated[targetIndex][field] = value.trim();
        }
      });
      setSamples(updated);
    } else {
      handleCellChange(index, field, pasteData.trim());
    }
  };

  const handleSubmit = async () => {
    const validSamples = samples.filter(s => s.date && (s.h2 || s.ch4 || s.c2h2 || s.c2h4 || s.c2h6));
    if (validSamples.length === 0) {
      setError('Please fill in at least one sample with a date and gas values.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const batchData = {
        samples: validSamples.map(s => ({
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
        setSuccessMessage(`✅ ${response.data.success} sample(s) inserted successfully!`);
        setTimeout(() => {
          onSuccess(response.data);
        }, 1500);
      } else {
        setError('No samples were inserted. Please check your data.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error inserting samples');
    } finally {
      setLoading(false);
    }
  };

  const gasFields = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2'];

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <span style={styles.headerIcon}>📋</span>
            <h2 style={styles.headerTitle}>Multi-Row Table Entry</h2>
          </div>
          <button style={styles.closeButton} onClick={onCancel}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {successMessage && <div style={styles.success}>{successMessage}</div>}

        <div style={styles.controls}>
          <div style={styles.rowControl}>
            <label style={styles.rowLabel}>Number of rows (max 10):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rows}
              onChange={handleRowCountChange}
              style={styles.rowInput}
            />
          </div>
          <div style={styles.tip}>
            <span style={styles.tipIcon}>💡</span>
            <span>Copy from Excel and paste into columns</span>
          </div>
        </div>

        <div style={styles.tableWrapper}>
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thNumber}>#</th>
                  <th style={styles.thDate}>Date</th>
                  {gasFields.map(gas => (
                    <th key={gas} style={styles.thGas}>{gas.toUpperCase()}</th>
                  ))}
                  <th style={styles.thTemp}>Temp</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample, index) => (
                  <tr key={sample.id} style={styles.tr}>
                    <td style={styles.tdNumber}>{sample.id}</td>
                    <td style={styles.tdDate}>
                      <input
                        type="date"
                        value={sample.date}
                        onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                        style={styles.cellInput}
                      />
                    </td>
                    {gasFields.map(gas => (
                      <td key={gas} style={styles.tdGas}>
                        <input
                          type="text"
                          value={sample[gas]}
                          onChange={(e) => handleCellChange(index, gas, e.target.value)}
                          onPaste={(e) => handlePaste(e, index, gas)}
                          style={styles.cellInput}
                          placeholder="ppm"
                        />
                      </td>
                    ))}
                    <td style={styles.tdTemp}>
                      <input
                        type="text"
                        value={sample.temp}
                        onChange={(e) => handleCellChange(index, 'temp', e.target.value)}
                        style={styles.cellInputSmall}
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
          <button onClick={onBack} style={styles.backButton}>← Back</button>
          <div style={styles.actions}>
            <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading} style={styles.submitButton}>
              {loading ? '⏳ Inserting...' : '✅ Insert All'}
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
    marginBottom: '16px',
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
    marginBottom: '12px',
    border: '1px solid #f44336',
    fontSize: '14px',
    flexShrink: 0
  },
  success: {
    padding: '12px 16px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '8px',
    marginBottom: '12px',
    border: '1px solid #4CAF50',
    fontSize: '14px',
    fontWeight: '500',
    flexShrink: 0
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '12px 16px',
    background: '#f8f9fa',
    borderRadius: '10px',
    flexShrink: 0
  },
  rowControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  rowLabel: {
    fontSize: '14px',
    color: '#555',
    fontWeight: '500'
  },
  rowInput: {
    width: '60px',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center'
  },
  tip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#666',
    flex: 1,
    justifyContent: 'flex-end'
  },
  tipIcon: {
    fontSize: '16px'
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
  thNumber: {
    padding: '10px 8px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: '600',
    fontSize: '12px',
    color: '#555',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    width: '40px'
  },
  thDate: {
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
    minWidth: '120px'
  },
  thGas: {
    padding: '10px 8px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: '600',
    fontSize: '11px',
    color: '#555',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    minWidth: '70px'
  },
  thTemp: {
    padding: '10px 8px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: '600',
    fontSize: '12px',
    color: '#555',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    width: '70px'
  },
  tdNumber: {
    padding: '6px 4px',
    borderBottom: '1px solid #eee',
    textAlign: 'center',
    fontWeight: '600',
    color: '#888',
    fontSize: '12px'
  },
  tdDate: {
    padding: '4px 4px',
    borderBottom: '1px solid #eee'
  },
  tdGas: {
    padding: '4px 4px',
    borderBottom: '1px solid #eee'
  },
  tdTemp: {
    padding: '4px 4px',
    borderBottom: '1px solid #eee',
    textAlign: 'center'
  },
  tr: {
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  cellInput: {
    width: '100%',
    padding: '4px 6px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '13px',
    transition: 'border-color 0.2s',
    background: 'white'
  },
  cellInputSmall: {
    width: '60px',
    padding: '4px 6px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '13px',
    textAlign: 'center'
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

export default MultiRowTable;