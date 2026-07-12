// frontend/src/pages/AssetDetail.jsx
// Refactored - Compact version

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import NameplateTab from '../components/AssetDetail/NameplateTab';
import DCSTab from '../components/AssetDetail/DCSTab';
import TestResultForm from '../components/AssetDetail/TestResultForm';
import Pagination from '../components/AssetDetail/Pagination';
import ColumnSelector from '../components/AssetDetail/ColumnSelector';
import DGAAlgorithmsResults from '../components/AssetDetail/DGAAlgorithmsResults';
import { FaArrowLeft, FaBolt, FaCogs, FaBox, FaChartBar, FaDatabase, FaMicrochip, FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import AddResultMenu from '../components/AssetDetail/AddResultMenu';
import { MdTransform } from 'react-icons/md';

// ============== CONSTANTS ==============
const STATUS_BADGES = {
  IEEE: {
    Normal: { icon: <FaCheckCircle size={12} />, color: '#10b981', bg: '#d1fae5', label: 'Normal' },
    Investigate: { icon: <FaExclamationTriangle size={12} />, color: '#f59e0b', bg: '#fef3c7', label: 'Investigate' },
    'Action Required': { icon: <FaShieldAlt size={12} />, color: '#ef4444', bg: '#fecaca', label: 'Action Required' },
    Unknown: { icon: <FaQuestionCircle size={12} />, color: '#94a3b8', bg: '#f1f5f9', label: 'Unknown' }
  },
  IEC: {
    Investigate: { icon: <FaExclamationTriangle size={12} />, color: '#f59e0b', bg: '#fef3c7', label: 'Investigate' },
    'Action Required': { icon: <FaShieldAlt size={12} />, color: '#ef4444', bg: '#fecaca', label: 'Action Required' },
    Unknown: { icon: <FaQuestionCircle size={12} />, color: '#94a3b8', bg: '#f1f5f9', label: 'Unknown' }
  }
};

const GAS_KEYS = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2'];
const DGA_GASES = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6'];
const ALGO_MAP = {
  'duvaltriangle1': 'duval_triangle_1', 'duvaltriangle2': 'duval_triangle_2',
  'duvaltriangle4': 'duval_triangle_4', 'duvaltriangle5': 'duval_triangle_5',
  'duvaltriangle6': 'duval_triangle_6', 'duvalpentagon1': 'duval_pentagon_1',
  'duvalpentagon2': 'duval_pentagon_2', 'rogers': 'rogers_ratio',
  'doernenburg': 'doernenburg_ratio', 'iec60599': 'iec60599_ratio',
  'iec60599ratio': 'iec60599_ratio', 'ml_dga_1': 'ml_dga_1'
};

// ============== HELPERS ==============
const getBadge = (type, status, statusCode) => {
  const badges = STATUS_BADGES[type];
  if (type === 'IEEE') {
    let mapped = status;
    if (status === 'Action Required' || statusCode === 3 || statusCode === 4) mapped = 'Action Required';
    else if (status === 'Normal' || statusCode === 1) mapped = 'Normal';
    else if (status === 'Investigate' || statusCode === 2) mapped = 'Investigate';
    else mapped = 'Unknown';
    return badges[mapped] || badges.Unknown;
  }
  return badges[status] || badges.Unknown;
};

const getAssetIcon = (type) => {
  const icons = {
    generator: <FaBolt size={28} color="#f59e0b" />,
    transformer: <MdTransform size={28} color="#8b5cf6" />,
    motor: <FaCogs size={28} color="#06b6d4" />
  };
  return icons[type] || <FaBox size={28} color="#64748b" />;
};

const getAssetTypeColor = (type) => {
  const colors = { generator: '#f59e0b', transformer: '#8b5cf6', motor: '#06b6d4' };
  return colors[type] || '#64748b';
};

const calculateAge = (date) => {
  if (!date) return 'N/A';
  const years = new Date().getFullYear() - new Date(date).getFullYear();
  return years >= 0 ? years : 'N/A';
};

// ============== COMPONENT ==============
function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nameplate');
  const [testTypes, setTestTypes] = useState([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [testFields, setTestFields] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form states
  const [showTestForm, setShowTestForm] = useState(false);
  const [testFormData, setTestFormData] = useState({});
  const [editingResult, setEditingResult] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Algorithm states
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError, setAlgoError] = useState(null);
  const [showDgaAlgorithms, setShowDgaAlgorithms] = useState(false);
  const [dgaResults, setDgaResults] = useState([]);
  const [algoData, setAlgoData] = useState({});

  // Status states
  const [statusMap, setStatusMap] = useState({ ieee: {}, iec: {} });
  const [statusLoading, setStatusLoading] = useState({ ieee: false, iec: false });

  // --- Computed ---
  const isDGA = useMemo(() => 
    testTypes.find(t => t.id == selectedTestType)?.test_name?.toLowerCase().includes('dga') || false,
    [testTypes, selectedTestType]
  );

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return testResults.slice(start, start + pageSize);
  }, [testResults, currentPage, pageSize]);

  const totalRecords = testResults.length;

  // --- Effects ---
  useEffect(() => { loadAsset(); }, [assetId]);

  useEffect(() => {
    if (isDGA && testResults.length > 1 && asset?.asset_type === 'transformer') {
      loadStatus('ieee');
      loadStatus('iec');
    }
  }, [testResults, selectedTestType, isDGA]);

  // --- Data Loading ---
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
      
      // Filter out duplicate fields
      const EXCLUDED_FIELDS = ['laboratory_name', 'sample_temp'];
      const filteredFields = res.data.filter(f => !EXCLUDED_FIELDS.includes(f.field_name));
      
      setTestFields(filteredFields);

      const visibility = {
        checkbox: true, 
        test_date: true, 
        lab_name: false,  // Add this to hide built-in lab name by default
        notes: false,
        actions: true, 
        ieee_status: true, 
        iec_status: true
      };
      
      filteredFields.forEach(f => { 
        visibility[f.field_name] = DGA_GASES.includes(f.field_name); 
      });
      
      setVisibleColumns(visibility);

      const initialData = { test_date: new Date().toISOString().split('T')[0] };
      filteredFields.forEach(f => { 
        initialData[f.field_name] = ''; 
      });
      setTestFormData(initialData);
    } catch (error) {
      console.error('Error loading test fields:', error);
    }
  };

  const loadTestResults = async (testTypeId) => {
    try {
      const res = await API.get(`/test-results/?asset_id=${assetId}&test_type_id=${testTypeId}`);
      setTestResults(res.data);
      setSelectedRows([]);
      setSelectAll(false);
      setShowDgaAlgorithms(false);
      setDgaResults([]);
      setAlgoData({});
      setAlgoError(null);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading test results:', error);
    }
  };

  // --- Status Loading (IEEE & IEC) ---
  const loadStatus = async (type) => {
    const setLoading = (v) => setStatusLoading(prev => ({ ...prev, [type]: v }));
    setLoading(true);

    try {
      if (!isDGA || testResults.length < 2) {
        setStatusMap(prev => ({ ...prev, [type]: {} }));
        setLoading(false);
        return;
      }

      const samples = testResults.map(r => {
        const gasData = {};
        r.parameters.forEach(p => {
          if (GAS_KEYS.includes(p.field_name)) {
            gasData[p.field_name] = parseFloat(p.field_value) || 0;
          }
        });
        return { id: r.id, sample_date: r.test_date, gas_data: gasData };
      });

      let endpoint = `/algorithms/transformer/dga/${type === 'ieee' ? 'ieee_algorithm' : 'iec_algorithm'}/batch`;
      let body = samples;

      if (type === 'ieee') {
        const age = asset?.commissioning_date ? calculateAge(asset.commissioning_date) : 'NA';
        endpoint += `?transformer_age=${age}&max_day=730`;
      }

      const response = await API.post(endpoint, body);
      const map = {};

      response.data.forEach(item => {
        if (item.id) {
          if (type === 'ieee') {
            const code = parseInt(item.fault_zone) || 0;
            const status = code === 1 ? 'Normal' : code === 2 ? 'Investigate' : code === 3 ? 'Action Required' : 'Unknown';
            map[item.id] = { status, status_code: code, zone_color: item.zone_color };
          } else {
            map[item.id] = {
              status: item.status || 'Unknown',
              status_code: item.status_code || 0,
              zone_color: item.zone_color
            };
          }
        }
      });

      setStatusMap(prev => ({ ...prev, [type]: map }));
    } catch (error) {
      console.error(`Error loading ${type} status:`, error);
      setStatusMap(prev => ({ ...prev, [type]: {} }));
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleTestTypeChange = async (e) => {
    const id = e.target.value;
    setSelectedTestType(id);
    setStatusMap({ ieee: {}, iec: {} });
    if (id) {
      await loadTestFields(id);
      await loadTestResults(id);
      setShowTestForm(false);
      setEditingResult(null);
    }
  };

  const handleSubmit = async (e) => {
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
      parameters
    };

    try {
      if (editingResult) {
        await API.put(`/test-results/${editingResult.id}`, testData);
        alert('Test result updated successfully!');
      } else {
        await API.post('/test-results/', testData);
        alert('Test result added successfully!');
      }
      setShowTestForm(false);
      setEditingResult(null);
      setTestFormData({ test_date: new Date().toISOString().split('T')[0] });
      await loadTestResults(selectedTestType);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (result) => {
    setEditingResult(result);
    const formData = { test_date: result.test_date, lab_name: result.lab_name || '', notes: result.notes || '' };
    result.parameters.forEach(p => {
      const val = p.field_value ?? p.field_value_text ?? p.field_value_date ?? p.field_value_boolean?.toString();
      if (val !== null && val !== undefined) formData[p.field_name] = val;
    });
    setTestFormData(formData);
    setShowTestForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test result?')) return;
    try {
      await API.delete(`/test-results/${id}`);
      alert('Deleted successfully!');
      await loadTestResults(selectedTestType);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRows.length) return alert('Select at least one result.');
    if (!window.confirm(`Delete ${selectedRows.length} result(s)?`)) return;
    try {
      await API.delete('/test-results/batch', { data: selectedRows });
      alert(`${selectedRows.length} result(s) deleted!`);
      await loadTestResults(selectedTestType);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedRows(selectAll ? [] : paginatedResults.map(r => r.id));
    if (!selectAll) {
      setShowDgaAlgorithms(false);
      setDgaResults([]);
      setAlgoData({});
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    if (selectedRows.length === 0) {
      setShowDgaAlgorithms(false);
      setDgaResults([]);
      setAlgoData({});
    }
  };

  // --- DGA Algorithms ---
  const calculateDgaAlgorithms = async () => {
    if (!selectedRows.length) return alert('Select at least one test result.');

    setAlgoLoading(true);
    setAlgoError(null);
    setDgaResults([]);
    setAlgoData({});

    try {
      const selectedResults = testResults.filter(r => selectedRows.includes(r.id));
      const results = [];
      const duvalSamples = [];

      for (const result of selectedResults) {
        const params = {};
        result.parameters.forEach(p => { if (p.field_value !== null) params[p.field_name] = p.field_value; });

        const algos = await API.get('/algorithms/transformer/dga');
        const algoResults = {};

        for (const algo of algos.data) {
          try {
            const id = ALGO_MAP[algo.id] || algo.id;
            const sample = [{
              id: result.id,
              sample_date: result.test_date,
              gas_data: {
                ch4: params.ch4 || 0, c2h2: params.c2h2 || 0, c2h4: params.c2h4 || 0,
                h2: params.h2 || 0, c2h6: params.c2h6 || 0, co: params.co || 0,
                co2: params.co2 || 0, o2: params.o2 || 0, n2: params.n2 || 0
              }
            }];
            const res = await API.post(`/algorithms/transformer/dga/${id}/batch`, sample);
            algoResults[algo.id] = res.data?.[0] || { error: 'No data' };
          } catch (e) {
            algoResults[algo.id] = { error: 'Calculation failed' };
          }
        }

        results.push({ test_id: result.id, test_date: result.test_date, algorithms: algoResults });
        duvalSamples.push({
          id: result.id,
          sample_date: result.test_date,
          gas_data: { ch4: params.ch4 || 0, c2h2: params.c2h2 || 0, c2h4: params.c2h4 || 0, h2: params.h2 || 0, c2h6: params.c2h6 || 0, co: params.co || 0, co2: params.co2 || 0, o2: params.o2 || 0, n2: params.n2 || 0 }
        });
      }

      // Chart algorithms
      const chartAlgos = [
        { id: 'duval_triangle_1', key: 'duvalData' },
        { id: 'duval_triangle_2', key: 'duval2Data' },
        { id: 'duval_triangle_4', key: 'duval4Data' },
        { id: 'duval_triangle_5', key: 'duval5Data' },
        { id: 'duval_triangle_6', key: 'duval6Data' },
        { id: 'duval_pentagon_1', key: 'duvalPentagon1Data' },
        { id: 'duval_pentagon_2', key: 'duvalPentagon2Data' },
        { id: 'rogers_ratio', key: 'rogersData' },
        { id: 'doernenburg_ratio', key: 'doernenburgData' },
        { id: 'iec60599_ratio', key: 'iec60599Data' },
        { id: 'ml_dga_1', key: 'mlData1' }
      ];

      const newAlgoData = {};
      for (const algo of chartAlgos) {
        try {
          const res = await API.post(`/algorithms/transformer/dga/${algo.id}/batch`, duvalSamples);
          newAlgoData[algo.key] = res.data || [];
        } catch (e) {
          newAlgoData[algo.key] = [];
        }
      }

      setAlgoData(newAlgoData);
      setDgaResults(results);
      setShowDgaAlgorithms(true);
    } catch (error) {
      setAlgoError(error.response?.data?.detail || 'Error calculating DGA algorithms');
    } finally {
      setAlgoLoading(false);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <div style={s.loadingSpinner}></div>
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) return <div style={s.container}>Asset not found</div>;

  const selectedTestTypeName = testTypes.find(t => t.id == selectedTestType)?.test_name;

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate(`/plants/${asset?.plant_id}/assets`)} style={s.backButton}>
          <FaArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Assets
        </button>
        <div style={s.headerCenter}>
          <div style={{ ...s.assetIcon, background: `${getAssetTypeColor(asset.asset_type)}20` }}>
            {getAssetIcon(asset.asset_type)}
          </div>
          <div>
            <h1 style={s.title}>{asset.asset_name}</h1>
            <div style={s.assetMeta}>
              <span style={s.assetCode}>{asset.asset_code}</span>
              <span style={s.assetTypeBadge}>
                {asset.asset_type === 'generator' ? '⚡ Generator' :
                 asset.asset_type === 'transformer' ? '🔌 Transformer' :
                 asset.asset_type === 'motor' ? '⚙️ Motor' : asset.asset_type}
              </span>
              <span style={s.assetStatus}>
                {asset.operational_status === 'active' ? '🟢 Active' :
                 asset.operational_status === 'maintenance' ? '🟡 Maintenance' :
                 asset.operational_status === 'inactive' ? '🔴 Inactive' : asset.operational_status}
              </span>
            </div>
          </div>
        </div>
        <div style={s.headerRight}>
          <span style={s.assetId}>ID: #{asset.id}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {['nameplate', 'tests', 'dcs'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}>
            {tab === 'nameplate' && <FaMicrochip size={14} style={{ marginRight: '8px' }} />}
            {tab === 'tests' && <FaDatabase size={14} style={{ marginRight: '8px' }} />}
            {tab === 'dcs' && <FaChartBar size={14} style={{ marginRight: '8px' }} />}
            {tab === 'nameplate' ? 'Nameplate Data' : tab === 'tests' ? 'Test Results' : 'DCS Signals'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'nameplate' && <NameplateTab asset={asset} />}
      {activeTab === 'dcs' && <DCSTab assetId={asset.id} assetName={asset.asset_name} plantId={asset.plant_id} />}

      {/* Test Results Tab */}
      {activeTab === 'tests' && (
        <div style={s.tabContent}>
          {/* Test Type Selector */}
          <div style={s.testHeader}>
            <div style={s.testTypeWrapper}>
              <label style={s.testTypeLabel}>Test Type</label>
              <select value={selectedTestType} onChange={handleTestTypeChange} style={s.select}>
                <option value="">Select Test Type</option>
                {testTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.test_name}</option>)}
              </select>
            </div>

            {selectedTestType && (
              <div style={s.headerActions}>
                <button onClick={() => setShowColumnSelector(!showColumnSelector)} style={s.columnSelectorButton}>
                  📊 Columns ▼
                </button>
                <button onClick={() => setShowAddMenu(true)} style={s.addButton}>+ Add Test Result</button>
                {selectedRows.length > 0 && (
                  <button onClick={handleBulkDelete} style={s.bulkDeleteButton}>🗑 Delete ({selectedRows.length})</button>
                )}
                {isDGA && selectedRows.length > 0 && (
                  <button onClick={calculateDgaAlgorithms} style={algoLoading ? s.algoLoadingButton : s.algoButton} disabled={algoLoading}>
                    {algoLoading ? '⏳ Calculating...' : '🧪 Analyze DGA'}
                  </button>
                )}
                {isDGA && (
                  <span style={{ fontSize: '12px', color: (statusLoading.ieee || statusLoading.iec) ? '#f59e0b' : '#10b981' }}>
                    {(statusLoading.ieee || statusLoading.iec) ? '🔄 Loading...' : '✅ Status Ready'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Column Selector */}
          {showColumnSelector && selectedTestType && (
            <div style={s.columnSelectorWrapper}>
              <ColumnSelector
                visibleColumns={visibleColumns}
                testFields={testFields}
                onToggle={(key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))}
                onClose={() => setShowColumnSelector(false)}
                onShowAll={() => {
                  const all = { checkbox: true, test_date: true, lab_name: true, notes: true, actions: true, ieee_status: true, iec_status: true };
                  testFields.forEach(f => all[f.field_name] = true);
                  setVisibleColumns(all);
                }}
                onShowDefault={() => {
                  const def = { checkbox: true, test_date: true, lab_name: false, notes: false, actions: true, ieee_status: true, iec_status: true };
                  testFields.forEach(f => def[f.field_name] = DGA_GASES.includes(f.field_name));
                  setVisibleColumns(def);
                }}
              />
            </div>
          )}

          {/* Empty State */}
          {selectedTestType && testResults.length === 0 && (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📊</div>
              <h3 style={s.emptyTitle}>No Test Results Found</h3>
              <p style={s.emptyText}>No test results found for {selectedTestTypeName}</p>
              <button onClick={() => { setEditingResult(null); setTestFormData({ test_date: new Date().toISOString().split('T')[0] }); setShowTestForm(true); }} style={s.emptyButton}>
                + Add First Test Result
              </button>
            </div>
          )}

          {/* Results Table */}
          {testResults.length > 0 && (
            <div style={s.tableContainer}>
              <div style={s.tableHeaderWrapper}>
                <h3 style={s.tableTitle}>Test History - {selectedTestTypeName} <span style={s.tableCount}>({totalRecords} records)</span></h3>
              </div>

              <Pagination currentPage={currentPage} totalRecords={totalRecords} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} />

              <div style={s.tableWrapper}>
                <table style={s.dataTable}>
                  <thead>
                    <tr>
                      {visibleColumns.checkbox !== false && <th style={s.thCheckbox}><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>}
                      {visibleColumns.test_date !== false && <th style={s.th}>Test Date</th>}
                      {/* {visibleColumns.lab_name !== false && <th style={s.th}>Lab</th>} */}
                      {isDGA && visibleColumns.ieee_status !== false && <th style={s.th}>IEEE</th>}
                      {isDGA && visibleColumns.iec_status !== false && <th style={s.th}>IEC</th>}
                      {testFields.map(f => visibleColumns[f.field_name] !== false && <th key={f.id} style={s.th}>{f.display_name}</th>)}
                      {visibleColumns.notes !== false && <th style={s.th}>Notes</th>}
                      {visibleColumns.actions !== false && <th style={s.th}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map(result => {
                      const isChecked = selectedRows.includes(result.id);
                      const ieee = statusMap.ieee[result.id];
                      const iec = statusMap.iec[result.id];
                      const ieeeBadge = getBadge('IEEE', ieee?.status, ieee?.status_code);
                      const iecBadge = getBadge('IEC', iec?.status, iec?.status_code);

                      return (
                        <tr key={result.id} style={isChecked ? s.trSelected : s.tr}>
                          {visibleColumns.checkbox !== false && <td style={s.tdCheckbox}><input type="checkbox" checked={isChecked} onChange={() => handleRowSelect(result.id)} /></td>}
                          {visibleColumns.test_date !== false && <td style={s.td}>{new Date(result.test_date).toLocaleDateString()}</td>}
                          {/* {visibleColumns.lab_name !== false && <td style={s.td}>{result.lab_name || '-'}</td>} */}
                          {isDGA && visibleColumns.ieee_status !== false && (
                            <td style={s.td}>
                              {statusLoading.ieee ? <span style={{ fontSize: '11px', color: '#94a3b8' }}>⏳</span> :
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: ieeeBadge.bg, color: ieeeBadge.color, fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                  {ieeeBadge.icon} {ieeeBadge.label}
                                </span>
                              }
                            </td>
                          )}
                          {isDGA && visibleColumns.iec_status !== false && (
                            <td style={s.td}>
                              {statusLoading.iec ? <span style={{ fontSize: '11px', color: '#94a3b8' }}>⏳</span> :
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: iecBadge.bg, color: iecBadge.color, fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                  {iecBadge.icon} {iecBadge.label}
                                </span>
                              }
                            </td>
                          )}
                          {testFields.map(field => {
                            if (visibleColumns[field.field_name] === false) return null;
                            const param = result.parameters?.find(p => p.field_name === field.field_name);
                            let value = '-', unit = '';
                            if (param) {
                              if (param.field_value !== null) { value = param.field_value; unit = param.unit || ''; }
                              else if (param.field_value_text) value = param.field_value_text;
                              else if (param.field_value_date) value = new Date(param.field_value_date).toLocaleDateString();
                              else if (param.field_value_boolean !== null) value = param.field_value_boolean ? 'Yes' : 'No';
                            }
                            if (typeof value === 'number' && !Number.isInteger(value)) value = value.toFixed(2);
                            return <td key={field.id} style={s.tdCompact}>{value} {unit}</td>;
                          })}
                          {visibleColumns.notes !== false && <td style={s.tdNotes}>{result.notes || '-'}</td>}
                          {visibleColumns.actions !== false && (
                            <td style={s.tdActions}>
                              <button onClick={() => handleEdit(result)} style={s.editButton}>Edit</button>
                              <button onClick={() => handleDelete(result.id)} style={s.deleteButton}>Delete</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination currentPage={currentPage} totalRecords={totalRecords} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} />

              <div style={s.tableFooter}>
                <span>Total: {totalRecords} records</span>
                {selectedRows.length > 0 && <span>Selected: {selectedRows.length} records</span>}
              </div>
            </div>
          )}

          {/* DGA Results */}
          {showDgaAlgorithms && (
            <DGAAlgorithmsResults
              dgaResults={dgaResults}
              duvalData={algoData.duvalData || []}
              duval2Data={algoData.duval2Data || []}
              duval4Data={algoData.duval4Data || []}
              duval5Data={algoData.duval5Data || []}
              duval6Data={algoData.duval6Data || []}
              duvalPentagon1Data={algoData.duvalPentagon1Data || []}
              duvalPentagon2Data={algoData.duvalPentagon2Data || []}
              rogersData={algoData.rogersData || []}
              doernenburgData={algoData.doernenburgData || []}
              iec60599Data={algoData.iec60599Data || null}
              mlData1={algoData.mlData1 || []}
              mlData2={algoData.mlData2 || []}
              mlData3={algoData.mlData3 || []}
              mlData4={algoData.mlData4 || []}
              mlData5={algoData.mlData5 || []}
              algoError={algoError}
              onClose={() => { setShowDgaAlgorithms(false); setDgaResults([]); setAlgoData({}); }}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showTestForm && selectedTestType && (
        <TestResultForm
          editingResult={editingResult}
          selectedTestTypeName={selectedTestTypeName}
          testFields={testFields}
          testFormData={testFormData}
          setTestFormData={setTestFormData}
          onSubmit={handleSubmit}
          onCancel={() => { setShowTestForm(false); setEditingResult(null); }}
        />
      )}

      {showAddMenu && selectedTestType && (
        <AddResultMenu
          assetId={assetId}
          testTypeId={selectedTestType}
          testFields={testFields}
          onClose={() => setShowAddMenu(false)}
          onSuccess={() => { loadTestResults(selectedTestType); setShowAddMenu(false); }}
        />
      )}
    </div>
  );
}

// ============== STYLES ==============
const s = {
  container: { padding: '24px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#64748b' },
  loadingSpinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', background: 'white', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  backButton: { display: 'flex', alignItems: 'center', padding: '8px 16px', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  headerCenter: { display: 'flex', alignItems: 'center', gap: '16px', flex: 1 },
  assetIcon: { width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 },
  assetMeta: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' },
  assetCode: { fontSize: '13px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 10px', borderRadius: '4px' },
  assetTypeBadge: { fontSize: '13px', color: '#475569', background: '#f1f5f9', padding: '2px 10px', borderRadius: '4px' },
  assetStatus: { fontSize: '13px', fontWeight: '500' },
  headerRight: { fontSize: '13px', color: '#94a3b8' },
  assetId: { background: '#f1f5f9', padding: '4px 12px', borderRadius: '6px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '24px', background: 'white', padding: '6px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  tab: { display: 'flex', alignItems: 'center', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#64748b', background: 'transparent' },
  tabActive: { background: '#667eea', color: 'white', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' },
  tabContent: { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  testHeader: { display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
  testTypeWrapper: { flex: 1, minWidth: '200px' },
  testTypeLabel: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '4px' },
  select: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: 'white' },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  columnSelectorButton: { display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  addButton: { display: 'flex', alignItems: 'center', padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  bulkDeleteButton: { padding: '10px 16px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  algoButton: { padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  algoLoadingButton: { padding: '10px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '13px', fontWeight: '500', opacity: 0.7 },
  columnSelectorWrapper: { marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  emptyState: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '56px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' },
  emptyText: { fontSize: '14px', color: '#94a3b8', marginBottom: '20px' },
  emptyButton: { padding: '10px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  tableContainer: { marginTop: '16px' },
  tableHeaderWrapper: { marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: 0 },
  tableCount: { fontSize: '14px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' },
  tableFooter: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: '0 0 8px 8px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #e2e8f0' },
  tableWrapper: { overflowX: 'auto', marginTop: '8px' },
  dataTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 'auto' },
  th: { padding: '6px 8px', textAlign: 'left', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: '600', fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' },
  thCheckbox: { padding: '6px 8px', textAlign: 'center', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '30px' },
  td: { padding: '6px 8px', borderBottom: '1px solid #dee2e6', fontSize: '12px', color: '#1e293b', whiteSpace: 'nowrap' },
  tdCompact: { padding: '4px 6px', borderBottom: '1px solid #dee2e6', fontSize: '12px', color: '#1e293b', whiteSpace: 'nowrap', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' },
  tdCheckbox: { padding: '4px 6px', borderBottom: '1px solid #dee2e6', textAlign: 'center', width: '30px' },
  tdNotes: { padding: '4px 6px', borderBottom: '1px solid #dee2e6', fontSize: '12px', color: '#64748b', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tdActions: { padding: '4px 6px', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' },
  tr: { transition: 'background-color 0.2s' },
  trSelected: { backgroundColor: '#e3f2fd' },
  editButton: { marginRight: '4px', padding: '2px 8px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
  deleteButton: { padding: '2px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }
};

// Add global CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .add-btn:hover, .algo-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.3); }
  .back-btn:hover { background: #f1f5f9; }
  .column-selector-btn:hover { background: #e2e8f0; }
  .bulk-delete-btn:hover { background: #fecaca; }
  .tab:hover:not(.tab-active) { background: #f1f5f9; }
`;
document.head.appendChild(styleSheet);

export default AssetDetail;