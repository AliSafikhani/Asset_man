import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

function TestsPage() {
  const navigate = useNavigate();
  
  // Hierarchy state
  const [companies, setCompanies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [assets, setAssets] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [testFields, setTestFields] = useState([]);
  
  // Selected items
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedTestTypeId, setSelectedTestTypeId] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testFormData, setTestFormData] = useState({});
  
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
      setTestResults([]);
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
      setTestResults([]);
    } else {
      setAssets([]);
    }
  }, [selectedPlantId]);
  
  // Load test results when asset or test type changes
  useEffect(() => {
    if (selectedAssetId && selectedTestTypeId) {
      loadTestResults(selectedAssetId, selectedTestTypeId);
      loadTestFields(selectedTestTypeId);
    }
  }, [selectedAssetId, selectedTestTypeId]);

  const loadCompanies = async () => {
    try {
      const res = await API.get('/companies');
      setCompanies(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load companies');
    }
  };

  const loadPlants = async (companyId) => {
    setLoading(true);
    try {
      const res = await API.get(`/sites?company_id=${companyId}`);
      setPlants(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load plants');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async (plantId) => {
    setLoading(true);
    try {
      const res = await API.get(`/assets/?plant_id=${plantId}`);
      setAssets(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const loadTestTypes = async (assetType) => {
    try {
      const res = await API.get(`/test-types/?asset_type=${assetType}`);
      setTestTypes(res.data || []);
    } catch (error) {
      toast.error('Failed to load test types');
    }
  };

  const loadTestFields = async (testTypeId) => {
    try {
      const res = await API.get(`/test-fields/test-type/${testTypeId}`);
      setTestFields(res.data || []);
      
      // Initialize form
      const initialData = { test_date: new Date().toISOString().split('T')[0] };
      res.data.forEach(field => {
        initialData[field.field_name] = '';
      });
      setTestFormData(initialData);
    } catch (error) {
      console.error('Error loading test fields:', error);
    }
  };

  const loadTestResults = async (assetId, testTypeId) => {
    setLoading(true);
    try {
      const res = await API.get(`/test-results/asset/${assetId}?test_type_id=${testTypeId}`);
      setTestResults(res.data || []);
    } catch (error) {
      console.error('Error loading test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = async (assetId) => {
    const asset = assets.find(a => a.id === parseInt(assetId));
    setSelectedAsset(asset);
    setSelectedAssetId(assetId);
    setSelectedTestTypeId('');
    setTestResults([]);
    if (asset) {
      await loadTestTypes(asset.asset_type);
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
      asset_id: parseInt(selectedAssetId),
      test_type_id: parseInt(selectedTestTypeId),
      test_date: testFormData.test_date,
      lab_name: testFormData.lab_name || null,
      notes: testFormData.notes || null,
      parameters: parameters
    };

    try {
      await API.post('/test-results/', testData);
      toast.success('Test result added successfully!');
      setShowTestForm(false);
      loadTestResults(selectedAssetId, selectedTestTypeId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add test result');
    }
  };

  const renderTestField = (field) => {
    const value = testFormData[field.field_name] || '';
    
    switch(field.data_type) {
      case 'number':
        return (
          <input
            key={field.id}
            type="number"
            step="any"
            placeholder={`${field.display_name} (${field.unit || ''})`}
            value={value}
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})}
            required={field.is_required}
            style={styles.input}
          />
        );
      case 'date':
        return (
          <input
            key={field.id}
            type="date"
            value={value}
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})}
            required={field.is_required}
            style={styles.input}
          />
        );
      case 'select':
        return (
          <select
            key={field.id}
            value={value}
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})}
            required={field.is_required}
            style={styles.input}
          >
            <option value="">Select {field.display_name}</option>
            {(field.allowed_values || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            key={field.id}
            type="text"
            placeholder={field.display_name}
            value={value}
            onChange={(e) => setTestFormData({...testFormData, [field.field_name]: e.target.value})}
            required={field.is_required}
            style={styles.input}
          />
        );
    }
  };

  const selectedTestTypeName = testTypes.find(t => t.id == selectedTestTypeId)?.test_name;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>🔬 Test Results</h1>
        <p style={{ color: '#6b7280' }}>View and manage test results for assets</p>
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

      {/* Test Results Section */}
      {selectedAsset && (
        <Card title={`Test Results - ${selectedAsset.asset_name}`} icon="🔬">
          {/* Test Type Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Test Type</label>
            <select
              value={selectedTestTypeId}
              onChange={(e) => setSelectedTestTypeId(e.target.value)}
              style={styles.select}
            >
              <option value="">Select Test Type</option>
              {testTypes.map(tt => (
                <option key={tt.id} value={tt.id}>{tt.test_name}</option>
              ))}
            </select>
          </div>

          {/* Add Test Button */}
          {selectedTestTypeId && (
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
              <Button onClick={() => setShowTestForm(true)}>+ Add Test Result</Button>
            </div>
          )}

          {/* Test Results Table */}
          {testResults.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Test Date</th>
                    <th>Lab Name</th>
                    {testFields.map(field => (
                      <th key={field.id}>{field.display_name}</th>
                    ))}
                    <th>Notes</th>
                  </tr>
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
          
          {selectedTestTypeId && testResults.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No test results found. Click "Add Test Result" to add one.
            </div>
          )}
        </Card>
      )}

      {/* Add Test Modal */}
      {showTestForm && selectedTestTypeId && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Add Test Result - {selectedTestTypeName}</h2>
            <form onSubmit={handleTestSubmit}>
              <label>Test Date *</label>
              <input
                type="date"
                value={testFormData.test_date || ''}
                onChange={(e) => setTestFormData({...testFormData, test_date: e.target.value})}
                required
                style={styles.input}
              />
              
              {testFields.map(field => renderTestField(field))}
              
              <input
                type="text"
                placeholder="Laboratory Name"
                value={testFormData.lab_name || ''}
                onChange={(e) => setTestFormData({...testFormData, lab_name: e.target.value})}
                style={styles.input}
              />
              
              <textarea
                placeholder="Notes / Remarks"
                value={testFormData.notes || ''}
                onChange={(e) => setTestFormData({...testFormData, notes: e.target.value})}
                style={styles.textarea}
                rows="3"
              />
              
              <div style={styles.modalButtons}>
                <Button type="submit">Save</Button>
                <Button variant="secondary" onClick={() => setShowTestForm(false)}>Cancel</Button>
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
  textarea: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
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
    width: '600px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  }
};

export default TestsPage;
