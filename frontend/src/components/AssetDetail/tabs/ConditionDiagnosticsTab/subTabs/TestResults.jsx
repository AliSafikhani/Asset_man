import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../../../services/api';
import Pagination from '../../../Pagination';
import ColumnSelector from '../../../ColumnSelector';
import DGAAlgorithmsResults from '../../../DGAAlgorithmsResults';
import AddResultMenu from '../../../AddResultMenu';
import TestResultForm from '../../../TestResultForm';
import OilQualityForm from '../../../../../components/OilQualityForm';
import OilQualityResults from '../../../../../components/OilQualityResults';
import OilQualityTrend from '../../../../../components/OilQualityTrend';
import { oilQualityAPI } from '../../../../../services/api';
import { badge60422, badge60296 } from '../../../../../constants/oilQualityConstants';
import {
  DGA_GASES,
  GAS_KEYS,
  ALGO_MAP,
  DEFAULT_VISIBILITY_MAP,
} from '../../../../../constants/assetConstants';
import { getBadge, calculateAge, getDuplicateDateInfo, getDuplicateDateStyle } from '../../../../../utils/assetHelpers';

// Helper to get default visibility for a test type
const getDefaultVisibilityForTestType = (testTypeId, fields, testTypes) => {
  if (DEFAULT_VISIBILITY_MAP[testTypeId]) {
    const predefined = DEFAULT_VISIBILITY_MAP[testTypeId];
    const fullVisibility = { ...predefined };
    fields.forEach(f => {
      if (!(f.field_name in fullVisibility)) {
        fullVisibility[f.field_name] = false;
      }
    });
    return fullVisibility;
  }
  const isDga = testTypes?.find(t => t.id === testTypeId)?.test_name?.toLowerCase().includes('dga') || false;
  const def = {
    checkbox: true,
    test_date: true,
    lab_name: false,
    notes: false,
    actions: true,
    ieee_status: true,
    iec_status: true,
    iec60296_status: true,
    iec60422_status: true,
  };
  fields.forEach(f => {
    def[f.field_name] = isDga ? DGA_GASES.includes(f.field_name) : false;
  });
  return def;
};

const TestResults = ({ assetId, asset }) => {
  const assetType = asset?.asset_type;

  // ---- State ----
  const [testTypes, setTestTypes] = useState([]);
  const [selectedTestTypeId, setSelectedTestTypeId] = useState(null);
  const [testFields, setTestFields] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleColumnsByTestType, setVisibleColumnsByTestType] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testFormData, setTestFormData] = useState({});
  const [editingResult, setEditingResult] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError, setAlgoError] = useState(null);
  const [showDgaAlgorithms, setShowDgaAlgorithms] = useState(false);
  const [dgaResults, setDgaResults] = useState([]);
  const [algoData, setAlgoData] = useState({});
  const [statusMap, setStatusMap] = useState({ ieee: {}, iec: {} });
  const [statusLoading, setStatusLoading] = useState({ ieee: false, iec: false });
  const [sortConfig, setSortConfig] = useState({ key: 'test_date', direction: 'desc' });

  // ---- Oil Quality (IEC 60296 + IEC 60422) state ----
  const [oilStatusMap, setOilStatusMap] = useState({}); // test_result_id -> {iec60296_status, iec60422_status, operating_state}
  const [oilStatusLoading, setOilStatusLoading] = useState(false);
  const [showOilForm, setShowOilForm] = useState(false);
  const [oilEditingResult, setOilEditingResult] = useState(null);
  const [showOilResults, setShowOilResults] = useState(false);
  const [oilResultsData, setOilResultsData] = useState(null);
  const [oilResultsLoading, setOilResultsLoading] = useState(false);
  const [showOilTrend, setShowOilTrend] = useState(false);
  const [oilTrendData, setOilTrendData] = useState(null);
  const [oilTrendLoading, setOilTrendLoading] = useState(false);

  // ---- Computed ----
  const isDGA = useMemo(() => {
    const tt = testTypes.find(t => t.id === selectedTestTypeId);
    return tt?.test_name?.toLowerCase().includes('dga') || false;
  }, [testTypes, selectedTestTypeId]);

  const isOilQuality = useMemo(() => {
    const tt = testTypes.find(t => t.id === selectedTestTypeId);
    return tt?.test_name?.toLowerCase().includes('oil quality') || false;
  }, [testTypes, selectedTestTypeId]);

  const currentVisibleColumns = useMemo(() => {
    if (!selectedTestTypeId || !testFields.length) return {};
    const saved = visibleColumnsByTestType[selectedTestTypeId];
    if (saved) return saved;
    const def = getDefaultVisibilityForTestType(selectedTestTypeId, testFields, testTypes);
    setVisibleColumnsByTestType(prev => ({ ...prev, [selectedTestTypeId]: def }));
    return def;
  }, [selectedTestTypeId, testFields, testTypes, visibleColumnsByTestType]);

  const allColumnKeys = useMemo(() => {
    if (!selectedTestTypeId) return [];
    const special = ['checkbox', 'test_date', 'lab_name', 'notes', 'actions'];
    if (isDGA) {
      special.push('ieee_status', 'iec_status');
    }
    if (isOilQuality) {
      special.push('iec60296_status', 'iec60422_status');
    }
    const paramKeys = testFields.map(f => f.field_name);
    return [...new Set([...special, ...paramKeys])];
  }, [selectedTestTypeId, isDGA, isOilQuality, testFields]);

  // ---- Effects ----
  useEffect(() => {
    if (assetType) {
      API.get(`/test-types/?asset_type=${assetType}`)
        .then(res => setTestTypes(res.data))
        .catch(err => console.error(err));
    }
  }, [assetType]);

  useEffect(() => {
    if (testTypes.length > 0 && !selectedTestTypeId) {
      setSelectedTestTypeId(testTypes[0].id);
    }
  }, [testTypes]);

  useEffect(() => {
    if (selectedTestTypeId) {
      loadTestFields(selectedTestTypeId);
      loadTestResults(selectedTestTypeId);
    }
  }, [selectedTestTypeId]);

  useEffect(() => {
    if (isDGA && testResults.length > 1 && assetType === 'transformer') {
      loadStatus('ieee');
      loadStatus('iec');
    }
  }, [testResults, selectedTestTypeId, isDGA]);

  useEffect(() => {
    if (isOilQuality && testResults.length > 0 && assetType === 'transformer') {
      loadOilStatuses();
    } else {
      setOilStatusMap({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testResults, selectedTestTypeId, isOilQuality]);

  // ---- Data loading ----
  const loadTestFields = async (testTypeId) => {
    try {
      const res = await API.get(`/test-fields/test-type/${testTypeId}`);
      
      // ----- FIX: Exclude ANY field that looks like "laboratory" (name or display) -----
      const excludedNames = ['laboratory_name', 'laboratory', 'lab_name']; // lab_name is special, but we keep it as special column
      // We want to exclude the parameter field that would duplicate the special lab_name column.
      // The special column uses 'lab_name' from the result object, not from parameters.
      // So we exclude any parameter field with field_name or display_name containing 'laboratory' (case‑insensitive)
      const filtered = res.data.filter(f => {
        const name = f.field_name?.toLowerCase() || '';
        const display = f.display_name?.toLowerCase() || '';
        // Exclude if field_name is exactly 'laboratory_name' OR display_name contains 'laboratory name'
        // Also exclude if field_name is 'lab_name' because we already have that as a special column.
        if (name === 'laboratory_name' || name === 'lab_name') return false;
        if (display.includes('laboratory name')) return false;
        // More general: if display contains 'laboratory' and it's not the actual lab_name field (which we handle separately)
        if (display.includes('laboratory') && name !== 'lab_name') return false;
        return true;
      });

      console.log('Filtered fields (excluded laboratory duplicates):', filtered);
      setTestFields(filtered);

      const initialData = { test_date: new Date().toISOString().split('T')[0] };
      filtered.forEach(f => {
        initialData[f.field_name] = '';
      });
      setTestFormData(initialData);

      setVisibleColumnsByTestType(prev => {
        if (!prev[testTypeId]) {
          const def = getDefaultVisibilityForTestType(testTypeId, filtered, testTypes);
          return { ...prev, [testTypeId]: def };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error loading test fields:', error);
    }
  };

  const loadTestResults = async (testTypeId) => {
    setLoading(true);
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
      setShowDuplicatesOnly(false);
    } catch (error) {
      console.error('Error loading test results:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UPDATED loadStatus: IEEE uses LIVE endpoint (Option A)
  // IEC still uses legacy POST until we migrate it.
  // ============================================================
  const loadStatus = async (type) => {
    const setLoading = (v) => setStatusLoading(prev => ({ ...prev, [type]: v }));
    setLoading(true);
    try {
      // --- IEEE: NEW LIVE ENDPOINT (Option A) ---
      if (type === 'ieee') {
        if (!isDGA || testResults.length < 2) {
          setStatusMap(prev => ({ ...prev, ieee: {} }));
          setLoading(false);
          return;
        }

        // Call the new live diagnostics endpoint
        // const response = await API.get(`/api/v1/diagnostics/transformer/${assetId}/ieee`);
        const response = await API.get(`/diagnostics/transformer/${assetId}/ieee`);
        const results = response.data.data || [];
        const map = {};

        results.forEach(item => {
          if (item.id) {
            const code = parseInt(item.fault_zone) || 0;
            // Custom mapping for IEEE statuses
            const status = code === 1 ? 'Normal' : code === 2 ? 'Investigate' : code === 3 ? 'Action Required' : 'Unknown';
            map[item.id] = {
              status,
              status_code: code,
              zone_color: item.zone_color,
            };
          }
        });

        setStatusMap(prev => ({ ...prev, ieee: map }));
        setLoading(false);
        return; // Exit early, don't run legacy logic
      }

      // --- IEC: LEGACY LOGIC (Keep until we migrate IEC to live) ---
      if (type === 'iec') {
        if (!isDGA || testResults.length < 2) {
          setStatusMap(prev => ({ ...prev, iec: {} }));
          setLoading(false);
          return;
        }

        // Build samples for the legacy batch endpoint
        const samples = testResults.map(r => {
          const gasData = {};
          r.parameters.forEach(p => {
            if (GAS_KEYS.includes(p.field_name)) {
              gasData[p.field_name] = parseFloat(p.field_value) || 0;
            }
          });
          return { id: r.id, sample_date: r.test_date, gas_data: gasData };
        });

        // Use the old algorithms endpoint for IEC
        const response = await API.post(`/algorithms/transformer/dga/iec_algorithm/batch`, samples);
        const map = {};
        response.data.forEach(item => {
          if (item.id) {
            map[item.id] = {
              status: item.status || 'Unknown',
              status_code: item.status_code || 0,
              zone_color: item.zone_color,
            };
          }
        });

        setStatusMap(prev => ({ ...prev, iec: map }));
      }
    } catch (error) {
      console.error(`Error loading ${type} status:`, error);
      setStatusMap(prev => ({ ...prev, [type]: {} }));
    } finally {
      setLoading(false);
    }
  };
  // ============================================================
  // END OF UPDATED loadStatus
  // ============================================================

  // ---- Oil Quality: live IEC 60296 / 60422 statuses + analyze/trend ----
  const loadOilStatuses = async () => {
    setOilStatusLoading(true);
    try {
      const res = await oilQualityAPI.statuses(assetId);
      const rows = res.data?.data || [];
      const map = {};
      rows.forEach(row => {
        if (row.test_result_id != null) {
          map[row.test_result_id] = {
            iec60296_status: row.iec60296_status,
            iec60422_status: row.iec60422_status,
            operating_state: row.operating_state,
          };
        }
      });
      setOilStatusMap(map);
    } catch (error) {
      console.error('Error loading oil quality statuses:', error);
      setOilStatusMap({});
    } finally {
      setOilStatusLoading(false);
    }
  };

  const handleOilAnalyze = async (result) => {
    setShowOilResults(true);
    setOilResultsData(null);
    setOilResultsLoading(true);
    try {
      const res = await oilQualityAPI.assess(assetId, result.id);
      setOilResultsData(res.data?.data || null);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
      setShowOilResults(false);
    } finally {
      setOilResultsLoading(false);
    }
  };

  const handleOilTrend = async () => {
    setShowOilTrend(true);
    setOilTrendData(null);
    setOilTrendLoading(true);
    try {
      const res = await oilQualityAPI.trend(assetId);
      setOilTrendData(res.data?.data || null);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
      setShowOilTrend(false);
    } finally {
      setOilTrendLoading(false);
    }
  };

  const handleOilAdd = () => {
    setOilEditingResult(null);
    setShowOilForm(true);
  };

  const handleOilEdit = (result) => {
    setOilEditingResult(result);
    setShowOilForm(true);
  };

  const handleOilFormSuccess = () => {
    setShowOilForm(false);
    setOilEditingResult(null);
    loadTestResults(selectedTestTypeId);
  };

  // ---- Sort & filter ----
  const sortedAndFilteredResults = useMemo(() => {
    if (!testResults.length) return [];
    let sorted = [...testResults];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (sortConfig.key === 'test_date') {
          const dateA = new Date(a.test_date).getTime();
          const dateB = new Date(b.test_date).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
    }
    if (showDuplicatesOnly) {
      const dateCounts = {};
      sorted.forEach(r => { dateCounts[r.test_date] = (dateCounts[r.test_date] || 0) + 1; });
      const duplicateDates = Object.keys(dateCounts).filter(d => dateCounts[d] > 1);
      return sorted.filter(r => duplicateDates.includes(r.test_date));
    }
    return sorted;
  }, [testResults, sortConfig, showDuplicatesOnly]);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAndFilteredResults.slice(start, start + pageSize);
  }, [sortedAndFilteredResults, currentPage, pageSize]);

  const totalRecords = sortedAndFilteredResults.length;
  const totalDuplicateRecords = testResults.length - totalRecords;

  // ---- Handlers ----
  const handleTestTypeChange = (testTypeId) => {
    setSelectedTestTypeId(testTypeId);
    setStatusMap({ ieee: {}, iec: {} });
    setShowTestForm(false);
    setEditingResult(null);
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
        unit: field.unit,
      };
    });
    const testData = {
      asset_id: parseInt(assetId),
      test_type_id: parseInt(selectedTestTypeId),
      test_date: testFormData.test_date,
      lab_name: testFormData.lab_name || null,
      notes: testFormData.notes || null,
      parameters,
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
      await loadTestResults(selectedTestTypeId);
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
      await loadTestResults(selectedTestTypeId);
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
      await loadTestResults(selectedTestTypeId);
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

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleToggleColumn = (key) => {
    setVisibleColumnsByTestType(prev => {
      const current = prev[selectedTestTypeId] || getDefaultVisibilityForTestType(selectedTestTypeId, testFields, testTypes);
      return {
        ...prev,
        [selectedTestTypeId]: {
          ...current,
          [key]: !current[key],
        },
      };
    });
  };

  const handleShowAllColumns = () => {
    const all = {};
    allColumnKeys.forEach(key => { all[key] = true; });
    setVisibleColumnsByTestType(prev => ({ ...prev, [selectedTestTypeId]: all }));
  };

  const handleShowDefaultColumns = () => {
    const def = getDefaultVisibilityForTestType(selectedTestTypeId, testFields, testTypes);
    setVisibleColumnsByTestType(prev => ({ ...prev, [selectedTestTypeId]: def }));
  };

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
        result.parameters.forEach(p => {
          if (p.field_value !== null) params[p.field_name] = p.field_value;
        });
        const algos = await API.get('/algorithms/transformer/dga');
        const algoResults = {};
        for (const algo of algos.data) {
          try {
            const id = ALGO_MAP[algo.id] || algo.id;
            const sample = [{
              id: result.id,
              sample_date: result.test_date,
              gas_data: {
                ch4: params.ch4 || 0,
                c2h2: params.c2h2 || 0,
                c2h4: params.c2h4 || 0,
                h2: params.h2 || 0,
                c2h6: params.c2h6 || 0,
                co: params.co || 0,
                co2: params.co2 || 0,
                o2: params.o2 || 0,
                n2: params.n2 || 0,
              },
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
          gas_data: {
            ch4: params.ch4 || 0,
            c2h2: params.c2h2 || 0,
            c2h4: params.c2h4 || 0,
            h2: params.h2 || 0,
            c2h6: params.c2h6 || 0,
            co: params.co || 0,
            co2: params.co2 || 0,
            o2: params.o2 || 0,
            n2: params.n2 || 0,
          },
        });
      }
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
        { id: 'ml_dga_1', key: 'mlData1' },
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

  // ---- Render ----
  const selectedTestTypeName = testTypes.find(t => t.id === selectedTestTypeId)?.test_name;
  const subTabs = testTypes.map(tt => ({ id: tt.id, label: tt.test_name }));

  // -------- TABLE STYLES (dark text) --------
  const tableStyles = {
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      color: '#0f172a',
    },
    th: {
      padding: '10px 12px',
      textAlign: 'left',
      backgroundColor: '#f1f5f9',
      fontWeight: '600',
      color: '#0f172a',
      borderBottom: '2px solid #e2e8f0',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '8px 12px',
      borderBottom: '1px solid #e2e8f0',
      color: '#1e293b',
      fontSize: '13px',
    },
    tdActions: {
      padding: '8px 12px',
      borderBottom: '1px solid #e2e8f0',
      whiteSpace: 'nowrap',
    },
    trSelected: {
      backgroundColor: '#e3f2fd',
    },
    trEven: {
      backgroundColor: '#ffffff',
    },
    trOdd: {
      backgroundColor: '#f8fafc',
    },
    editButton: {
      marginRight: '4px',
      padding: '2px 8px',
      backgroundColor: '#FF9800',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '11px',
    },
    deleteButton: {
      padding: '2px 8px',
      backgroundColor: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '11px',
    },
  };

  return (
    <div>
      {/* Test type sub‑tabs (horizontal list) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTestTypeChange(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: selectedTestTypeId === tab.id ? '#667eea' : 'transparent',
              color: selectedTestTypeId === tab.id ? 'white' : '#475569',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '13px',
              fontWeight: selectedTestTypeId === tab.id ? '600' : '500',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTestTypeId && (
        <>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
              style={{
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: showDuplicatesOnly ? '#dbeafe' : '#f1f5f9',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#1e293b',
              }}
            >
              📅 {showDuplicatesOnly ? 'All Results' : 'Duplicate Dates'}
              {showDuplicatesOnly && totalDuplicateRecords > 0 && (
                <span style={{ marginLeft: '4px', background: '#3b82f6', color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '10px' }}>
                  {totalDuplicateRecords}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}
            >
              📊 Columns ▼
            </button>
            <button
              onClick={() => (isOilQuality ? handleOilAdd() : setShowAddMenu(true))}
              style={{ padding: '6px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              + Add Test Result
            </button>
            {isOilQuality && assetType === 'transformer' && (
              <button
                onClick={handleOilTrend}
                disabled={testResults.length < 2}
                title={testResults.length < 2 ? 'Need at least 2 tests for a trend' : ''}
                style={{ padding: '6px 16px', background: testResults.length < 2 ? '#cbd5e1' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '6px', cursor: testResults.length < 2 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
              >
                📈 Trend Analyze
              </button>
            )}
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkDelete}
                style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                🗑 Delete ({selectedRows.length})
              </button>
            )}
            {isDGA && selectedRows.length > 0 && (
              <button
                onClick={calculateDgaAlgorithms}
                style={{ padding: '6px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                🧪 Analyze DGA
              </button>
            )}
            {isDGA && (
              <span style={{ fontSize: '12px', color: (statusLoading.ieee || statusLoading.iec) ? '#f59e0b' : '#10b981' }}>
                {(statusLoading.ieee || statusLoading.iec) ? '🔄 Loading...' : '✅ Status Ready'}
              </span>
            )}
            {isOilQuality && assetType === 'transformer' && (
              <span style={{ fontSize: '12px', color: oilStatusLoading ? '#f59e0b' : '#10b981' }}>
                {oilStatusLoading ? '🔄 Loading...' : '✅ Status Ready'}
              </span>
            )}
          </div>

          {/* Column Selector */}
          {showColumnSelector && (
            <ColumnSelector
              visibleColumns={currentVisibleColumns}
              testFields={testFields}
              onToggle={handleToggleColumn}
              onClose={() => setShowColumnSelector(false)}
              onShowAll={handleShowAllColumns}
              onShowDefault={handleShowDefaultColumns}
            />
          )}

          {/* Duplicate info banner */}
          {testResults.length > 0 && (
            <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#1e293b' }}>
              {/* <span>ℹ️ {showDuplicatesOnly ? `Showing ${totalRecords} results with duplicate dates` : `Total: ${testResults.length} results | ${testResults.length - totalRecords} unique dates`}</span> */}
            </div>
          )}

          {/* Results table or empty state */}
          {testResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              <div style={{ fontSize: '48px' }}>📊</div>
              <h3 style={{ color: '#1e293b' }}>No Test Results Found</h3>
              <p>No test results found for {selectedTestTypeName}</p>
              <button
                onClick={() => { if (isOilQuality) { handleOilAdd(); } else { setEditingResult(null); setShowTestForm(true); } }}
                style={{ marginTop: '12px', padding: '8px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                + Add First Test Result
              </button>
            </div>
          ) : (
            <>
              <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
              />
              <div style={{ overflowX: 'auto', marginTop: '8px' }}>
                <table style={tableStyles.table}>
                  <thead>
                    <tr>
                      {currentVisibleColumns.checkbox !== false && (
                        <th style={tableStyles.th}>
                          <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                        </th>
                      )}
                      {currentVisibleColumns.test_date !== false && (
                        <th style={{ ...tableStyles.th, cursor: 'pointer' }} onClick={() => handleSort('test_date')}>
                          Test Date {sortConfig.key === 'test_date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                      )}
                      {currentVisibleColumns.lab_name !== false && <th style={tableStyles.th}>Laboratory Name</th>}
                      {isDGA && currentVisibleColumns.ieee_status !== false && <th style={tableStyles.th}>IEEE</th>}
                      {isDGA && currentVisibleColumns.iec_status !== false && <th style={tableStyles.th}>IEC</th>}
                      {isOilQuality && currentVisibleColumns.iec60296_status !== false && <th style={tableStyles.th}>IEC 60296</th>}
                      {isOilQuality && currentVisibleColumns.iec60422_status !== false && <th style={tableStyles.th}>IEC 60422</th>}
                      {testFields.map(f => currentVisibleColumns[f.field_name] !== false && (
                        <th key={f.id} style={tableStyles.th}>{f.display_name}</th>
                      ))}
                      {currentVisibleColumns.notes !== false && <th style={tableStyles.th}>Notes</th>}
                      {currentVisibleColumns.actions !== false && <th style={tableStyles.th}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map(result => {
                      const isChecked = selectedRows.includes(result.id);
                      const ieee = statusMap.ieee[result.id];
                      const iec = statusMap.iec[result.id];
                      const ieeeBadge = getBadge('IEEE', ieee?.status, ieee?.status_code);
                      const iecBadge = getBadge('IEC', iec?.status, iec?.status_code);
                      const duplicateInfo = getDuplicateDateInfo(result.test_date, testResults);
                      const duplicateStyle = getDuplicateDateStyle(result.test_date, testResults, result.id);
                      const rowStyle = {
                        background: isChecked ? tableStyles.trSelected.backgroundColor : (paginatedResults.indexOf(result) % 2 === 0 ? tableStyles.trEven.backgroundColor : tableStyles.trOdd.backgroundColor),
                        ...duplicateStyle,
                      };
                      return (
                        <tr key={result.id} style={rowStyle}>
                          {currentVisibleColumns.checkbox !== false && (
                            <td style={tableStyles.td}>
                              <input type="checkbox" checked={isChecked} onChange={() => handleRowSelect(result.id)} />
                            </td>
                          )}
                          {currentVisibleColumns.test_date !== false && (
                            <td style={tableStyles.td} title={duplicateInfo.isDuplicate ? duplicateInfo.message : ''}>
                              {new Date(result.test_date).toLocaleDateString()}
                              {duplicateInfo.isDuplicate && (
                                <span style={{ marginLeft: '4px', padding: '1px 6px', background: '#3b82f6', color: 'white', borderRadius: '10px', fontSize: '9px' }}>{duplicateInfo.count}x</span>
                              )}
                            </td>
                          )}
                          {currentVisibleColumns.lab_name !== false && <td style={tableStyles.td}>{result.lab_name || '-'}</td>}
                          {isDGA && currentVisibleColumns.ieee_status !== false && (
                            <td style={tableStyles.td}>
                              {statusLoading.ieee ? '⏳' : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: ieeeBadge.bg, color: ieeeBadge.color, fontSize: '11px' }}>
                                  {React.createElement(ieeeBadge.icon, { size: 12 })} {ieeeBadge.label}
                                </span>
                              )}
                            </td>
                          )}
                          {isDGA && currentVisibleColumns.iec_status !== false && (
                            <td style={tableStyles.td}>
                              {statusLoading.iec ? '⏳' : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: iecBadge.bg, color: iecBadge.color, fontSize: '11px' }}>
                                  {React.createElement(iecBadge.icon, { size: 12 })} {iecBadge.label}
                                </span>
                              )}
                            </td>
                          )}
                          {isOilQuality && currentVisibleColumns.iec60296_status !== false && (
                            <td style={tableStyles.td}>
                              {oilStatusLoading ? '⏳' : (() => {
                                const b = badge60296(oilStatusMap[result.id]?.iec60296_status);
                                return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', background: b.bg, color: b.color, fontSize: '11px', fontWeight: 700 }}>{b.label}</span>;
                              })()}
                            </td>
                          )}
                          {isOilQuality && currentVisibleColumns.iec60422_status !== false && (
                            <td style={tableStyles.td}>
                              {oilStatusLoading ? '⏳' : (() => {
                                const b = badge60422(oilStatusMap[result.id]?.iec60422_status);
                                return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', background: b.bg, color: b.color, fontSize: '11px', fontWeight: 700 }}>{b.label}</span>;
                              })()}
                            </td>
                          )}
                          {testFields.map(field => {
                            if (currentVisibleColumns[field.field_name] === false) return null;
                            const param = result.parameters?.find(p => p.field_name === field.field_name);
                            let value = '-', unit = '';
                            if (param) {
                              if (param.field_value !== null) { value = param.field_value; unit = param.unit || ''; }
                              else if (param.field_value_text) value = param.field_value_text;
                              else if (param.field_value_date) value = new Date(param.field_value_date).toLocaleDateString();
                              else if (param.field_value_boolean !== null) value = param.field_value_boolean ? 'Yes' : 'No';
                            }
                            if (typeof value === 'number' && !Number.isInteger(value)) value = value.toFixed(2);
                            return <td key={field.id} style={tableStyles.td}>{value} {unit}</td>;
                          })}
                          {currentVisibleColumns.notes !== false && <td style={tableStyles.td}>{result.notes || '-'}</td>}
                          {currentVisibleColumns.actions !== false && (
                            <td style={tableStyles.tdActions}>
                              {isOilQuality && (
                                <button
                                  onClick={() => handleOilAnalyze(result)}
                                  style={{ marginRight: '4px', padding: '2px 8px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                >
                                  Analyze
                                </button>
                              )}
                              <button onClick={() => (isOilQuality ? handleOilEdit(result) : handleEdit(result))} style={tableStyles.editButton}>Edit</button>
                              <button onClick={() => handleDelete(result.id)} style={tableStyles.deleteButton}>Delete</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
              />
            </>
          )}

          {/* DGA Results Modal */}
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

          {/* Forms */}
          {showTestForm && (
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
          {showAddMenu && (
            <AddResultMenu
              assetId={assetId}
              testTypeId={selectedTestTypeId}
              testFields={testFields}
              onClose={() => setShowAddMenu(false)}
              onSuccess={() => { loadTestResults(selectedTestTypeId); setShowAddMenu(false); }}
            />
          )}

          {/* Oil Quality: add/edit form */}
          {showOilForm && (
            <OilQualityForm
              assetId={assetId}
              testTypeId={selectedTestTypeId}
              editingResult={oilEditingResult}
              onClose={() => { setShowOilForm(false); setOilEditingResult(null); }}
              onSuccess={handleOilFormSuccess}
            />
          )}

          {/* Oil Quality: per-test analyze dashboard */}
          {showOilResults && (
            oilResultsLoading || !oilResultsData ? (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: '#fff', fontSize: '16px' }}>
                🔄 Loading analysis…
              </div>
            ) : (
              <OilQualityResults
                data={oilResultsData}
                onClose={() => { setShowOilResults(false); setOilResultsData(null); }}
              />
            )
          )}

          {/* Oil Quality: series trend analysis */}
          {showOilTrend && (
            oilTrendLoading || !oilTrendData ? (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: '#fff', fontSize: '16px' }}>
                🔄 Loading trend…
              </div>
            ) : (
              <OilQualityTrend
                data={oilTrendData}
                onClose={() => { setShowOilTrend(false); setOilTrendData(null); }}
              />
            )
          )}
        </>
      )}
    </div>
  );
};

export default TestResults;