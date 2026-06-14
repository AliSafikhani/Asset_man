import { useState, useEffect } from 'react';
import API from '../services/api';

function DCSManagement({ assetId, assetName, plantId, onBack }) {
  const [unassignedSignals, setUnassignedSignals] = useState([]);
  const [assignedSignals, setAssignedSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    unit: '',
    min_alarm: '',
    max_alarm: ''
  });

  useEffect(() => {
    loadData();
  }, [assetId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load unassigned signals for this plant
      const unassignedRes = await API.get(`/dcs/signals/unassigned/plant/${plantId}`);
      setUnassignedSignals(unassignedRes.data);
      
      // Load assigned signals for this asset
      const assignedRes = await API.get(`/dcs/asset/${assetId}/mappings`);
      setAssignedSignals(assignedRes.data);
    } catch (error) {
      console.error('Error loading DCS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (signal) => {
    setSelectedSignal(signal);
    setFormData({
      display_name: signal.signal_name,
      unit: signal.unit || '',
      min_alarm: '',
      max_alarm: ''
    });
    setShowAssignForm(true);
  };

  const handleSubmitAssign = async (e) => {
    e.preventDefault();
    try {
      await API.post('/dcs/mappings', {
        asset_id: assetId,
        dcs_signal_id: selectedSignal.id,
        display_name: formData.display_name,
        unit: formData.unit,
        min_alarm: formData.min_alarm ? parseFloat(formData.min_alarm) : null,
        max_alarm: formData.max_alarm ? parseFloat(formData.max_alarm) : null
      });
      alert('Signal assigned successfully!');
      setShowAssignForm(false);
      loadData();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRemove = async (mappingId) => {
    if (window.confirm('Remove this signal from the asset?')) {
      try {
        await API.delete(`/dcs/mappings/${mappingId}`);
        alert('Signal removed successfully!');
        loadData();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading DCS signals...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← Back to Asset</button>
        <h2>📡 DCS Signal Management - {assetName}</h2>
      </div>

      {/* Assigned Signals Section */}
      <div style={styles.section}>
        <h3>✅ Assigned Signals ({assignedSignals.length})</h3>
        {assignedSignals.length === 0 ? (
          <p style={styles.emptyMessage}>No signals assigned yet. Select signals from below.</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>KKS Code</th>
                  <th>Display Name</th>
                  <th>Signal Name</th>
                  <th>Unit</th>
                  <th>Min Alarm</th>
                  <th>Max Alarm</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedSignals.map(mapping => (
                  <tr key={mapping.id}>
                    <td><code>{mapping.signal_details?.kks_code}</code></td>
                    <td><strong>{mapping.display_name}</strong></td>
                    <td>{mapping.signal_details?.signal_name}</td>
                    <td>{mapping.unit || mapping.signal_details?.unit || '-'}</td>
                    <td>{mapping.min_alarm || '-'}</td>
                    <td>{mapping.max_alarm || '-'}</td>
                    <td>
                      <button onClick={() => handleRemove(mapping.id)} style={styles.removeButton}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Signals Section */}
      <div style={styles.section}>
        <h3>📋 Available Signals ({unassignedSignals.length})</h3>
        {unassignedSignals.length === 0 ? (
          <p style={styles.emptyMessage}>All signals have been assigned.</p>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>KKS Code</th>
                  <th>Signal Name</th>
                  <th>Unit</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unassignedSignals.map(signal => (
                  <tr key={signal.id}>
                    <td><code>{signal.kks_code}</code></td>
                    <td>{signal.signal_name}</td>
                    <td>{signal.unit || '-'}</td>
                    <td>{signal.description || '-'}</td>
                    <td>
                      <button onClick={() => handleAssign(signal)} style={styles.assignButton}>Assign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Form Modal */}
      {showAssignForm && selectedSignal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Assign Signal: {selectedSignal.kks_code}</h3>
            <form onSubmit={handleSubmitAssign}>
              <label>Display Name *</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                required
                style={styles.input}
              />
              
              <label>Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder={selectedSignal.unit || 'e.g., MW, kV, °C'}
                style={styles.input}
              />
              
              <label>Min Alarm Threshold (Optional)</label>
              <input
                type="number"
                step="any"
                value={formData.min_alarm}
                onChange={(e) => setFormData({...formData, min_alarm: e.target.value})}
                placeholder="Minimum value for alarm"
                style={styles.input}
              />
              
              <label>Max Alarm Threshold (Optional)</label>
              <input
                type="number"
                step="any"
                value={formData.max_alarm}
                onChange={(e) => setFormData({...formData, max_alarm: e.target.value})}
                placeholder="Maximum value for alarm"
                style={styles.input}
              />
              
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveButton}>Assign</button>
                <button type="button" onClick={() => setShowAssignForm(false)} style={styles.cancelButton}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  backButton: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  section: { background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  emptyMessage: { textAlign: 'center', padding: '40px', color: '#666' },
  assignButton: { padding: '5px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  removeButton: { padding: '5px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '450px' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' },
  modalButtons: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveButton: { padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default DCSManagement;
