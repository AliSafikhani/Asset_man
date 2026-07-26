// frontend/src/components/AssetDetail/tabs/TestsTab/index.jsx
// Full implementation with alphabetically sorted test‑type sub‑tabs

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../../services/api';
import TabNavigation from '../../common/TabNavigation';
import Pagination from '../../Pagination';
import ColumnSelector from '../../ColumnSelector';
import DGAAlgorithmsResults from '../../DGAAlgorithmsResults';
import AddResultMenu from '../../AddResultMenu';
import TestResultForm from '../../TestResultForm';
import {
  DGA_GASES,
  GAS_KEYS,
  ALGO_MAP,
  DEFAULT_VISIBILITY_MAP,
} from '../../../../constants/assetConstants';
import { getBadge, calculateAge, getDuplicateDateInfo, getDuplicateDateStyle } from '../../../../utils/assetHelpers';

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
  };
  fields.forEach(f => {
    def[f.field_name] = isDga ? DGA_GASES.includes(f.field_name) : false;
  });
  return def;
};

function TestsTab({ assetId, asset }) {
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

  // ---- Computed ----
  const isDGA = useMemo(() => {
    const tt = testTypes.find(t => t.id === selectedTestTypeId);
    return tt?.test_name?.toLowerCase().includes('dga') || false;
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
    const paramKeys = testFields.map(f => f.field_name);
    return [...new Set([...special, ...paramKeys])];
  }, [selectedTestTypeId, isDGA, testFields]);

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

  // ---- Data loading ----
  const loadTestFields = async (testTypeId) => {
    try {
      const res = await API.get(`/test-fields/test-type/${testTypeId}`);
      const EXCLUDED_FIELDS = ['laboratory_name'];
      const filtered = res.data.filter(f => !EXCLUDED_FIELDS.includes(f.field_name));
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
      if (type === 'ieee') {
        const age = asset?.commissioning_date ? calculateAge(asset.commissioning_date) : 'NA';
        endpoint += `?transformer_age=${age}&max_day=730`;
      }
      const response = await API.post(endpoint, samples);
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
              zone_color: item.zone_color,
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

  // 🔽 FIX: Sort test types alphabetically
  const sortedTestTypes = useMemo(() => {
    return [...testTypes].sort((a, b) => a.test_name.localeCompare(b.test_name));
  }, [testTypes]);

  const subTabs = sortedTestTypes.map(tt => ({
    id: tt.id,
    label: tt.test_name,
  }));

  // ---- Styles ----
  const styles = {
    duplicateInfoBanner: {
      marginBottom: '16px',
      padding: '10px 16px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    },
    duplicateInfoContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px',
    },
    duplicateInfoIcon: { fontSize: '14px', marginRight: '8px' },
    duplicateInfoText: { fontSize: '13px', color: '#475569' },
    duplicateLegend: { display: 'flex', alignItems: 'center', gap: '8px' },
    duplicateBadge: {
      display: 'inline-block',
      marginLeft: '4px',
      padding: '0 6px',
      background: '#3b82f6',
      color: 'white',
      borderRadius: '10px',
      fontSize: '10px',
      fontWeight: 'bold',
    },
    headerActions: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: '20px',
    },
    duplicateFilterButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    columnSelectorButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      background: '#f1f5f9',
      color: '#475569',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
    },
    addButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
    },
    bulkDeleteButton: {
      padding: '10px 16px',
      background: '#fef2f2',
      color: '#ef4444',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
    },
    algoButton: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
    },
    algoLoadingButton: {
      padding: '10px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'not-allowed',
      fontSize: '13px',
      fontWeight: '500',
      opacity: 0.7,
    },
    columnSelectorWrapper: {
      marginBottom: '20px',
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    },
    emptyState: { textAlign: 'center', padding: '60px 20px' },
    emptyIcon: { fontSize: '56px', marginBottom: '16px' },
    emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' },
    emptyText: { fontSize: '14px', color: '#94a3b8', marginBottom: '20px' },
    emptyButton: {
      padding: '10px 24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
    },
    tableContainer: { marginTop: '16px' },
    tableHeaderWrapper: { marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tableTitle: { fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: 0 },
    tableCount: { fontSize: '14px', fontWeight: '400', color: '#94a3b8', marginLeft: '8px' },
    tableWrapper: { overflowX: 'auto', marginTop: '8px' },
    dataTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: 'auto' },
    th: {
      padding: '6px 8px',
      textAlign: 'left',
      backgroundColor: '#f8f9fa',
      borderBottom: '2px solid #dee2e6',
      fontWeight: '600',
      fontSize: '11px',
      color: '#475569',
      whiteSpace: 'nowrap',
    },
    thCheckbox: {
      padding: '6px 8px',
      textAlign: 'center',
      backgroundColor: '#f8f9fa',
      borderBottom: '2px solid #dee2e6',
      width: '30px',
    },
    td: { padding: '6px 8px', borderBottom: '1px solid #dee2e6', fontSize: '12px', color: '#1e293b', whiteSpace: 'nowrap' },
    tdCompact: {
      padding: '4px 6px',
      borderBottom: '1px solid #dee2e6',
      fontSize: '12px',
      color: '#1e293b',
      whiteSpace: 'nowrap',
      maxWidth: '80px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    tdCheckbox: { padding: '4px 6px', borderBottom: '1px solid #dee2e6', textAlign: 'center', width: '30px' },
    tdNotes: {
      padding: '4px 6px',
      borderBottom: '1px solid #dee2e6',
      fontSize: '12px',
      color: '#64748b',
      maxWidth: '120px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    tdActions: { padding: '4px 6px', borderBottom: '1px solid #dee2e6', whiteSpace: 'nowrap' },
    tr: { transition: 'background-color 0.2s ease' },
    trSelected: { backgroundColor: '#e3f2fd' },
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
    sortableHeader: {
      cursor: 'pointer',
      userSelect: 'none',
    },
    duplicateCountBadge: {
      marginLeft: '4px',
      padding: '1px 6px',
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '10px',
      fontSize: '9px',
      fontWeight: 'bold',
      display: 'inline-block',
    },
    tableFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#f8fafc',
      borderRadius: '0 0 8px 8px',
      fontSize: '13px',
      color: '#64748b',
      borderTop: '1px solid #e2e8f0',
    },
  };

  return (
    <div>
      {testTypes.length > 0 && (
        <TabNavigation
          tabs={subTabs}
          activeId={selectedTestTypeId}
          onSelect={handleTestTypeChange}
        />
      )}

      {selectedTestTypeId && (
        <div style={styles.headerActions}>
          <button
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            style={{
              ...styles.duplicateFilterButton,
              backgroundColor: showDuplicatesOnly ? '#dbeafe' : '#f1f5f9',
              color: showDuplicatesOnly ? '#3b82f6' : '#475569',
              borderColor: showDuplicatesOnly ? '#3b82f6' : '#e2e8f0',
            }}
          >
            📅 {showDuplicatesOnly ? 'All Results' : 'Duplicate Dates'}
            {showDuplicatesOnly && totalDuplicateRecords > 0 && (
              <span style={styles.duplicateBadge}>{totalDuplicateRecords}</span>
            )}
          </button>
          <button onClick={() => setShowColumnSelector(!showColumnSelector)} style={styles.columnSelectorButton}>
            📊 Columns ▼
          </button>
          <button onClick={() => setShowAddMenu(true)} style={styles.addButton}>+ Add Test Result</button>
          {selectedRows.length > 0 && (
            <button onClick={handleBulkDelete} style={styles.bulkDeleteButton}>
              🗑 Delete ({selectedRows.length})
            </button>
          )}
          {isDGA && selectedRows.length > 0 && (
            <button
              onClick={calculateDgaAlgorithms}
              style={algoLoading ? styles.algoLoadingButton : styles.algoButton}
              disabled={algoLoading}
            >
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

      {showColumnSelector && selectedTestTypeId && (
        <div style={styles.columnSelectorWrapper}>
          <ColumnSelector
            visibleColumns={currentVisibleColumns}
            testFields={testFields}
            onToggle={handleToggleColumn}
            onClose={() => setShowColumnSelector(false)}
            onShowAll={handleShowAllColumns}
            onShowDefault={handleShowDefaultColumns}
          />
        </div>
      )}

      {selectedTestTypeId && testResults.length > 0 && (
        <div style={styles.duplicateInfoBanner}>
          <div style={styles.duplicateInfoContent}>
            <span style={styles.duplicateInfoIcon}>ℹ️</span>
            <span style={styles.duplicateInfoText}>
              {showDuplicatesOnly ? (
                <>Showing <strong>{totalRecords}</strong> results with duplicate dates</>
              ) : (
                <>
                  Total: <strong>{testResults.length}</strong> results |
                  <span style={{ color: '#3b82f6', marginLeft: '4px' }}>
                    <strong>{testResults.length - totalRecords}</strong> results with unique dates
                  </span>
                  {testResults.length - totalRecords > 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#94a3b8' }}>
                      (Click "Duplicate Dates" to view only duplicates)
                    </span>
                  )}
                </>
              )}
            </span>
            {!showDuplicatesOnly && (
              <span style={styles.duplicateLegend}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#ebf5ff',
                    borderLeft: '3px solid #3b82f6',
                    borderRadius: '2px',
                  }}></span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Same date tests</span>
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {selectedTestTypeId && testResults.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📊</div>
          <h3 style={styles.emptyTitle}>No Test Results Found</h3>
          <p style={styles.emptyText}>No test results found for {selectedTestTypeName}</p>
          <button
            onClick={() => {
              setEditingResult(null);
              setTestFormData({ test_date: new Date().toISOString().split('T')[0] });
              setShowTestForm(true);
            }}
            style={styles.emptyButton}
          >
            + Add First Test Result
          </button>
        </div>
      ) : (
        selectedTestTypeId && (
          <div style={styles.tableContainer}>
            <div style={styles.tableHeaderWrapper}>
              <h3 style={styles.tableTitle}>
                Test History - {selectedTestTypeName}
                <span style={styles.tableCount}>
                  ({totalRecords} {totalRecords === 1 ? 'record' : 'records'}
                  {showDuplicatesOnly && ' - duplicate dates only'}
                  )
                </span>
              </h3>
            </div>

            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            />

            <div style={styles.tableWrapper}>
              <table style={styles.dataTable}>
                <thead>
                  <tr>
                    {currentVisibleColumns.checkbox !== false && (
                      <th style={styles.thCheckbox}>
                        <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                      </th>
                    )}
                    {currentVisibleColumns.test_date !== false && (
                      <th
                        style={{ ...styles.th, ...styles.sortableHeader, cursor: 'pointer' }}
                        onClick={() => handleSort('test_date')}
                      >
                        Test Date
                        {sortConfig.key === 'test_date' && (
                          <span style={{ marginLeft: '4px' }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    )}
                    {currentVisibleColumns.lab_name !== false && <th style={styles.th}>Lab Name</th>}
                    {isDGA && currentVisibleColumns.ieee_status !== false && <th style={styles.th}>IEEE</th>}
                    {isDGA && currentVisibleColumns.iec_status !== false && <th style={styles.th}>IEC</th>}
                    {testFields.map(f =>
                      currentVisibleColumns[f.field_name] !== false && (
                        <th key={f.id} style={styles.th}>{f.display_name}</th>
                      )
                    )}
                    {currentVisibleColumns.notes !== false && <th style={styles.th}>Notes</th>}
                    {currentVisibleColumns.actions !== false && <th style={styles.th}>Actions</th>}
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
                      ...(isChecked ? styles.trSelected : styles.tr),
                      ...duplicateStyle,
                    };

                    return (
                      <tr key={result.id} style={rowStyle}>
                        {currentVisibleColumns.checkbox !== false && (
                          <td style={styles.tdCheckbox}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleRowSelect(result.id)}
                            />
                          </td>
                        )}
                        {currentVisibleColumns.test_date !== false && (
                          <td style={styles.td} title={duplicateInfo.isDuplicate ? duplicateInfo.message : ''}>
                            {new Date(result.test_date).toLocaleDateString()}
                            {duplicateInfo.isDuplicate && (
                              <span style={styles.duplicateCountBadge}>{duplicateInfo.count}x</span>
                            )}
                          </td>
                        )}
                        {currentVisibleColumns.lab_name !== false && (
                          <td style={styles.td}>{result.lab_name || '-'}</td>
                        )}
                        {isDGA && currentVisibleColumns.ieee_status !== false && (
                          <td style={styles.td}>
                            {statusLoading.ieee ? (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>⏳</span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: ieeeBadge.bg,
                                color: ieeeBadge.color,
                                fontSize: '11px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                              }}>
                                {React.createElement(ieeeBadge.icon, { size: 12 })} {ieeeBadge.label}
                              </span>
                            )}
                          </td>
                        )}
                        {isDGA && currentVisibleColumns.iec_status !== false && (
                          <td style={styles.td}>
                            {statusLoading.iec ? (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>⏳</span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: iecBadge.bg,
                                color: iecBadge.color,
                                fontSize: '11px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                              }}>
                                {React.createElement(iecBadge.icon, { size: 12 })} {iecBadge.label}
                              </span>
                            )}
                          </td>
                        )}
                        {testFields.map(field => {
                          if (currentVisibleColumns[field.field_name] === false) return null;
                          const param = result.parameters?.find(p => p.field_name === field.field_name);
                          let value = '-', unit = '';
                          if (param) {
                            if (param.field_value !== null) {
                              value = param.field_value;
                              unit = param.unit || '';
                            } else if (param.field_value_text) value = param.field_value_text;
                            else if (param.field_value_date) value = new Date(param.field_value_date).toLocaleDateString();
                            else if (param.field_value_boolean !== null) value = param.field_value_boolean ? 'Yes' : 'No';
                          }
                          if (typeof value === 'number' && !Number.isInteger(value)) value = value.toFixed(2);
                          return <td key={field.id} style={styles.tdCompact}>{value} {unit}</td>;
                        })}
                        {currentVisibleColumns.notes !== false && <td style={styles.tdNotes}>{result.notes || '-'}</td>}
                        {currentVisibleColumns.actions !== false && (
                          <td style={styles.tdActions}>
                            <button onClick={() => handleEdit(result)} style={styles.editButton}>Edit</button>
                            <button onClick={() => handleDelete(result.id)} style={styles.deleteButton}>Delete</button>
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
              onPageSizeChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            />

            <div style={styles.tableFooter}>
              <span>Total: {totalRecords} records</span>
              {selectedRows.length > 0 && <span>Selected: {selectedRows.length} records</span>}
              {showDuplicatesOnly && <span style={{ color: '#3b82f6' }}>📅 Showing only duplicate dates</span>}
            </div>
          </div>
        )
      )}

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
          onClose={() => {
            setShowDgaAlgorithms(false);
            setDgaResults([]);
            setAlgoData({});
          }}
        />
      )}

      {showTestForm && selectedTestTypeId && (
        <TestResultForm
          editingResult={editingResult}
          selectedTestTypeName={selectedTestTypeName}
          testFields={testFields}
          testFormData={testFormData}
          setTestFormData={setTestFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowTestForm(false);
            setEditingResult(null);
          }}
        />
      )}

      {showAddMenu && selectedTestTypeId && (
        <AddResultMenu
          assetId={assetId}
          testTypeId={selectedTestTypeId}
          testFields={testFields}
          onClose={() => setShowAddMenu(false)}
          onSuccess={() => {
            loadTestResults(selectedTestTypeId);
            setShowAddMenu(false);
          }}
        />
      )}
    </div>
  );
}

export default TestsTab;