import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import DCSManagement from '../components/DCSManagement';
import DCSVisualization from '../components/DCSVisualization';

function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('nameplate');
  const [dcsSubTab, setDcsSubTab] = useState('management');
  const [loading, setLoading] = useState(true);
  const [testTypes, setTestTypes] = useState([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [testFields, setTestFields] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testFormData, setTestFormData] = useState({});

  useEffect(() => {
    loadAsset();
  }, [assetId]);

  const loadAsset = async () => {
    try {
      const res = await API.get(`/assets/${assetId}`);
      setAsset(res.data);
      await loadTestTypes(res.data.asset_type);
    } catch (error) {
      console.error('Error loading asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTestTypes = async (assetType) => {
    try {
      const res = await API.get(`/test-types/?asset_type=${assetType}`);
      setTestTypes(res.data);
    } catch (error) {
      console.error('Error loading test types:', error);
    }
  };

  const loadTestFields = async (testTypeId) => {
    try {
      const res = await API.get(`/test-fields/test-type/${testTypeId}`);
      setTestFields(res.data);
      const initialData = { test_date: new Date().toISOString().split('T')[0] };
      res.data.forEach(field => {
        initialData[field.field_name] = '';
      });
      setTestFormData(initialData);
    } catch (error) {
      console.error('Error loading test fields:', error);
    }
  };

  const loadTestResults = async (testTypeId) => {
    try {
      const res = await API.get(`/test-results/asset/${assetId}?test_type_id=${testTypeId}`);
      setTestResults(res.data);
    } catch (error) {
      console.error('Error loading test results:', error);
    }
  };

  const handleTestTypeChange = async (e) => {
    const testTypeId = e.target.value;
    setSelectedTestType(testTypeId);
    if (testTypeId) {
      await loadTestFields(testTypeId);
      await loadTestResults(testTypeId);
      setShowTestForm(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    const parameters = testFields.map(field => {
      const value = testFormData[field.field_name];
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
      test_type_id: parseInt(selectedTestType),
      test_date: testFormData.test_date,
      lab_name: testFormData.lab_name || null,
      notes: testFormData.notes || null,
      parameters: parameters
    };

    try {
      await API.post('/test-results/', testData);
      alert('Test result added successfully!');
      setShowTestForm(false);
      setTestFormData({ test_date: new Date().toISOString().split('T')[0] });
      await loadTestResults(selectedTestType);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBack = () => {
    navigate(`/plants/${asset?.plant_id}/assets`);
  };

  const renderTestField = (field) => {
    const value = testFormData[field.field_name] || '';
    switch(field.data_type) {
      case 'number':
        return (
          <input key={field.id} type="number" step="any" placeholder={`${field.display_name} (${field.unit || ''})`} value={value} onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} required={field.is_required} style={styles.input} />
        );
      case 'date':
        return (
          <input key={field.id} type="date" value={value} onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} required={field.is_required} style={styles.input} />
        );
      case 'select':
        return (
          <select key={field.id} value={value} onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} required={field.is_required} style={styles.input}>
            <option value="">Select {field.display_name}</option>
            {(field.allowed_values || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      default:
        return (
          <input key={field.id} type="text" placeholder={field.display_name} value={value} onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})} required={field.is_required} style={styles.input} />
        );
    }
  };

  const getAssetIcon = () => {
    switch(asset?.asset_type) {
      case 'generator': return '⚡';
      case 'transformer': return '🔌';
      case 'motor': return '⚙️';
      default: return '📦';
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading asset details...</div>;
  }

  if (!asset) {
    return <div style={styles.container}>Asset not found</div>;
  }

  const selectedTestTypeName = testTypes.find(t => t.id == selectedTestType)?.test_name;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backButton}>← Back to Assets</button>
        <h1>{getAssetIcon()} {asset.asset_name} ({asset.asset_code})</h1>
      </div>

      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('nameplate')} style={{ ...styles.tab, backgroundColor: activeTab === 'nameplate' ? '#667eea' : '#f0f0f0' }}>📋 Nameplate Data</button>
        <button onClick={() => setActiveTab('tests')} style={{ ...styles.tab, backgroundColor: activeTab === 'tests' ? '#667eea' : '#f0f0f0' }}>🔬 Test Results</button>
        <button onClick={() => setActiveTab('dcs')} style={{ ...styles.tab, backgroundColor: activeTab === 'dcs' ? '#667eea' : '#f0f0f0' }}>📡 DCS Signals</button>
      </div>

      {/* Nameplate Tab */}
      {activeTab === 'nameplate' && (
        <div style={styles.tabContent}>
          <h2>Nameplate Information</h2>
          <div style={styles.infoGrid}>
            <InfoField label="Asset Name" value={asset.asset_name} />
            <InfoField label="Asset Code" value={asset.asset_code} />
            <InfoField label="Manufacturer" value={asset.manufacturer || '-'} />
            <InfoField label="Model" value={asset.model || '-'} />
            <InfoField label="Status" value={asset.operational_status || 'active'} />
          </div>
        </div>
      )}

      {/* Test Results Tab */}
      {activeTab === 'tests' && (
        <div style={styles.tabContent}>
          <div style={styles.testHeader}>
            <select value={selectedTestType} onChange={handleTestTypeChange} style={styles.select}>
              <option value="">Select Test Type</option>
              {testTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.test_name}</option>)}
            </select>
            {selectedTestType && <button onClick={() => setShowTestForm(true)} style={styles.addButton}>+ Add Test Result</button>}
          </div>

          {testResults.length > 0 && (
            <div style={styles.tableContainer}>
              <h3>Test History - {selectedTestTypeName}</h3>
              <table style={styles.dataTable}>
                <thead>
                  <tr><th>Test Date</th><th>Lab Name</th>{testFields.map(field => <th key={field.id}>{field.display_name}</th>)}<th>Notes</th></tr>
                </thead>
                <tbody>
                  {testResults.map(result => (
                    <tr key={result.id}>
                      <td>{new Date(result.test_date).toLocaleDateString()}</td>
                      <td>{result.lab_name || '-'}</td>
                      {testFields.map(field => {
                        const param = result.parameters?.find(p => p.field_name === field.field_name);
                        let value = '-';
                        if (param) {
                          if (param.field_value !== null) value = `${param.field_value} ${param.unit || ''}`;
                          else if (param.field_value_text) value = param.field_value_text;
                          else if (param.field_value_date) value = new Date(param.field_value_date).toLocaleDateString();
                          else if (param.field_value_boolean !== null) value = param.field_value_boolean ? 'Yes' : 'No';
                        }
                        return <td key={field.id}>{value}</td>;
                      })}
                      <td>{result.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DCS Signals Tab */}
      {activeTab === 'dcs' && (
        <div style={styles.tabContent}>
          <div style={styles.dcsSubTabs}>
            <button onClick={() => setDcsSubTab('management')} style={{ ...styles.dcsSubTab, backgroundColor: dcsSubTab === 'management' ? '#667eea' : '#f0f0f0', color: dcsSubTab === 'management' ? 'white' : '#333' }}>📋 Signal Management</button>
            <button onClick={() => setDcsSubTab('visualization')} style={{ ...styles.dcsSubTab, backgroundColor: dcsSubTab === 'visualization' ? '#667eea' : '#f0f0f0', color: dcsSubTab === 'visualization' ? 'white' : '#333' }}>📊 Data Visualization</button>
          </div>
          {dcsSubTab === 'management' && <DCSManagement assetId={asset.id} assetName={asset.asset_name} plantId={asset.plant_id} onBack={() => {}} />}
          {dcsSubTab === 'visualization' && <DCSVisualization assetId={asset.id} assetName={asset.asset_name} onBack={() => {}} />}
        </div>
      )}

      {/* Add Test Result Modal */}
      {showTestForm && selectedTestType && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Add Test Result - {selectedTestTypeName}</h2>
            <form onSubmit={handleTestSubmit}>
              <label style={styles.label}>Test Date *</label>
              <input type="date" value={testFormData.test_date || ''} onChange={(e) => setTestFormData({...testFormData, test_date: e.target.value})} required style={styles.input} />
              {testFields.map(field => renderTestField(field))}
              <input type="text" placeholder="Laboratory Name" value={testFormData.lab_name || ''} onChange={(e) => setTestFormData({...testFormData, lab_name: e.target.value})} style={styles.input} />
              <textarea placeholder="Notes / Remarks" value={testFormData.notes || ''} onChange={(e) => setTestFormData({...testFormData, notes: e.target.value})} style={styles.textarea} rows="3" />
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.saveButton}>Save</button>
                <button type="button" onClick={() => setShowTestForm(false)} style={styles.cancelButton}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div style={styles.infoField}>
      <span style={styles.infoLabel}>{label}:</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  backButton: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', flexWrap: 'wrap' },
  tab: { padding: '10px 20px', border: 'none', borderRadius: '5px 5px 0 0', cursor: 'pointer', fontSize: '16px' },
  tabContent: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  dcsSubTabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' },
  dcsSubTab: { padding: '8px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' },
  infoField: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' },
  infoLabel: { fontWeight: 'bold', color: '#666' },
  infoValue: { color: '#333' },
  testHeader: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', flex: 1, minWidth: '200px' },
  addButton: { padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  tableContainer: { overflowX: 'auto', marginTop: '20px' },
  dataTable: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '600px', maxHeight: '80vh', overflow: 'auto' },
  input: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box', fontFamily: 'inherit' },
  label: { fontWeight: 'bold', marginTop: '10px', display: 'block' },
  modalButtons: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveButton: { padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  cancelButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default AssetDetail;
