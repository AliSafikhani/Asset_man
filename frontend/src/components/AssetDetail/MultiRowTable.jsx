// frontend/src/components/AssetDetail/MultiRowTable.jsx

import React, { useState } from 'react';
import API from '../../services/api';

const MultiRowTable = ({ assetId, testTypeId, onBack, onCancel, onSuccess }) => {
  const [rows, setRows] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

      console.log('📤 Submitting batch data:', batchData);

      const response = await API.post('/test-results/batch', batchData);
      
      console.log('📥 Batch response:', response.data);
      
      if (response.data.success > 0) {
        // Pass the API response to parent
        onSuccess(response.data);
      } else {
        setError('No samples were inserted. Please check your data.');
      }
    } catch (err) {
      console.error('❌ Batch insert error:', err);
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
          <h2>📋 Multi-Row Table Entry</h2>
          <button style={styles.closeButton} onClick={onCancel}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.controls}>
          <div style={styles.rowControl}>
            <label>Number of rows (max 10):</label>
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
            💡 Copy from Excel and paste into columns
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Date</th>
                {gasFields.map(gas => (
                  <th key={gas} style={{ minWidth: '65px' }}>{gas.toUpperCase()}</th>
                ))}
                <th>Temp</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample, index) => (
                <tr key={sample.id}>
                  <td style={styles.rowNumber}>{sample.id}</td>
                  <td>
                    <input
                      type="date"
                      value={sample.date}
                      onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                      style={styles.cellInput}
                    />
                  </td>
                  {gasFields.map(gas => (
                    <td key={gas}>
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
                  <td>
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
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '12px 16px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  rowControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  rowInput: {
    width: '60px',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    textAlign: 'center'
  },
  tip: {
    fontSize: '13px',
    color: '#666',
    flex: 1,
    textAlign: 'right'
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '16px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  cellInput: {
    width: '100%',
    padding: '4px 6px',
    border: '1px solid #e0e0e0',
    borderRadius: '3px',
    fontSize: '13px'
  },
  cellInputSmall: {
    width: '60px',
    padding: '4px 6px',
    border: '1px solid #e0e0e0',
    borderRadius: '3px',
    fontSize: '13px',
    textAlign: 'center'
  },
  rowNumber: {
    fontWeight: '600',
    color: '#888',
    fontSize: '12px',
    textAlign: 'center'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0'
  },
  backButton: {
    padding: '8px 16px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
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

export default MultiRowTable;