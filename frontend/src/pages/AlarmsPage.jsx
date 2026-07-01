import { useState, useEffect } from 'react';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

function AlarmsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [alarmRules, setAlarmRules] = useState([]);
  const [alarmHistory, setAlarmHistory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    asset_id: '',
    signal_mapping_id: '',
    condition_type: 'high',
    threshold_min: '',
    threshold_max: '',
    unit: '',
    severity: 'warning',
    delay_seconds: 0,
    message: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const assetsRes = await API.get('/assets/');
      const assetsList = assetsRes.data.items || [];
      setAssets(assetsList);
      
      const rulesRes = await API.get('/alarms/rules');
      setAlarmRules(rulesRes.data || []);
      
      const historyRes = await API.get('/alarms/history?limit=50');
      setAlarmHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load alarm data');
    } finally {
      setLoading(false);
    }
  };

  const loadSignalsForAsset = async (assetId) => {
    if (assetId) {
      try {
        const res = await API.get(`/dcs/asset/${assetId}/mappings`);
        setSignals(res.data || []);
      } catch (error) {
        console.error('Error loading signals:', error);
        setSignals([]);
      }
    } else {
      setSignals([]);
    }
  };

  const handleAssetChange = (e) => {
    const assetId = e.target.value;
    setFormData({ ...formData, asset_id: assetId, signal_mapping_id: '' });
    if (assetId) {
      loadSignalsForAsset(assetId);
    } else {
      setSignals([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = {
      name: formData.name,
      asset_id: parseInt(formData.asset_id),
      signal_mapping_id: formData.signal_mapping_id ? parseInt(formData.signal_mapping_id) : null,
      condition_type: formData.condition_type,
      threshold_min: formData.threshold_min ? parseFloat(formData.threshold_min) : null,
      threshold_max: formData.threshold_max ? parseFloat(formData.threshold_max) : null,
      unit: formData.unit || null,
      severity: formData.severity,
      delay_seconds: parseInt(formData.delay_seconds) || 0,
      message: formData.message || null,
      is_active: formData.is_active,
      notification_methods: ["dashboard"]
    };
    
    try {
      if (editingRule) {
        await API.put(`/alarms/rules/${editingRule.id}`, submitData);
        toast.success('Alarm rule updated successfully!');
      } else {
        await API.post('/alarms/rules', submitData);
        toast.success('Alarm rule created successfully!');
      }
      setShowRuleForm(false);
      setEditingRule(null);
      setFormData({
        name: '',
        asset_id: '',
        signal_mapping_id: '',
        condition_type: 'high',
        threshold_min: '',
        threshold_max: '',
        unit: '',
        severity: 'warning',
        delay_seconds: 0,
        message: '',
        is_active: true
      });
      setSignals([]);
      loadData();
    } catch (error) {
      console.error('Submit error:', error.response?.data || error);
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      asset_id: rule.asset_id,
      signal_mapping_id: rule.signal_mapping_id || '',
      condition_type: rule.condition_type,
      threshold_min: rule.threshold_min || '',
      threshold_max: rule.threshold_max || '',
      unit: rule.unit || '',
      severity: rule.severity,
      delay_seconds: rule.delay_seconds,
      message: rule.message || '',
      is_active: rule.is_active
    });
    if (rule.asset_id) {
      loadSignalsForAsset(rule.asset_id);
    }
    setShowRuleForm(true);
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this alarm rule?')) {
      try {
        await API.delete(`/alarms/rules/${id}`);
        toast.success('Alarm rule deleted successfully');
        loadData();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Delete failed');
      }
    }
  };

  const handleAcknowledge = async (alarmId) => {
    try {
      await API.post(`/alarms/history/${alarmId}/acknowledge`, { notes: '' });
      toast.success('Alarm acknowledged');
      loadData();
    } catch (error) {
      toast.error('Failed to acknowledge alarm');
    }
  };

  const handleResolve = async (alarmId) => {
    try {
      await API.post(`/alarms/history/${alarmId}/resolve`, { notes: '' });
      toast.success('Alarm resolved');
      loadData();
    } catch (error) {
      toast.error('Failed to resolve alarm');
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'warning': return '#ffc107';
      default: return '#0dcaf0';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return { bg: '#dc3545', text: 'Active' };
      case 'acknowledged': return { bg: '#ffc107', text: 'Acknowledged' };
      case 'resolved': return { bg: '#198754', text: 'Resolved' };
      default: return { bg: '#6c757d', text: status };
    }
  };

  const activeAlarms = alarmHistory.filter(a => a.status === 'active');
  const acknowledgedAlarms = alarmHistory.filter(a => a.status === 'acknowledged');
  const resolvedAlarms = alarmHistory.filter(a => a.status === 'resolved');

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>🚨 Alarm Management</h1>
          <p style={{ color: '#6b7280' }}>Configure alarms and monitor active alerts</p>
        </div>
        <Button onClick={() => { setEditingRule(null); setFormData({ name: '', asset_id: '', signal_mapping_id: '', condition_type: 'high', threshold_min: '', threshold_max: '', unit: '', severity: 'warning', delay_seconds: 0, message: '', is_active: true }); setSignals([]); setShowRuleForm(true); }}>
          + New Alarm Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', borderLeft: '4px solid #dc3545' }}>
          <h2 style={{ fontSize: '32px', margin: 0, color: '#dc3545' }}>{activeAlarms.length}</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Active Alarms</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', borderLeft: '4px solid #ffc107' }}>
          <h2 style={{ fontSize: '32px', margin: 0, color: '#ffc107' }}>{acknowledgedAlarms.length}</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Acknowledged</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', borderLeft: '4px solid #198754' }}>
          <h2 style={{ fontSize: '32px', margin: 0, color: '#198754' }}>{resolvedAlarms.length}</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Resolved (24h)</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('active')} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'active' ? 'bold' : 'normal', borderBottom: activeTab === 'active' ? '2px solid #dc3545' : 'none', color: activeTab === 'active' ? '#dc3545' : '#6b7280' }}>Active Alarms</button>
        <button onClick={() => setActiveTab('rules')} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'rules' ? 'bold' : 'normal', borderBottom: activeTab === 'rules' ? '2px solid #4f46e5' : 'none', color: activeTab === 'rules' ? '#4f46e5' : '#6b7280' }}>Alarm Rules</button>
        <button onClick={() => setActiveTab('history')} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === 'history' ? 'bold' : 'normal', borderBottom: activeTab === 'history' ? '2px solid #4f46e5' : 'none', color: activeTab === 'history' ? '#4f46e5' : '#6b7280' }}>History</button>
      </div>

      {/* Active Alarms Tab */}
      {activeTab === 'active' && (
        <Card title="Active Alarms" icon="🚨">
          {activeAlarms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No active alarms. All systems normal.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Asset</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Alarm</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Value</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Threshold</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Severity</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlarms.map(alarm => (
                    <tr key={alarm.id}>
                      <td style={{ padding: '12px' }}>{new Date(alarm.triggered_at).toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>{alarm.asset_name}</td>
                      <td style={{ padding: '12px' }}>{alarm.alarm_name}</td>
                      <td style={{ padding: '12px' }}><strong>{alarm.actual_value}</strong></td>
                      <td style={{ padding: '12px' }}>{alarm.threshold}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: getSeverityColor(alarm.severity), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {alarm.severity.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button size="sm" onClick={() => handleAcknowledge(alarm.id)}>Acknowledge</Button>
                          <Button size="sm" variant="success" onClick={() => handleResolve(alarm.id)}>Resolve</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Alarm Rules Tab */}
      {activeTab === 'rules' && (
        <Card title="Alarm Rules" icon="⚙️">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Asset</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Condition</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Threshold</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Severity</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alarmRules.map(rule => (
                  <tr key={rule.id}>
                    <td style={{ padding: '12px' }}>{rule.name}</td>
                    <td style={{ padding: '12px' }}>{rule.asset_name || '-'}</td>
                    <td style={{ padding: '12px' }}>{rule.condition_type}</td>
                    <td style={{ padding: '12px' }}>{rule.threshold_max || rule.threshold_min || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: getSeverityColor(rule.severity), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {rule.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: rule.is_active ? '#198754' : '#dc3545' }}>{rule.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button size="sm" variant="warning" onClick={() => handleEdit(rule)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteRule(rule.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card title="Alarm History" icon="📜">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Asset</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Alarm</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Value</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Acknowledged</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {alarmHistory.filter(a => a.status !== 'active').map(alarm => {
                  const status = getStatusBadge(alarm.status);
                  return (
                    <tr key={alarm.id}>
                      <td style={{ padding: '12px' }}>{new Date(alarm.triggered_at).toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>{alarm.asset_name}</td>
                      <td style={{ padding: '12px' }}>{alarm.alarm_name}</td>
                      <td style={{ padding: '12px' }}>{alarm.actual_value}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: status.bg, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {status.text}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{alarm.acknowledged_at ? new Date(alarm.acknowledged_at).toLocaleString() : '-'}</td>
                      <td style={{ padding: '12px' }}>{alarm.resolved_at ? new Date(alarm.resolved_at).toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Rule Modal */}
      {showRuleForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>{editingRule ? 'Edit Alarm Rule' : 'Create Alarm Rule'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Rule Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>Asset *</label>
                <select value={formData.asset_id} onChange={handleAssetChange} required style={styles.input}>
                  <option value="">Select Asset</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.asset_type === 'generator' ? '⚡' : a.asset_type === 'transformer' ? '🔌' : '⚙️'} {a.asset_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Signal</label>
                <select 
                  value={formData.signal_mapping_id} 
                  onChange={(e) => setFormData({...formData, signal_mapping_id: e.target.value})} 
                  style={styles.input} 
                  disabled={!formData.asset_id}
                >
                  <option value="">{!formData.asset_id ? 'Select Asset First' : signals.length === 0 ? 'No Signals Available' : 'Select Signal'}</option>
                  {signals.map(s => (
                    <option key={s.id} value={s.id}>{s.display_name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Condition Type *</label>
                <select value={formData.condition_type} onChange={(e) => setFormData({...formData, condition_type: e.target.value})} style={styles.input}>
                  <option value="high">High (Value Above Threshold)</option>
                  <option value="low">Low (Value Below Threshold)</option>
                  <option value="range">Range (Between Min and Max)</option>
                </select>
              </div>
              {formData.condition_type === 'range' ? (
                <>
                  <div style={styles.formGroup}>
                    <label>Min Threshold</label>
                    <input type="number" step="any" value={formData.threshold_min} onChange={(e) => setFormData({...formData, threshold_min: e.target.value})} style={styles.input} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Max Threshold</label>
                    <input type="number" step="any" value={formData.threshold_max} onChange={(e) => setFormData({...formData, threshold_max: e.target.value})} style={styles.input} />
                  </div>
                </>
              ) : (
                <div style={styles.formGroup}>
                  <label>Threshold *</label>
                  <input type="number" step="any" value={formData.threshold_max || formData.threshold_min} onChange={(e) => setFormData({...formData, threshold_max: e.target.value})} required style={styles.input} />
                </div>
              )}
              <div style={styles.formGroup}>
                <label>Unit</label>
                <input type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>Severity *</label>
                <select value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} style={styles.input}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Message</label>
                <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} style={styles.textarea} rows="2" />
              </div>
              <div style={styles.formGroup}>
                <label>Delay (seconds)</label>
                <input type="number" value={formData.delay_seconds} onChange={(e) => setFormData({...formData, delay_seconds: parseInt(e.target.value)})} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />
                  {' '}Active
                </label>
              </div>
              <div style={styles.modalButtons}>
                <Button type="submit">{editingRule ? 'Update' : 'Create'}</Button>
                <Button variant="secondary" onClick={() => setShowRuleForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
    borderRadius: '12px',
    width: '550px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  formGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  }
};

export default AlarmsPage;
