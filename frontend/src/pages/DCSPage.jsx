import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

function DCSPage() {
  const navigate = useNavigate();
  
  // Hierarchy state
  const [companies, setCompanies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // Selected items
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // DCS data
  const [unassignedSignals, setUnassignedSignals] = useState([]);
  const [assignedSignals, setAssignedSignals] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    unit: '',
    min_alarm: '',
    max_alarm: ''
  });
  
  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);
  
  // Load plants when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      loadPlants(selectedCompanyId);
      setSelectedPlantId('');
      setSelectedAssetId('');
      setSelectedAsset(null);
    } else {
      setPlants([]);
    }
  }, [selectedCompanyId]);
  
  // Load assets when plant changes
  useEffect(() => {
    if (selectedPlantId) {
      loadAssets(selectedPlantId);
      setSelectedAssetId('');
      setSelectedAsset(null);
    } else {
      setAssets([]);
    }
  }, [selectedPlantId]);
  
  // Load DCS data when asset changes
  useEffect(() => {
    if (selectedAssetId) {
      loadUnassignedSignals();
      loadAssignedSignals();
    }
  }, [selectedAssetId]);

  const loadCompanies = async () => {
    try {
      const res = await API.get('/companies');
      setCompanies(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load companies');
    }
  };

  const loadPlants = async (companyId) => {
    try {
      const res = await API.get(`/sites?company_id=${companyId}`);
      setPlants(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load plants');
    }
  };

  const loadAssets = async (plantId) => {
    try {
      const res = await API.get(`/assets/?plant_id=${plantId}`);
      setAssets(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load assets');
    }
  };

  const loadUnassignedSignals = async () => {
    if (!selectedPlantId) return;
    try {
      const res = await API.get(`/dcs/signals/unassigned/plant/${selectedPlantId}`);
      setUnassignedSignals(res.data || []);
    } catch (error) {
      console.error('Error loading unassigned signals:', error);
    }
  };

  const loadAssignedSignals = async () => {
    if (!selectedAssetId) return;
    try {
      const res = await API.get(`/dcs/asset/${selectedAssetId}/mappings`);
      setAssignedSignals(res.data || []);
    } catch (error) {
      console.error('Error loading assigned signals:', error);
    }
  };

  const handleAssetSelect = (assetId) => {
    const asset = assets.find(a => a.id === parseInt(assetId));
    setSelectedAsset(asset);
    setSelectedAssetId(assetId);
  };

  const handleAssign = (signal) => {
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
        asset_id: parseInt(selectedAssetId),
        dcs_signal_id: selectedSignal.id,
        display_name: formData.display_name,
        unit: formData.unit,
        min_alarm: formData.min_alarm ? parseFloat(formData.min_alarm) : null,
        max_alarm: formData.max_alarm ? parseFloat(formData.max_alarm) : null
      });
      toast.success('Signal assigned successfully!');
      setShowAssignForm(false);
      loadUnassignedSignals();
      loadAssignedSignals();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign signal');
    }
  };

  const handleRemove = async (mappingId) => {
    if (window.confirm('Remove this signal from the asset?')) {
      try {
        await API.delete(`/dcs/mappings/${mappingId}`);
        toast.success('Signal removed successfully!');
        loadUnassignedSignals();
        loadAssignedSignals();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to remove signal');
      }
    }
  };

  const handleViewChart = (mapping) => {
    navigate(`/assets/${selectedAssetId}?tab=dcs&signal=${mapping.dcs_signal_id}`);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>📡 DCS Signals</h1>
        <p style={{ color: '#6b7280' }}>Manage DCS signal mapping for assets</p>
      </div>

      {/* Hierarchy Selection */}
      <Card title="Select Asset" icon="🎯">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Company *</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              style={styles.select}
            >
              <option value="">Select Company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Plant *</label>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              disabled={!selectedCompanyId}
              style={styles.select}
            >
              <option value="">Select Plant</option>
              {plants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Asset *</label>
            <select
              value={selectedAssetId}
              onChange={(e) => handleAssetSelect(e.target.value)}
              disabled={!selectedPlantId}
              style={styles.select}
            >
              <option value="">Select Asset</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.asset_type === 'generator' ? '⚡' : a.asset_type === 'transformer' ? '🔌' : '⚙️'} {a.asset_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* DCS Signals Section */}
      {selectedAsset && (
        <>
          {/* Unassigned Signals */}
          <Card title="Available Signals" icon="📋">
            {unassignedSignals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No unassigned signals available for this plant.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
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
                          <Button size="sm" onClick={() => handleAssign(signal)}>Assign</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Assigned Signals */}
          <Card title="Assigned Signals" icon="✅">
            {assignedSignals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No signals assigned to this asset yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>KKS Code</th>
                      <th>Display Name</th>
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
                        <td>{mapping.unit || mapping.signal_details?.unit || '-'}</td>
                        <td>{mapping.min_alarm || '-'}</td>
                        <td>{mapping.max_alarm || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button size="sm" onClick={() => handleViewChart(mapping)}>View Chart</Button>
                            <Button size="sm" variant="danger" onClick={() => handleRemove(mapping.id)}>Remove</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Assign Form Modal */}
      {showAssignForm && selectedSignal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Assign Signal: {selectedSignal.kks_code}</h2>
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
              
              <label>Min Alarm Threshold</label>
              <input
                type="number"
                step="any"
                value={formData.min_alarm}
                onChange={(e) => setFormData({...formData, min_alarm: e.target.value})}
                placeholder="Minimum value for alarm"
                style={styles.input}
              />
              
              <label>Max Alarm Threshold</label>
              <input
                type="number"
                step="any"
                value={formData.max_alarm}
                onChange={(e) => setFormData({...formData, max_alarm: e.target.value})}
                placeholder="Maximum value for alarm"
                style={styles.input}
              />
              
              <div style={styles.modalButtons}>
                <Button type="submit">Assign</Button>
                <Button variant="secondary" onClick={() => setShowAssignForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
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
    borderRadius: '12px',
    width: '500px'
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  }
};

export default DCSPage;
