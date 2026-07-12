// frontend\src\pages\AssetDetail.jsx
// AssetDetail.jsx - Professional Redesign with IEEE Status
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import NameplateTab from '../components/AssetDetail/NameplateTab';
import DCSTab from '../components/AssetDetail/DCSTab';
import TestResultTable from '../components/AssetDetail/TestResultTable';
import TestResultForm from '../components/AssetDetail/TestResultForm';
import Pagination from '../components/AssetDetail/Pagination';
import ColumnSelector from '../components/AssetDetail/ColumnSelector';
import DGAAlgorithmsResults from '../components/AssetDetail/DGAAlgorithmsResults';
import AddResultMenu from '../components/AssetDetail/AddResultMenu';
import { FaArrowLeft, FaBolt, FaPlug, FaCogs, FaBox, FaChartBar, FaDatabase, FaMicrochip } from 'react-icons/fa';
import { MdTransform, MdDashboard } from 'react-icons/md';

function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [activeTab, setActiveTab] = useState('nameplate');
  const [loading, setLoading] = useState(true);
  const [testTypes, setTestTypes] = useState([]);
  const [selectedTestType, setSelectedTestType] = useState('');
  const [testFields, setTestFields] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [showTestForm, setShowTestForm] = useState(false);
  const [testFormData, setTestFormData] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showDgaAlgorithms, setShowDgaAlgorithms] = useState(false);
  const [dgaResults, setDgaResults] = useState([]);
  const [duvalData, setDuvalData] = useState([]);
  const [duval2Data, setDuval2Data] = useState([]);
  const [duval4Data, setDuval4Data] = useState([]);
  const [duval5Data, setDuval5Data] = useState([]);
  const [duval6Data, setDuval6Data] = useState([]);
  const [duvalPentagon1Data, setDuvalPentagon1Data] = useState([]);
  const [duvalPentagon2Data, setDuvalPentagon2Data] = useState([]);
  const [rogersData, setRogersData] = useState([]);
  const [doernenburgData, setDoernenburgData] = useState([]);
  const [iec60599Data, setIec60599Data] = useState(null);
  const [mlData1, setMlData1] = useState([]);
  const [mlData2, setMlData2] = useState([]);
  const [mlData3, setMlData3] = useState([]);
  const [mlData4, setMlData4] = useState([]);
  const [mlData5, setMlData5] = useState([]);
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError, setAlgoError] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // NEW: IEEE Status states
  const [ieeeStatusMap, setIeeeStatusMap] = useState({});
  const [ieeeLoading, setIeeeLoading] = useState(false);
  // IEEE Status states
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [paginatedResults, setPaginatedResults] = useState([]);

  useEffect(() => {
    loadAsset();
  }, [assetId]);

  useEffect(() => {
    if (testResults.length > 0) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setPaginatedResults(testResults.slice(startIndex, endIndex));
      setTotalRecords(testResults.length);
    } else {
      setPaginatedResults([]);
      setTotalRecords(0);
    }
  }, [testResults, currentPage, pageSize]);

  // NEW: Load IEEE status when DGA test results are loaded
  useEffect(() => {
    if (selectedTestType && testResults.length > 0 && asset?.asset_type === 'transformer') {
      const selectedTestTypeObj = testTypes.find(t => t.id == selectedTestType);
      const isDGA = selectedTestTypeObj?.test_name?.toLowerCase().includes('dga') || false;
      if (isDGA) {
        loadIeeeStatus(assetId);
      }
    }
  }, [testResults, selectedTestType, asset?.asset_type]);

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
      
      console.log('🔍 Test Fields loaded:', res.data);
      console.log('📊 Number of fields:', res.data.length);
      if (res.data.length > 0) {
        console.log('📋 First field:', res.data[0]);
      }
      
      setTestFields(res.data);
      
      const initialVisibility = {
        checkbox: true,
        test_date: true,
        lab_name: true,
        notes: false,
        actions: true
      };
      
      const dgaGases = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2', 'tdcg', 'sample_temp'];
      res.data.forEach(field => {
        initialVisibility[field.field_name] = dgaGases.includes(field.field_name);
      });
      
      setVisibleColumns(initialVisibility);
      
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
      const res = await API.get(`/test-results/?asset_id=${assetId}&test_type_id=${testTypeId}`);
      
      console.log('🔍 Test Results loaded:', res.data);
      console.log('📊 Number of results:', res.data.length);
      if (res.data.length > 0) {
        console.log('📋 First result:', res.data[0]);
        console.log('📋 Parameters:', res.data[0].parameters);
      }
      
      setTestResults(res.data);
      setSelectedRows([]);
      setSelectAll(false);
      setShowDgaAlgorithms(false);
      setDgaResults([]);
      setDuvalData([]);
      setDuval2Data([]);
      setDuval4Data([]);
      setDuval5Data([]);
      setDuval6Data([]);
      setDuvalPentagon1Data([]);
      setDuvalPentagon2Data([]);
      setRogersData([]);
      setDoernenburgData([]);
      setIec60599Data(null);
      setMlData1([]);
      setMlData2([]);
      setMlData3([]);
      setMlData4([]);
      setMlData5([]);
      setAlgoError(null);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading test results:', error);
    }
  };


  // Load IEEE status for transformer
  const loadIeeeStatus = async (assetId) => {
    try {
      setIeeeLoading(true);
      
      // Get all DGA test results for this transformer
      const selectedTestTypeObj = testTypes.find(t => t.id == selectedTestType);
      const isDGA = selectedTestTypeObj?.test_name?.toLowerCase().includes('dga') || false;
      
      if (!isDGA || testResults.length < 2) {
        setIeeeStatusMap({});
        return;
      }

      // Build samples for IEEE algorithm
      const samples = testResults.map(result => {
        const gasData = {};
        result.parameters.forEach(param => {
          if (['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2'].includes(param.field_name)) {
            gasData[param.field_name] = param.field_value || 0;
          }
        });
        
        // Calculate transformer age from commissioning date
        const transformerAge = asset?.commissioning_date 
          ? new Date().getFullYear() - new Date(asset.commissioning_date).getFullYear()
          : 0;
        
        return {
          id: result.id,
          sample_date: result.test_date,
          gas_data: gasData,
          transformer_age: transformerAge
        };
      });
      
      // Call IEEE algorithm
      const response = await API.post(
        '/algorithms/transformer/dga/ieee_algorithm/batch',
        samples
      );
      
      // Build map of result ID -> IEEE status
      const statusMap = {};
      response.data.forEach(item => {
        if (item.id) {
          statusMap[item.id] = {
            status: item.status,
            status_name: item.status_name,
            status_description: item.status_description,
            zone_color: item.zone_color,
            days_from_latest: item.days_from_latest,
            fault_zone: item.fault_zone,
            fault_name: item.fault_name
          };
        }
      });
      
      setIeeeStatusMap(statusMap);
      console.log('✅ IEEE status loaded:', statusMap);
      
    } catch (error) {
      console.error('Error loading IEEE status:', error);
    } finally {
      setIeeeLoading(false);
    }
  };

  const handleTestTypeChange = async (e) => {
    const testTypeId = e.target.value;
    setSelectedTestType(testTypeId);
    if (testTypeId) {
      await loadTestFields(testTypeId);
      await loadTestResults(testTypeId);
      setShowTestForm(false);
      setEditingResult(null);
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
    const formData = {
      test_date: result.test_date,
      lab_name: result.lab_name || '',
      notes: result.notes || ''
    };
    result.parameters.forEach(param => {
      if (param.field_value !== null) {
        formData[param.field_name] = param.field_value;
      } else if (param.field_value_text) {
        formData[param.field_name] = param.field_value_text;
      } else if (param.field_value_date) {
        formData[param.field_name] = param.field_value_date;
      } else if (param.field_value_boolean !== null) {
        formData[param.field_name] = param.field_value_boolean.toString();
      }
    });
    setTestFormData(formData);
    setShowTestForm(true);
  };

  const handleDelete = async (resultId) => {
    if (window.confirm('Are you sure you want to delete this test result?')) {
      try {
        await API.delete(`/test-results/${resultId}`);
        alert('Test result deleted successfully!');
        await loadTestResults(selectedTestType);
      } catch (error) {
        alert('Error: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      alert('Please select at least one test result to delete.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} test result(s)?`)) {
      try {
        await API.delete('/test-results/batch', { data: selectedRows });
        alert(`${selectedRows.length} test result(s) deleted successfully!`);
        await loadTestResults(selectedTestType);
      } catch (error) {
        alert('Error: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setShowDgaAlgorithms(false);
      setDgaResults([]);
      setDuvalData([]);
      setDuval2Data([]);
      setDuval4Data([]);
      setDuval5Data([]);
      setDuval6Data([]);
      setDuvalPentagon1Data([]);
      setDuvalPentagon2Data([]);
      setRogersData([]);
      setDoernenburgData([]);
      setIec60599Data(null);
      setMlData1([]);
      setMlData2([]);
      setMlData3([]);
      setMlData4([]);
      setMlData5([]);
    } else {
      setSelectedRows(paginatedResults.map(r => r.id));
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (resultId) => {
    setSelectedRows(prev => {
      let newSelection;
      if (prev.includes(resultId)) {
        newSelection = prev.filter(id => id !== resultId);
      } else {
        newSelection = [...prev, resultId];
      }
      
      if (newSelection.length === 0) {
        setShowDgaAlgorithms(false);
        setDgaResults([]);
        setDuvalData([]);
        setDuval2Data([]);
        setDuval4Data([]);
        setDuval5Data([]);
        setDuval6Data([]);
        setDuvalPentagon1Data([]);
        setDuvalPentagon2Data([]);
        setRogersData([]);
        setDoernenburgData([]);
        setIec60599Data(null);
        setMlData1([]);
        setMlData2([]);
        setMlData3([]);
        setMlData4([]);
        setMlData5([]);
        setAlgoError(null);
      }
      
      return newSelection;
    });
  };

  const calculateDgaAlgorithms = async () => {
    if (selectedRows.length === 0) {
      alert('Please select at least one test result.');
      return;
    }

    setAlgoLoading(true);
    setAlgoError(null);
    setDgaResults([]);
    setDuvalData([]);
    setDuval2Data([]);
    setDuval4Data([]);
    setDuval5Data([]);
    setDuval6Data([]);
    setDuvalPentagon1Data([]);
    setDuvalPentagon2Data([]);
    setRogersData([]);
    setDoernenburgData([]);
    setIec60599Data(null);
    setMlData1([]);
    setMlData2([]);
    setMlData3([]);
    setMlData4([]);
    setMlData5([]);
    
    try {
      const selectedResults = testResults.filter(r => selectedRows.includes(r.id));
      const results = [];
      const duvalSamples = [];

      for (const result of selectedResults) {
        const parameters = {};
        result.parameters.forEach(param => {
          if (param.field_name && param.field_value !== null) {
            parameters[param.field_name] = param.field_value;
          }
        });
        
        try {
          const assetType = 'transformer';
          const testType = 'dga';
          
          const algosResponse = await API.get(`/algorithms/${assetType}/${testType}`);
          console.log('Available algorithms:', algosResponse.data);
          
          const algorithmResults = {};
          for (const algo of algosResponse.data) {
            try {
              let algoId = algo.id;
              const algoMap = {
                'duvaltriangle1': 'duval_triangle_1',
                'duvaltriangle2': 'duval_triangle_2',
                'duvaltriangle4': 'duval_triangle_4',
                'duvaltriangle5': 'duval_triangle_5',
                'duvaltriangle6': 'duval_triangle_6',
                'duvalpentagon1': 'duval_pentagon_1',
                'duvalpentagon2': 'duval_pentagon_2',
                'rogers': 'rogers_ratio',
                'doernenburg': 'doernenburg_ratio',
                'iec60599': 'iec60599_ratio',
                'iec60599ratio': 'iec60599_ratio',
                'ml_dga_1': 'ml_dga_1',
                'ml_dga_2': 'ml_dga_2',
                'ml_dga_3': 'ml_dga_3',
                'ml_dga_4': 'ml_dga_4',
                'ml_dga_5': 'ml_dga_5',
              };
              
              if (algoMap[algoId]) {
                algoId = algoMap[algoId];
              }
              
              console.log(`Using algorithm ID: ${algoId} (original: ${algo.id})`);
              
              const singleSample = [{
                id: result.id,
                sample_date: result.test_date,
                gas_data: {
                  ch4: parameters.ch4 || 0,
                  c2h2: parameters.c2h2 || 0,
                  c2h4: parameters.c2h4 || 0,
                  h2: parameters.h2 || 0,
                  c2h6: parameters.c2h6 || 0,
                  co: parameters.co || 0,
                  co2: parameters.co2 || 0,
                  o2: parameters.o2 || 0,
                  n2: parameters.n2 || 0
                }
              }];
              
              const algoResponse = await API.post(
                `/algorithms/${assetType}/${testType}/${algoId}/batch`,
                singleSample
              );
              
              console.log(`Response for ${algoId}:`, algoResponse.data);
              if (algoResponse.data && algoResponse.data.length > 0) {
                algorithmResults[algo.id] = algoResponse.data[0];
              } else {
                algorithmResults[algo.id] = { error: 'No data returned' };
              }
            } catch (algoError) {
              console.error(`Error calculating ${algo.id}:`, algoError);
              algorithmResults[algo.id] = { error: 'Calculation failed' };
            }
          }
          
          const overallStatus = determineOverallStatus(algorithmResults);
          
          results.push({
            test_id: result.id,
            test_date: result.test_date,
            algorithms: algorithmResults,
            overall_status: overallStatus
          });

          const duvalSample = {
            id: result.id,
            sample_date: result.test_date,
            gas_data: {
              ch4: parameters.ch4 || 0,
              c2h2: parameters.c2h2 || 0,
              c2h4: parameters.c2h4 || 0,
              h2: parameters.h2 || 0,
              c2h6: parameters.c2h6 || 0,
              co: parameters.co || 0,
              co2: parameters.co2 || 0,
              o2: parameters.o2 || 0,
              n2: parameters.n2 || 0
            }
          };
          duvalSamples.push(duvalSample);
          
        } catch (error) {
          console.error(`Error calculating algorithms for test ${result.id}:`, error);
          results.push({
            test_id: result.id,
            test_date: result.test_date,
            error: error.response?.data?.detail || 'Error calculating algorithms'
          });
        }
      }
      
      console.log('Duval samples to send:', duvalSamples);
      
      if (duvalSamples.length > 0) {
        const chartAlgorithms = [
          { id: 'duval_triangle_1', setter: setDuvalData, name: 'Duval Triangle 1' },
          { id: 'duval_triangle_2', setter: setDuval2Data, name: 'Duval Triangle 2' },
          { id: 'duval_triangle_4', setter: setDuval4Data, name: 'Duval Triangle 4' },
          { id: 'duval_triangle_5', setter: setDuval5Data, name: 'Duval Triangle 5' },
          { id: 'duval_triangle_6', setter: setDuval6Data, name: 'Duval Triangle 6' },
          { id: 'duval_pentagon_1', setter: setDuvalPentagon1Data, name: 'Duval Pentagon 1' },
          { id: 'duval_pentagon_2', setter: setDuvalPentagon2Data, name: 'Duval Pentagon 2' },
          { id: 'rogers_ratio', setter: setRogersData, name: 'Rogers Ratio' },
          { id: 'doernenburg_ratio', setter: setDoernenburgData, name: 'Doernenburg Ratio' },
          { id: 'iec60599_ratio', setter: setIec60599Data, name: 'IEC 60599' },
          { id: 'ml_dga_1', setter: setMlData1, name: 'ML DGA 1' },

        ];

        for (const algo of chartAlgorithms) {
          try {
            console.log(`📡 Calling ${algo.name} API...`);
            const response = await API.post(
              `/algorithms/transformer/dga/${algo.id}/batch`,
              duvalSamples
            );
            console.log(`📡 ${algo.name} Response:`, response.data);
            if (response.data && response.data.length > 0) {
              algo.setter(response.data);
              console.log(`✅ ${algo.name} data set with`, response.data.length, 'items');
            } else {
              console.warn(`⚠️ ${algo.name} returned empty data`);
            }
          } catch (error) {
            console.error(`❌ Error calculating ${algo.name}:`, error);
          }
        }
      }
      
      setDgaResults(results);
      setShowDgaAlgorithms(true);
      
    } catch (error) {
      console.error('Error calculating DGA algorithms:', error);
      setAlgoError(error.response?.data?.detail || 'Error calculating DGA algorithms');
    } finally {
      setAlgoLoading(false);
    }
  };

  // Helper function to determine overall status
  const determineOverallStatus = (algorithmResults) => {
    const zones = Object.values(algorithmResults)
      .map(r => r.fault_zone || r.fault_type || '')
      .filter(z => z && z !== 'UNK' && z !== 'NA');
    
    if (zones.some(z => ['D2', 'T3', 'ARC', 'Arcing'].includes(z))) {
      return { status: 'Critical', color: '#f44336', level: 'Immediate Action Required' };
    } else if (zones.some(z => ['D1', 'T2', 'PD', 'DT', 'Partial Discharge'].includes(z))) {
      return { status: 'Warning', color: '#FF9800', level: 'Monitor Closely' };
    } else if (zones.some(z => ['N', 'S', 'NL', 'Normal'].includes(z))) {
      return { status: 'Normal', color: '#4CAF50', level: 'Normal Operation' };
    } else {
      return { status: 'Unknown', color: '#95A5A6', level: 'Unable to determine' };
    }
  };

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const handleBack = () => {
    navigate(`/plants/${asset?.plant_id}/assets`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const getAssetIcon = () => {
    switch(asset?.asset_type) {
      case 'generator': return <FaBolt size={28} color="#f59e0b" />;
      case 'transformer': return <MdTransform size={28} color="#8b5cf6" />;
      case 'motor': return <FaCogs size={28} color="#06b6d4" />;
      default: return <FaBox size={28} color="#64748b" />;
    }
  };

  const getAssetTypeColor = () => {
    switch(asset?.asset_type) {
      case 'generator': return '#f59e0b';
      case 'transformer': return '#8b5cf6';
      case 'motor': return '#06b6d4';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return <div style={styles.container}>Asset not found</div>;
  }

  const selectedTestTypeName = testTypes.find(t => t.id == selectedTestType)?.test_name;
  const isDGA = selectedTestTypeName?.toLowerCase().includes('dga') || false;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backButton}>
          <FaArrowLeft size={16} style={{ marginRight: '8px' }} />
          Back to Assets
        </button>
        <div style={styles.headerCenter}>
          <div style={{ ...styles.assetIcon, background: `${getAssetTypeColor()}20` }}>
            {getAssetIcon()}
          </div>
          <div>
            <h1 style={styles.title}>{asset.asset_name}</h1>
            <div style={styles.assetMeta}>
              <span style={styles.assetCode}>{asset.asset_code}</span>
              <span style={styles.assetTypeBadge}>
                {asset.asset_type === 'generator' ? '⚡ Generator' : 
                 asset.asset_type === 'transformer' ? '🔌 Transformer' : 
                 asset.asset_type === 'motor' ? '⚙️ Motor' : asset.asset_type}
              </span>
              <span style={styles.assetStatus}>
                {asset.operational_status === 'active' ? '🟢 Active' : 
                 asset.operational_status === 'maintenance' ? '🟡 Maintenance' : 
                 asset.operational_status === 'inactive' ? '🔴 Inactive' : asset.operational_status}
              </span>
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.assetId}>ID: #{asset.id}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('nameplate')} 
          style={{
            ...styles.tab,
            ...(activeTab === 'nameplate' ? styles.tabActive : {})
          }}
        >
          <FaMicrochip size={14} style={{ marginRight: '8px' }} />
          Nameplate Data
        </button>
        <button 
          onClick={() => setActiveTab('tests')} 
          style={{
            ...styles.tab,
            ...(activeTab === 'tests' ? styles.tabActive : {})
          }}
        >
          <FaDatabase size={14} style={{ marginRight: '8px' }} />
          Test Results
        </button>
        <button 
          onClick={() => setActiveTab('dcs')} 
          style={{
            ...styles.tab,
            ...(activeTab === 'dcs' ? styles.tabActive : {})
          }}
        >
          <FaChartBar size={14} style={{ marginRight: '8px' }} />
          DCS Signals
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'nameplate' && <NameplateTab asset={asset} />}
      
      {activeTab === 'dcs' && (
        <DCSTab 
          assetId={asset.id} 
          assetName={asset.asset_name} 
          plantId={asset.plant_id} 
        />
      )}

      {/* Test Results Tab */}
      {activeTab === 'tests' && (
        <div style={styles.tabContent}>
          <div style={styles.testHeader}>
            <div style={styles.testTypeWrapper}>
              <label style={styles.testTypeLabel}>Test Type</label>
              <select 
                value={selectedTestType} 
                onChange={handleTestTypeChange} 
                style={styles.select}
              >
                <option value="">Select Test Type</option>
                {testTypes.map(tt => (
                  <option key={tt.id} value={tt.id}>{tt.test_name}</option>
                ))}
              </select>
            </div>
            
            {selectedTestType && (
              <div style={styles.headerActions}>
                <button 
                  onClick={() => setShowColumnSelector(!showColumnSelector)} 
                  style={styles.columnSelectorButton}
                >
                  <span style={{ marginRight: '6px' }}>📊</span>
                  Columns ▼
                </button>
                <button 
                  onClick={() => setShowAddMenu(true)} 
                  style={styles.addButton}
                >
                  <span style={{ marginRight: '6px' }}>+</span>
                  Add Test Result
                </button>
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
                  <span style={{
                    fontSize: '12px',
                    color: ieeeLoading ? '#f59e0b' : '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {ieeeLoading ? '🔄 IEEE loading...' : '✅ IEEE ready'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Column Selector */}
          {showColumnSelector && selectedTestType && (
            <div style={styles.columnSelectorWrapper}>
              <ColumnSelector
                visibleColumns={visibleColumns}
                testFields={testFields}
                onToggle={toggleColumnVisibility}
                onClose={() => setShowColumnSelector(false)}
                onShowAll={() => {
                  const allVisible = {};
                  allVisible.checkbox = true;
                  allVisible.test_date = true;
                  allVisible.lab_name = true;
                  allVisible.notes = true;
                  allVisible.actions = true;
                  testFields.forEach(field => {
                    allVisible[field.field_name] = true;
                  });
                  setVisibleColumns(allVisible);
                }}
                onShowDefault={() => {
                  const defaultVisible = {};
                  defaultVisible.checkbox = true;
                  defaultVisible.test_date = true;
                  defaultVisible.lab_name = false;
                  defaultVisible.notes = false;
                  defaultVisible.actions = true;
                  const dgaGases = ['h2', 'ch4', 'c2h2', 'c2h4', 'c2h6', 'co', 'co2', 'o2', 'n2', 'tdcg', 'sample_temp'];
                  testFields.forEach(field => {
                    defaultVisible[field.field_name] = dgaGases.includes(field.field_name);
                  });
                  setVisibleColumns(defaultVisible);
                }}
              />
            </div>
          )}

          {/* Empty State */}
          {selectedTestType && testResults.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <h3 style={styles.emptyTitle}>No Test Results Found</h3>
              <p style={styles.emptyText}>No test results found for {selectedTestTypeName}</p>
              <button onClick={() => {
                setEditingResult(null);
                setTestFormData({ test_date: new Date().toISOString().split('T')[0] });
                setShowTestForm(true);
              }} style={styles.emptyButton}>
                + Add First Test Result
              </button>
            </div>
          )}

          {/* Results Table */}
          {testResults.length > 0 && (
            <div style={styles.tableContainer}>
              <div style={styles.tableHeaderWrapper}>
                <h3 style={styles.tableTitle}>
                  Test History - {selectedTestTypeName}
                  <span style={styles.tableCount}>({totalRecords} records)</span>
                </h3>
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
              
              <TestResultTable
                testResults={paginatedResults}
                testFields={testFields}
                visibleColumns={visibleColumns}
                selectedRows={selectedRows}
                selectAll={selectAll}
                onSelectAll={handleSelectAll}
                onRowSelect={handleRowSelect}
                onEdit={handleEdit}
                onDelete={handleDelete}
                ieeeStatusMap={ieeeStatusMap}
              />
              
              <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
              
              <div style={styles.tableFooter}>
                <span>Total: {totalRecords} records</span>
                {selectedRows.length > 0 && (
                  <span>Selected: {selectedRows.length} records</span>
                )}
              </div>
            </div>
          )}

          {/* DGA Algorithms Results */}
          {showDgaAlgorithms && (
            <DGAAlgorithmsResults
              dgaResults={dgaResults}
              duvalData={duvalData}
              duval2Data={duval2Data}
              duval4Data={duval4Data}
              duval5Data={duval5Data}
              duval6Data={duval6Data}
              duvalPentagon1Data={duvalPentagon1Data}
              duvalPentagon2Data={duvalPentagon2Data}
              rogersData={rogersData}
              doernenburgData={doernenburgData}
              iec60599Data={iec60599Data}
              mlData1={mlData1}
              mlData2={mlData2}
              mlData3={mlData3}
              mlData4={mlData4}
              mlData5={mlData5}
              algoError={algoError}
              onClose={() => {
                setShowDgaAlgorithms(false);
                setDgaResults([]);
                setDuvalData([]);
                setDuval2Data([]);
                setDuval4Data([]);
                setDuval5Data([]);
                setDuval6Data([]);
                setDuvalPentagon1Data([]);
                setDuvalPentagon2Data([]);
                setRogersData([]);
                setDoernenburgData([]);
                setIec60599Data(null);
                setMlData1([]);
                setMlData2([]);
                setMlData3([]);
                setMlData4([]);
                setMlData5([]);
              }}
            />
          )}
        </div>
      )}

      {/* Add/Edit Test Result Modal */}
      {showTestForm && selectedTestType && (
        <TestResultForm
          editingResult={editingResult}
          selectedTestTypeName={selectedTestTypeName}
          testFields={testFields}
          testFormData={testFormData}
          setTestFormData={setTestFormData}
          onSubmit={handleTestSubmit}
          onCancel={() => {
            setShowTestForm(false);
            setEditingResult(null);
          }}
        />
      )}

      {/* Add Result Menu Modal */}
      {showAddMenu && selectedTestType && (
        <AddResultMenu
          assetId={assetId}
          testTypeId={selectedTestType}
          testFields={testFields}
          onClose={() => setShowAddMenu(false)}
          onSuccess={() => {
            loadTestResults(selectedTestType);
            setShowAddMenu(false);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  container: { 
    padding: '24px', 
    maxWidth: '1400px', 
    margin: '0 auto',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#64748b'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
    background: 'white',
    padding: '20px 24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'transparent',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1
  },
  assetIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  assetMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '4px',
    flexWrap: 'wrap'
  },
  assetCode: {
    fontSize: '13px',
    color: '#94a3b8',
    background: '#f1f5f9',
    padding: '2px 10px',
    borderRadius: '4px'
  },
  assetTypeBadge: {
    fontSize: '13px',
    color: '#475569',
    background: '#f1f5f9',
    padding: '2px 10px',
    borderRadius: '4px'
  },
  assetStatus: {
    fontSize: '13px',
    fontWeight: '500'
  },
  headerRight: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  assetId: {
    background: '#f1f5f9',
    padding: '4px 12px',
    borderRadius: '6px'
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    background: 'white',
    padding: '6px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    background: 'transparent',
    transition: 'all 0.2s'
  },
  tabActive: {
    background: '#667eea',
    color: 'white',
    boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
  },
  tabContent: {
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  testHeader: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  testTypeWrapper: {
    flex: 1,
    minWidth: '200px'
  },
  testTypeLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '4px'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white'
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
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
    transition: 'all 0.2s'
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
    transition: 'all 0.2s'
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
    transition: 'all 0.2s'
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
    transition: 'all 0.2s'
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
    opacity: 0.7
  },
  columnSelectorWrapper: {
    marginBottom: '20px',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  emptyIcon: {
    fontSize: '56px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '8px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '20px'
  },
  emptyButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  tableContainer: {
    marginTop: '16px'
  },
  tableHeaderWrapper: {
    marginBottom: '16px'
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0
  },
  tableCount: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#94a3b8',
    marginLeft: '8px'
  },
  tableFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '0 0 8px 8px',
    fontSize: '13px',
    color: '#64748b',
    borderTop: '1px solid #e2e8f0'
  }
};

// Add to global CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .add-btn:hover, .algo-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102,126,234,0.3);
  }
  .back-btn:hover {
    background: #f1f5f9;
  }
  .column-selector-btn:hover {
    background: #e2e8f0;
  }
  .bulk-delete-btn:hover {
    background: #fecaca;
  }
  .tab:hover:not(.tab-active) {
    background: #f1f5f9;
  }
`;
document.head.appendChild(styleSheet);

export default AssetDetail;