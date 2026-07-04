// AssetDetail.jsx - Refactored Main Page
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
  const [doernenburgData, setDoernenburgData] = useState([]); // SINGLE DECLARATION
  const [algoLoading, setAlgoLoading] = useState(false);
  const [algoError, setAlgoError] = useState(null);
  
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
      const res = await API.get(`/test-results/asset/${assetId}?test_type_id=${testTypeId}`);
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
      setAlgoError(null);
      setCurrentPage(1);
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
                'doernenburg': 'doernenburg_ratio'
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
  const isDGA = selectedTestTypeName?.toLowerCase().includes('dga') || false;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backButton}>← Back to Assets</button>
        <h1>{getAssetIcon()} {asset.asset_name} ({asset.asset_code})</h1>
      </div>

      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('nameplate')} style={{ ...styles.tab, backgroundColor: activeTab === 'nameplate' ? '#667eea' : '#f0f0f0' }}>Nameplate Data</button>
        <button onClick={() => setActiveTab('tests')} style={{ ...styles.tab, backgroundColor: activeTab === 'tests' ? '#667eea' : '#f0f0f0' }}>Test Results</button>
        <button onClick={() => setActiveTab('dcs')} style={{ ...styles.tab, backgroundColor: activeTab === 'dcs' ? '#667eea' : '#f0f0f0' }}>DCS Signals</button>
      </div>

      {/* Tabs */}
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
            <select value={selectedTestType} onChange={handleTestTypeChange} style={styles.select}>
              <option value="">Select Test Type</option>
              {testTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.test_name}</option>)}
            </select>
            {selectedTestType && (
              <div style={styles.headerActions}>
                <button 
                  onClick={() => setShowColumnSelector(!showColumnSelector)} 
                  style={styles.columnSelectorButton}
                >
                  Columns ▼
                </button>
                <button onClick={() => {
                  setEditingResult(null);
                  setTestFormData({ test_date: new Date().toISOString().split('T')[0] });
                  setShowTestForm(true);
                }} style={styles.addButton}>
                  + Add Test Result
                </button>
                {selectedRows.length > 0 && (
                  <button onClick={handleBulkDelete} style={styles.bulkDeleteButton}>
                    Delete Selected ({selectedRows.length})
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
              </div>
            )}
          </div>

          {/* Column Selector */}
          {showColumnSelector && selectedTestType && (
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
          )}

          {selectedTestType && testResults.length === 0 && (
            <div style={styles.emptyState}>
              <p>No test results found for {selectedTestTypeName}</p>
              <button onClick={() => {
                setEditingResult(null);
                setTestFormData({ test_date: new Date().toISOString().split('T')[0] });
                setShowTestForm(true);
              }} style={styles.addButton}>
                + Add First Test Result
              </button>
            </div>
          )}

          {testResults.length > 0 && (
            <div style={styles.tableContainer}>
              <h3>Test History - {selectedTestTypeName}</h3>
              
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
  
  testHeader: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', flex: 1, minWidth: '200px', fontSize: '14px' },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
  columnSelectorButton: { padding: '10px 16px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
  addButton: { padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
  bulkDeleteButton: { padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
  algoButton: { padding: '10px 20px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' },
  algoLoadingButton: { padding: '10px 20px', backgroundColor: '#7B1FA2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'not-allowed', fontSize: '14px', opacity: 0.7 },
  
  emptyState: { textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  tableContainer: { marginTop: '20px' },
  tableFooter: { display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '0 0 5px 5px', marginTop: '10px', fontSize: '14px', color: '#666' }
};

export default AssetDetail;