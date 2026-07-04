import React, { useState } from 'react';
import DuvalTriangle1Chart from '../DuvalTriangle1Chart';
import DuvalTriangle2Chart from '../DuvalTriangle2Chart';
import DuvalTriangle4Chart from '../DuvalTriangle4Chart';
import DuvalTriangle5Chart from '../DuvalTriangle5Chart';
import DuvalTriangle6Chart from '../DuvalTriangle6Chart';


const DGAAlgorithmsResults = ({ 
  dgaResults, 
  duvalData, 
  duval2Data,
  duval4Data,   // Add this 
  duval5Data,
  duval6Data,
  algoError,
  onClose 
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('DUVAL_TRIANGLE');
  const [selectedSubAlgorithm, setSelectedSubAlgorithm] = useState('DUVAL_TRIANGLE_1');

  console.log('=== DGAAlgorithmsResults Debug ===');
  console.log('duvalData:', duvalData);
  console.log('duval2Data:', duval2Data);
  console.log('duval4Data:', duval4Data);
  console.log('duval5Data:', duval5Data);
  console.log('duval6Data:', duval6Data);
  console.log('dgaResults:', dgaResults);

  if (!dgaResults || dgaResults.length === 0) {
    return null;
  }

  // Get the actual algorithm keys from the data
  const getActualAlgorithmKeys = () => {
    if (dgaResults.length === 0 || !dgaResults[0].algorithms) return [];
    return Object.keys(dgaResults[0].algorithms);
  };

  const actualKeys = getActualAlgorithmKeys();
  console.log('Actual algorithm keys in data:', actualKeys);

  // Map display names to actual keys
  const getActualKey = (displayKey) => {
    const keyMap = {
      'DUVAL_TRIANGLE_1': 'duval_triangle_1',
      'DUVAL_TRIANGLE_2': 'duval_triangle_2',
      'DUVAL_TRIANGLE_3': 'duval_triangle_3',
      'DUVAL_TRIANGLE_4': 'duval_triangle_4',
      'DUVAL_TRIANGLE_5': 'duval_triangle_5',
      'DUVAL_TRIANGLE_6': 'duval_triangle_6',
      'DUVAL_TRIANGLE_6': 'duval_triangle_6',
      'DUVAL_PENTAGON_1': 'duval_pentagon_1',
      'DUVAL_PENTAGON_2': 'duval_pentagon_2',
      'ROGERS': 'rogers_ratio',
      'DOERUNBERG': 'doernenburg',
      'IEC_60599': 'iec_60599',
    };
    
    if (keyMap[displayKey]) {
      const mapped = keyMap[displayKey];
      if (actualKeys.includes(mapped)) {
        return mapped;
      }
    }
    
    // Try partial match
    const lowerDisplay = displayKey.toLowerCase().replace(/_/g, '');
    for (const key of actualKeys) {
      const lowerKey = key.toLowerCase().replace(/_/g, '');
      if (lowerKey.includes(lowerDisplay) || lowerDisplay.includes(lowerKey)) {
        return key;
      }
    }
    
    return null;
  };

  // Algorithm configuration
  const algorithms = {
    DUVAL_TRIANGLE: {
      label: 'DUVAL TRIANGLE',
      hasSub: true,
      subs: ['DUVAL_TRIANGLE_1', 'DUVAL_TRIANGLE_2', 'DUVAL_TRIANGLE_3', 'DUVAL_TRIANGLE_4', 'DUVAL_TRIANGLE_5', 'DUVAL_TRIANGLE_6'],
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
            return <DuvalTriangle6Chart data={data} width={650} height={600} />;  // Add this!
          default:
            return <div style={styles.comingSoon}>Coming Soon</div>;
        }
      }
    },
    DUVAL_PENTAGON: {
      label: 'DUVAL PENTAGON',
      hasSub: true,
      subs: ['DUVAL_PENTAGON_1', 'DUVAL_PENTAGON_2'],
      implemented: false,
      getChart: () => <div style={styles.comingSoon}>Coming Soon</div>
    },
    ROGERS: {
      label: 'ROGERS',
      hasSub: false,
      subs: [],
      implemented: false,
      getChart: () => <div style={styles.comingSoon}>Coming Soon</div>
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
      'DUVAL_TRIANGLE_3': 'Duval Triangle 3',
      'DUVAL_TRIANGLE_4': 'Duval Triangle 4',
      'DUVAL_TRIANGLE_5': 'Duval Triangle 5',
      'DUVAL_TRIANGLE_6': 'Duval Triangle 6',
      'DUVAL_PENTAGON_1': 'Duval Pentagon 1',
      'DUVAL_PENTAGON_2': 'Duval Pentagon 2',
      'ML_1': 'ML 1',
      'ML_2': 'ML 2',
      'ML_3': 'ML 3',
      'ML_4': 'ML 4',
      'ML_5': 'ML 5'
    };
    return nameMap[subKey] || subKey;
  };

  // Get filtered results
  const getFilteredResults = () => {
    const results = [];
    let actualKey = null;
    
    if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
      actualKey = getActualKey(selectedSubAlgorithm);
    } else {
      actualKey = getActualKey(selectedAlgorithm);
    }
    
    // Fallback: try to find any duval_triangle key
    if (!actualKey && selectedAlgorithm === 'DUVAL_TRIANGLE') {
      const found = actualKeys.find(k => k.includes('duval_triangle'));
      if (found) actualKey = found;
    }
    
    dgaResults.forEach(item => {
      if (!item.algorithms) return;
      
      if (actualKey && item.algorithms[actualKey]) {
        results.push({
          ...item,
          algoKey: actualKey,
          algoResult: item.algorithms[actualKey]
        });
      } else {
        // Fallback: find any matching key
        const keys = Object.keys(item.algorithms);
        for (const key of keys) {
          if (key.includes('duval_triangle') && selectedAlgorithm === 'DUVAL_TRIANGLE') {
            results.push({
              ...item,
              algoKey: key,
              algoResult: item.algorithms[key]
            });
            break;
          }
        }
      }
    });
    
    return results;
  };

  const filteredResults = getFilteredResults();

  const getChartData = () => {
    if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
      if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_1') {
        return duvalData;
      } else if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_2') {
        return duval2Data;
      } else if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_4') {
        return duval4Data;
      } else if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_5') {
        return duval5Data;
      } else if (selectedSubAlgorithm === 'DUVAL_TRIANGLE_6') {
        return duval6Data;
      }
      
    }
    return null;
  };

  const chartData = getChartData();
  const hasValidChartData = chartData && chartData.length > 0 && 
    chartData.some(d => d.coordinates && d.coordinates.x !== undefined && d.coordinates.y !== undefined);

  const currentAlgo = algorithms[selectedAlgorithm];
  const isImplemented = currentAlgo?.implemented || false;

  return (
    <div style={styles.dgaAlgorithmsContainer}>
      <div style={styles.headerRow}>
        <h3>DGA Algorithm Analysis Results</h3>
        <button onClick={onClose} style={styles.closeButton}>أ¢إ“â€¢</button>
      </div>
      <p style={styles.algoDescription}>
        Analyzing {dgaResults.length} selected test result(s) using multiple DGA interpretation methods
      </p>
      
      {algoError && (
        <div style={styles.algoError}>
          أ¢ع‘آ أ¯آ¸عˆ {algoError}
        </div>
      )}
      
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
              <p> No chart data available for the selected algorithm</p>
            </div>
          )
        ) : (
          <div style={styles.comingSoonContainer}>
            <div style={styles.comingSoonIcon}>ظ‹ع؛ع‘آ§</div>
            <h3 style={styles.comingSoonTitle}>Coming Soon</h3>
            <p style={styles.comingSoonText}>
              The {algorithms[selectedAlgorithm]?.label} algorithm is currently under development.
            </p>
          </div>
        )}
        
        {isImplemented && hasValidChartData && (
          <div style={styles.chartLegend}>
            <p>ظ‹ع؛â€™طŒ Hover over points for details | Color indicates fault zone</p>
            <p style={styles.chartDataInfo}>Showing {chartData?.length || 0} data point(s)</p>
          </div>
        )}
      </div>
      
      <div style={styles.tableContainer}>
        <h4>Results Summary</h4>
        {filteredResults.length === 0 ? (
          <div style={styles.noDataMessage}>
            <p>No data available for the selected algorithm</p>
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
                      {item.algoResult?.fault_zone || 'UNK'}
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
  noChartSubtext: {
    fontSize: '12px',
    color: '#856404',
    marginTop: '5px'
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