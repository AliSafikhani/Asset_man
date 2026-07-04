import React, { useState } from 'react';
import DuvalTriangle1Chart from '../DuvalTriangle1Chart';
import DuvalTriangle2Chart from '../DuvalTriangle2Chart';
import DuvalTriangle4Chart from '../DuvalTriangle4Chart';
import DuvalTriangle5Chart from '../DuvalTriangle5Chart';
import DuvalTriangle6Chart from '../DuvalTriangle6Chart';
import DuvalPentagon1Chart from '../DuvalPentagon1Chart';
import DuvalPentagon2Chart from '../DuvalPentagon2Chart';
import RogersRatioChart3D from '../RogersRatioChart3D';

const DGAAlgorithmsResults = ({ 
  dgaResults, 
  duvalData, 
  duval2Data, 
  duval4Data, 
  duval5Data, 
  duval6Data, 
  duvalPentagon1Data, 
  duvalPentagon2Data, 
  rogersData, 
  algoError,
  onClose 
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('DUVAL_TRIANGLE');
  const [selectedSubAlgorithm, setSelectedSubAlgorithm] = useState('DUVAL_TRIANGLE_1');

  console.log('=== DGAAlgorithmsResults Debug ===');
  console.log('dgaResults:', dgaResults);
  console.log('dgaResults length:', dgaResults?.length);
  
  if (dgaResults && dgaResults.length > 0 && dgaResults[0].algorithms) {
    console.log('First item algorithm keys:', Object.keys(dgaResults[0].algorithms));
  }

  if (!dgaResults || dgaResults.length === 0) {
    return null;
  }

  // Get the actual key from the data with improved mapping
  const getActualKey = (displayKey) => {
    if (dgaResults.length === 0 || !dgaResults[0].algorithms) {
      return null;
    }
    const keys = Object.keys(dgaResults[0].algorithms);
    console.log('Available keys in data:', keys);
    console.log('Looking for display key:', displayKey);
    
    // Direct mapping for display keys to actual keys (case insensitive)
    const keyMap = {
      'DUVAL_TRIANGLE_1': ['duval_triangle_1', 'duvaltriangle1', 'duval1', 'triangle1'],
      'DUVAL_TRIANGLE_2': ['duval_triangle_2', 'duvaltriangle2', 'duval2', 'triangle2'],
      'DUVAL_TRIANGLE_4': ['duval_triangle_4', 'duvaltriangle4', 'duval4', 'triangle4'],
      'DUVAL_TRIANGLE_5': ['duval_triangle_5', 'duvaltriangle5', 'duval5', 'triangle5'],
      'DUVAL_TRIANGLE_6': ['duval_triangle_6', 'duvaltriangle6', 'duval6', 'triangle6'],
      'DUVAL_PENTAGON_1': ['duval_pentagon_1', 'duvalpentagon1', 'pentagon1'],
      'DUVAL_PENTAGON_2': ['duval_pentagon_2', 'duvalpentagon2', 'pentagon2'],
      'ROGERS_1': ['rogers_ratio', 'rogersratio', 'rogers'],
    };
    
    // Get the list of possible keys for this display key
    const possibleKeys = keyMap[displayKey] || [displayKey.toLowerCase()];
    
    // Try each possible key
    for (const possibleKey of possibleKeys) {
      // Exact match
      if (keys.includes(possibleKey)) {
        console.log(`✅ Found exact match: ${possibleKey}`);
        return possibleKey;
      }
      // Case insensitive match
      const found = keys.find(k => k.toLowerCase() === possibleKey.toLowerCase());
      if (found) {
        console.log(`✅ Found case-insensitive match: ${found}`);
        return found;
      }
    }
    
    // Try partial match (contains)
    const displayLower = displayKey.toLowerCase().replace(/_/g, '');
    for (const key of keys) {
      const keyLower = key.toLowerCase().replace(/_/g, '');
      if (keyLower.includes(displayLower) || displayLower.includes(keyLower)) {
        console.log(`✅ Found partial match: ${key} for ${displayKey}`);
        return key;
      }
    }
    
    console.warn(`❌ No key found for: ${displayKey}`);
    return null;
  };

  // Get filtered results for the table
  const getFilteredResults = () => {
    const results = [];
    let actualKey = null;
    
    if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
      actualKey = getActualKey(selectedSubAlgorithm);
    } else if (selectedAlgorithm === 'DUVAL_PENTAGON') {
      actualKey = getActualKey(selectedSubAlgorithm);
    } else if (selectedAlgorithm === 'ROGERS') {
      actualKey = getActualKey('ROGERS_1');
    } else {
      actualKey = getActualKey(selectedAlgorithm);
    }
    
    console.log('Actual key for table:', actualKey);
    
    // If still no key, try to find any matching key
    if (!actualKey && dgaResults[0]?.algorithms) {
      const allKeys = Object.keys(dgaResults[0].algorithms);
      if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
        const found = allKeys.find(k => k.toLowerCase().includes('duval') && k.toLowerCase().includes('triangle'));
        if (found) actualKey = found;
      } else if (selectedAlgorithm === 'DUVAL_PENTAGON') {
        const found = allKeys.find(k => k.toLowerCase().includes('duval') && k.toLowerCase().includes('pentagon'));
        if (found) actualKey = found;
      } else if (selectedAlgorithm === 'ROGERS') {
        const found = allKeys.find(k => k.toLowerCase().includes('rogers'));
        if (found) actualKey = found;
      }
      console.log('Fallback key found:', actualKey);
    }
    
    dgaResults.forEach((item, index) => {
      if (!item.algorithms) {
        console.log(`Item ${index} has no algorithms`);
        return;
      }
      
      console.log(`Item ${index} keys:`, Object.keys(item.algorithms));
      
      if (actualKey && item.algorithms[actualKey]) {
        const result = {
          ...item,
          algoKey: actualKey,
          algoResult: item.algorithms[actualKey]
        };
        console.log(`✅ Added result for item ${index}:`, result.algoResult);
        results.push(result);
      } else {
        // Try to find any key that matches the algorithm type
        const allItemKeys = Object.keys(item.algorithms);
        let fallbackKey = null;
        if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
          fallbackKey = allItemKeys.find(k => k.toLowerCase().includes('duval') && k.toLowerCase().includes('triangle'));
        } else if (selectedAlgorithm === 'DUVAL_PENTAGON') {
          fallbackKey = allItemKeys.find(k => k.toLowerCase().includes('duval') && k.toLowerCase().includes('pentagon'));
        } else if (selectedAlgorithm === 'ROGERS') {
          fallbackKey = allItemKeys.find(k => k.toLowerCase().includes('rogers'));
        }
        
        if (fallbackKey && item.algorithms[fallbackKey]) {
          results.push({
            ...item,
            algoKey: fallbackKey,
            algoResult: item.algorithms[fallbackKey]
          });
        }
      }
    });
    
    console.log('Filtered results count:', results.length);
    return results;
  };

  const filteredResults = getFilteredResults();

  // Get chart data
  const getChartData = () => {
    if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
      if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_1') return duvalData;
      if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_2') return duval2Data;
      if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_4') return duval4Data;
      if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_5') return duval5Data;
      if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_6') return duval6Data;
    } else if (selectedAlgorithm === 'DUVAL_PENTAGON') {
      if (selectedSubAlgorithm === 'DUVAL_PENTAGON_1') return duvalPentagon1Data;
      if (selectedSubAlgorithm === 'DUVAL_PENTAGON_2') return duvalPentagon2Data;
    } else if (selectedAlgorithm === 'ROGERS') {
      return rogersData;
    }
    return null;
  };

  const chartData = getChartData();
  const hasValidChartData = chartData && chartData.length > 0;

  // Algorithm configuration
  const algorithms = {
    DUVAL_TRIANGLE: {
      label: 'DUVAL TRIANGLE',
      hasSub: true,
      subs: ['DUVAL_TRIANGLE_1', 'DUVAL_TRIANGLE_2', 'DUVAL_TRIANGLE_4', 'DUVAL_TRIANGLE_5', 'DUVAL_TRIANGLE_6'],
      implemented: true,
      getChart: (data) => {
        switch(selectedSubAlgorithm) {
          case 'DUVAL_TRIANGLE_1':
            return <DuvalTriangle1Chart data={data} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_2':
            return <DuvalTriangle2Chart data={data} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_4':
            return <DuvalTriangle4Chart data={data} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_5':
            return <DuvalTriangle5Chart data={data} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_6':
            return <DuvalTriangle6Chart data={data} width={650} height={600} />;
          default:
            return <div style={styles.comingSoon}>Coming Soon</div>;
        }
      }
    },
    DUVAL_PENTAGON: {
      label: 'DUVAL PENTAGON',
      hasSub: true,
      subs: ['DUVAL_PENTAGON_1', 'DUVAL_PENTAGON_2'],
      implemented: true,
      getChart: (data) => {
        switch(selectedSubAlgorithm) {
          case 'DUVAL_PENTAGON_1':
            return <DuvalPentagon1Chart data={data} width={650} height={600} />;
          case 'DUVAL_PENTAGON_2':
            return <DuvalPentagon2Chart data={data} width={650} height={600} />;
          default:
            return <div style={styles.comingSoon}>Coming Soon</div>;
        }
      }
    },
    ROGERS: {
      label: 'ROGERS',
      hasSub: true,
      subs: ['ROGERS_1'],
      implemented: true,
      getChart: (data) => {
        return <RogersRatioChart3D data={data} width={650} height={550} />;
      }
    },
    DOERUNBERG: {
      label: 'DOERUNBERG',
      hasSub: false,
      subs: [],
      implemented: false,
      getChart: () => <div style={styles.comingSoon}>Coming Soon</div>
    },
    IEC_60599: {
      label: 'IEC 60599',
      hasSub: false,
      subs: [],
      implemented: false,
      getChart: () => <div style={styles.comingSoon}>Coming Soon</div>
    },
    ML: {
      label: 'ML',
      hasSub: true,
      subs: ['ML_1', 'ML_2', 'ML_3', 'ML_4', 'ML_5'],
      implemented: false,
      getChart: () => <div style={styles.comingSoon}>Coming Soon</div>
    }
  };

  const getSubDisplayName = (subKey) => {
    const nameMap = {
      'DUVAL_TRIANGLE_1': 'Duval Triangle 1',
      'DUVAL_TRIANGLE_2': 'Duval Triangle 2',
      'DUVAL_TRIANGLE_4': 'Duval Triangle 4',
      'DUVAL_TRIANGLE_5': 'Duval Triangle 5',
      'DUVAL_TRIANGLE_6': 'Duval Triangle 6',
      'DUVAL_PENTAGON_1': 'Duval Pentagon 1',
      'DUVAL_PENTAGON_2': 'Duval Pentagon 2',
      'ROGERS_1': 'Rogers Ratio 3D',
      'ML_1': 'ML 1',
      'ML_2': 'ML 2',
      'ML_3': 'ML 3',
      'ML_4': 'ML 4',
      'ML_5': 'ML 5'
    };
    return nameMap[subKey] || subKey;
  };

  const currentAlgo = algorithms[selectedAlgorithm];
  const isImplemented = currentAlgo?.implemented || false;

  return (
    <div style={styles.dgaAlgorithmsContainer}>
      <div style={styles.headerRow}>
        <h3>DGA Algorithm Analysis Results</h3>
        <button onClick={onClose} style={styles.closeButton}>✕</button>
      </div>
      <p style={styles.algoDescription}>
        Analyzing {dgaResults.length} selected test result(s) using multiple DGA interpretation methods
      </p>
      
      {algoError && (
        <div style={styles.algoError}>
          ⚠️ {algoError}
        </div>
      )}
      
      {/* Algorithm Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {Object.entries(algorithms).map(([key, algo]) => (
            <button
              key={key}
              style={{
                ...styles.tab,
                ...(selectedAlgorithm === key ? styles.tabActive : {}),
                ...(!algo.implemented ? styles.tabDisabled : {})
              }}
              onClick={() => {
                setSelectedAlgorithm(key);
                if (algo.hasSub && algo.subs.length > 0) {
                  setSelectedSubAlgorithm(algo.subs[0]);
                }
              }}
              disabled={!algo.implemented}
            >
              {algo.label}
              {!algo.implemented && <span style={styles.comingSoonBadge}>Soon</span>}
            </button>
          ))}
        </div>
        
        {/* Sub-algorithm tabs */}
        {algorithms[selectedAlgorithm]?.hasSub && (
          <div style={styles.subTabs}>
            {algorithms[selectedAlgorithm].subs.map(sub => (
              <button
                key={sub}
                style={{
                  ...styles.subTab,
                  ...(selectedSubAlgorithm === sub ? styles.subTabActive : {})
                }}
                onClick={() => setSelectedSubAlgorithm(sub)}
              >
                {getSubDisplayName(sub)}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Chart Section */}
      <div style={styles.chartSection}>
        <h4>
          {algorithms[selectedAlgorithm]?.label} 
          {selectedSubAlgorithm ? ` - ${getSubDisplayName(selectedSubAlgorithm)}` : ''}
          {!isImplemented && <span style={styles.comingSoonBadge}> Coming Soon</span>}
        </h4>
        
        {isImplemented ? (
          hasValidChartData ? (
            <div style={{ minHeight: '400px', border: '1px solid #ddd', padding: '10px' }}>
              {currentAlgo.getChart(chartData)}
            </div>
          ) : (
            <div style={styles.noChartData}>
              <p>⚠️ No chart data available for the selected algorithm</p>
            </div>
          )
        ) : (
          <div style={styles.comingSoonContainer}>
            <div style={styles.comingSoonIcon}>🚧</div>
            <h3 style={styles.comingSoonTitle}>Coming Soon</h3>
            <p style={styles.comingSoonText}>
              The {algorithms[selectedAlgorithm]?.label} algorithm is currently under development.
            </p>
          </div>
        )}
        
        {isImplemented && hasValidChartData && (
          <div style={styles.chartLegend}>
            <p>💡 Hover over points for details | Color indicates fault zone</p>
            <p style={styles.chartDataInfo}>Showing {chartData?.length || 0} data point(s)</p>
          </div>
        )}
      </div>
      
      {/* Results Table */}
      <div style={styles.tableContainer}>
        <h4>Results Summary</h4>
        {filteredResults.length === 0 ? (
          <div style={styles.noDataMessage}>
            <p>No data available for the selected algorithm</p>
            <p style={{fontSize: '12px', color: '#999'}}>
              Available algorithms in data: {dgaResults[0]?.algorithms ? Object.keys(dgaResults[0].algorithms).join(', ') : 'None'}
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>Test Date</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Algorithm</th>
                <th style={styles.tableHeaderCell}>Fault Zone</th>
                <th style={styles.tableHeaderCell}>Fault Description</th>
                <th style={styles.tableHeaderCell}>Gas Percentages</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((item, index) => (
                <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                  <td style={styles.tableCell}>
                    {new Date(item.test_date).toLocaleDateString()}
                  </td>
                  <td style={styles.tableCell}>
                    {item.overall_status && (
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: item.overall_status.color + '20',
                        color: item.overall_status.color
                      }}>
                        {item.overall_status.level}
                      </span>
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    <strong>{item.algoKey?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</strong>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{
                      ...styles.zoneBadge,
                      backgroundColor: item.algoResult?.zone_color || '#95A5A6',
                      color: 'white'
                    }}>
                      {item.algoResult?.fault_zone || item.algoResult?.fault_type || 'UNK'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    {item.algoResult?.fault_name || 'Unknown'}
                  </td>
                  <td style={styles.tableCell}>
                    {item.algoResult?.percentages ? (
                      <div style={styles.percentagesInline}>
                        {Object.entries(item.algoResult.percentages).map(([key, value]) => (
                          <span key={key} style={styles.percentageItem}>
                            {key}: {value}%
                          </span>
                        ))}
                      </div>
                    ) : item.algoResult?.ratios ? (
                      <div style={styles.percentagesInline}>
                        {Object.entries(item.algoResult.ratios).map(([key, value]) => (
                          <span key={key} style={styles.percentageItem}>
                            {key.replace('R', 'R')}: {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  dgaAlgorithmsContainer: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666'
  },
  algoDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  algoError: {
    padding: '12px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #f44336'
  },
  tabsContainer: {
    marginBottom: '20px'
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '5px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#666',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tabActive: {
    color: '#4CAF50',
    borderBottom: '3px solid #4CAF50'
  },
  tabDisabled: {
    color: '#bbb',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  comingSoonBadge: {
    fontSize: '10px',
    backgroundColor: '#ff9800',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    marginLeft: '5px'
  },
  subTabs: {
    display: 'flex',
    gap: '5px',
    paddingTop: '10px',
    paddingLeft: '10px',
    flexWrap: 'wrap'
  },
  subTab: {
    padding: '6px 15px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#666',
    transition: 'all 0.3s ease'
  },
  subTabActive: {
    backgroundColor: '#4CAF50',
    color: 'white'
  },
  chartSection: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    marginBottom: '20px'
  },
  chartLegend: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#666'
  },
  chartDataInfo: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px'
  },
  noChartData: {
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffc107',
    textAlign: 'center'
  },
  comingSoonContainer: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  comingSoonIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  comingSoonTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '10px'
  },
  comingSoonText: {
    fontSize: '16px',
    color: '#666',
    maxWidth: '400px',
    margin: '0 auto'
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: '15px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tableHeader: {
    backgroundColor: '#4CAF50',
    color: 'white',
    fontWeight: 'bold'
  },
  tableHeaderCell: {
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd'
  },
  tableRowEven: {
    backgroundColor: '#ffffff'
  },
  tableRowOdd: {
    backgroundColor: '#f9f9f9'
  },
  tableCell: {
    padding: '12px 15px',
    borderBottom: '1px solid #ddd',
    verticalAlign: 'middle'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '12px',
    display: 'inline-block'
  },
  zoneBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '12px',
    display: 'inline-block'
  },
  percentagesInline: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  percentageItem: {
    fontSize: '12px',
    backgroundColor: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '3px',
    whiteSpace: 'nowrap'
  },
  noDataMessage: {
    padding: '30px',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#666'
  }
};

export default DGAAlgorithmsResults;