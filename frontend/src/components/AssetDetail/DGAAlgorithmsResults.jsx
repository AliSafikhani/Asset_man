// frontend/src/components/AssetDetail/DGAAlgorithmsResults.jsx
import React, { useState, useMemo, useCallback } from 'react';
import DuvalTriangle1Chart from '../DuvalTriangle1Chart';
import DuvalTriangle2Chart from '../DuvalTriangle2Chart';
import DuvalTriangle4Chart from '../DuvalTriangle4Chart';
import DuvalTriangle5Chart from '../DuvalTriangle5Chart';
import DuvalTriangle6Chart from '../DuvalTriangle6Chart';
import DuvalPentagon1Chart from '../DuvalPentagon1Chart';
import DuvalPentagon2Chart from '../DuvalPentagon2Chart';
import RogersRatioChart3D from '../RogersRatioChart3D';
import IEC60599Chart3D from '../IEC60599Chart3D';

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
  doernenburgData,
  iec60599Data,
  algoError,
  onClose 
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('DUVAL_TRIANGLE');
  const [selectedSubAlgorithm, setSelectedSubAlgorithm] = useState('DUVAL_TRIANGLE_1');

  console.log('=== DGAAlgorithmsResults Debug ===');
  console.log('rogersData:', rogersData);
  console.log('doernenburgData:', doernenburgData);
  console.log('iec60599Data:', iec60599Data);

  if (!dgaResults || dgaResults.length === 0) {
    return null;
  }

  // Helper function to determine overall status
  const determineOverallStatus = useCallback((algorithmResults) => {
    const zones = [];
    
    if (algorithmResults && typeof algorithmResults === 'object') {
      const results = Array.isArray(algorithmResults) ? algorithmResults : Object.values(algorithmResults);
      
      results.forEach(r => {
        if (r) {
          const zone = r.fault_zone || r.fault_type || r.zone || '';
          if (zone && zone !== 'UNK' && zone !== 'NA' && zone !== 'Not Determined' && zone !== 'ND') {
            zones.push(zone);
          }
        }
      });
    }
    
    console.log('Determining status from zones:', zones);
    
    // Critical faults - Immediate Action Required
    if (zones.some(z => ['D2', 'T3', 'ARC', 'Arcing', 'D2/T3', 'D1D2'].includes(z))) {
      return { 
        status: 'Critical', 
        color: '#f44336', 
        level: 'Immediate Action Required',
        priority: 1
      };
    } 
    // Warning faults - Monitor Closely
    else if (zones.some(z => ['D1', 'T2', 'PD', 'DT', 'Partial Discharge', 'T1', 'D1/T2'].includes(z))) {
      return { 
        status: 'Warning', 
        color: '#FF9800', 
        level: 'Monitor Closely',
        priority: 2
      };
    } 
    // Normal operation
    else if (zones.some(z => ['N', 'S', 'NL', 'Normal', 'Normal Operation'].includes(z))) {
      return { 
        status: 'Normal', 
        color: '#4CAF50', 
        level: 'Normal Operation',
        priority: 3
      };
    } 
    // Unknown or not determined
    else {
      return { 
        status: 'Unknown', 
        color: '#95A5A6', 
        level: 'Unable to determine',
        priority: 4
      };
    }
  }, []);

  // Get the actual key from the data - optimized with useMemo
  const getActualKey = useCallback((displayKey) => {
    if (!dgaResults[0]?.algorithms) {
      return null;
    }
    
    const keys = Object.keys(dgaResults[0].algorithms);
    console.log('Available keys:', keys);
    console.log('Looking for:', displayKey);
    
    // Direct mapping for display keys to actual keys
    const keyMap = {
      'DUVAL_TRIANGLE_1': ['duval_triangle_1', 'duvaltriangle1', 'duval1', 'triangle1'],
      'DUVAL_TRIANGLE_2': ['duval_triangle_2', 'duvaltriangle2', 'duval2', 'triangle2'],
      'DUVAL_TRIANGLE_4': ['duval_triangle_4', 'duvaltriangle4', 'duval4', 'triangle4'],
      'DUVAL_TRIANGLE_5': ['duval_triangle_5', 'duvaltriangle5', 'duval5', 'triangle5'],
      'DUVAL_TRIANGLE_6': ['duval_triangle_6', 'duvaltriangle6', 'duval6', 'triangle6'],
      'DUVAL_PENTAGON_1': ['duval_pentagon_1', 'duvalpentagon1', 'pentagon1'],
      'DUVAL_PENTAGON_2': ['duval_pentagon_2', 'duvalpentagon2', 'pentagon2'],
      'ROGERS_1': ['rogers_ratio', 'rogersratio', 'rogers'],
      'DOERUNBERG': ['doernenburg_ratio', 'doernenburgratio', 'doernenburg', 'doernenburg_1'],
      'IEC60599': ['iec60599_ratio', 'iec60599ratio', 'iec60599', 'iec_60599'],
    };
    
    const possibleKeys = keyMap[displayKey] || [displayKey.toLowerCase()];
    
    for (const possibleKey of possibleKeys) {
      if (keys.includes(possibleKey)) {
        console.log(`✅ Found exact match: ${possibleKey}`);
        return possibleKey;
      }
    }
    
    for (const possibleKey of possibleKeys) {
      const found = keys.find(k => k.toLowerCase() === possibleKey.toLowerCase());
      if (found) {
        console.log(`✅ Found case-insensitive match: ${found}`);
        return found;
      }
    }
    
    const displayLower = displayKey.toLowerCase().replace(/_/g, '');
    for (const key of keys) {
      const keyLower = key.toLowerCase().replace(/_/g, '');
      if (keyLower.includes(displayLower) || displayLower.includes(keyLower)) {
        console.log(`✅ Found partial match: ${key}`);
        return key;
      }
    }
    
    console.warn(`❌ No key found for: ${displayKey}`);
    return null;
  }, [dgaResults]);

  // Memoized filtered results
  const filteredResults = useMemo(() => {
    const results = [];
    
    // Special handling for Doernenburg - use direct prop data
    if (selectedAlgorithm === 'DOERUNBERG') {
      console.log('Using direct doernenburgData prop:', doernenburgData);
      
      if (doernenburgData && doernenburgData.length > 0) {
        doernenburgData.forEach((item, index) => {
          let testDate = null;
          if (dgaResults[index]) {
            testDate = dgaResults[index].test_date;
          }
          
          results.push({
            test_date: testDate,
            algoKey: 'doernenburg',
            algoResult: item,
            overall_status: dgaResults[index]?.overall_status || null
          });
        });
      }
      
      console.log('Doernenburg results count:', results.length);
      return results;
    }

    // Special handling for IEC 60599 - use direct prop data
    if (selectedAlgorithm === 'IEC60599') {
      console.log('Using direct iec60599Data prop:', iec60599Data);
      
      if (iec60599Data && iec60599Data.length > 0) {
        iec60599Data.forEach((item, index) => {
          let testDate = null;
          if (dgaResults[index]) {
            testDate = dgaResults[index].test_date;
          }
          
          results.push({
            test_date: testDate,
            algoKey: 'iec60599',
            algoResult: item,
            overall_status: dgaResults[index]?.overall_status || null
          });
        });
      }
      
      console.log('IEC 60599 results count:', results.length);
      return results;
    }
    
    // For other algorithms, get from dgaResults
    let actualKey = null;
    
    if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
      actualKey = getActualKey(selectedSubAlgorithm);
    } else if (selectedAlgorithm === 'DUVAL_PENTAGON') {
      actualKey = getActualKey(selectedSubAlgorithm);
    } else if (selectedAlgorithm === 'ROGERS') {
      actualKey = getActualKey('ROGERS_1');
    }
    
    console.log('Actual key for table:', actualKey);
    
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
    
    dgaResults.forEach((item) => {
      if (!item.algorithms) return;
      
      if (actualKey && item.algorithms[actualKey]) {
        results.push({
          ...item,
          algoKey: actualKey,
          algoResult: item.algorithms[actualKey]
        });
      }
    });
    
    console.log('Filtered results count:', results.length);
    return results;
  }, [dgaResults, selectedAlgorithm, selectedSubAlgorithm, getActualKey, doernenburgData, iec60599Data]);

  // Memoized chart data
  const chartData = useMemo(() => {
    console.log('=== Computing chartData ===');
    console.log('Selected algorithm:', selectedAlgorithm);
    console.log('Selected sub algorithm:', selectedSubAlgorithm);
    
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
    } else if (selectedAlgorithm === 'DOERUNBERG') {
      return doernenburgData;
    } else if (selectedAlgorithm === 'IEC60599') {
      console.log('Returning IEC 60599 data:', iec60599Data);
      return iec60599Data;
    }
    return null;
  }, [
    selectedAlgorithm, 
    selectedSubAlgorithm, 
    duvalData, 
    duval2Data, 
    duval4Data, 
    duval5Data, 
    duval6Data,
    duvalPentagon1Data, 
    duvalPentagon2Data, 
    rogersData,
    doernenburgData,
    iec60599Data
  ]);

  console.log('chartData:', chartData);

  const hasValidChartData = chartData && chartData.length > 0;
  const isRogersOrDoernenburg = selectedAlgorithm === 'ROGERS' || selectedAlgorithm === 'DOERUNBERG';
  const isIEC60599 = selectedAlgorithm === 'IEC60599';
  const hasChart = selectedAlgorithm !== 'DOERUNBERG';

  // Render chart based on selected algorithm
  const renderChart = useCallback(() => {
    console.log('=== Rendering Chart ===');
    console.log('Selected algorithm:', selectedAlgorithm);
    console.log('Chart data:', chartData);
    console.log('Has valid chart data:', hasValidChartData);
    
    if (!chartData || !chartData.length) {
      return <div style={styles.noChartData}>
        <p>⚠️ No chart data available for the selected algorithm</p>
        <p style={{fontSize: '12px', color: '#999'}}>
          Data length: {chartData?.length || 0}
        </p>
      </div>;
    }
    
    switch(selectedAlgorithm) {
      case 'DUVAL_TRIANGLE':
        switch(selectedSubAlgorithm) {
          case 'DUVAL_TRIANGLE_1':
            return <DuvalTriangle1Chart data={chartData} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_2':
            return <DuvalTriangle2Chart data={chartData} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_4':
            return <DuvalTriangle4Chart data={chartData} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_5':
            return <DuvalTriangle5Chart data={chartData} width={650} height={600} />;
          case 'DUVAL_TRIANGLE_6':
            return <DuvalTriangle6Chart data={chartData} width={650} height={600} />;
          default:
            return <div style={styles.comingSoon}>Coming Soon</div>;
        }
      
      case 'DUVAL_PENTAGON':
        switch(selectedSubAlgorithm) {
          case 'DUVAL_PENTAGON_1':
            return <DuvalPentagon1Chart data={chartData} width={650} height={600} />;
          case 'DUVAL_PENTAGON_2':
            return <DuvalPentagon2Chart data={chartData} width={650} height={600} />;
          default:
            return <div style={styles.comingSoon}>Coming Soon</div>;
        }
      
      case 'ROGERS':
        return <RogersRatioChart3D data={chartData} width={650} height={550} />;
      
      case 'IEC60599':
        console.log('Rendering IEC 60599 chart with data:', chartData);
        return <IEC60599Chart3D data={chartData} width={650} height={550} />;
      
      case 'DOERUNBERG':
        return <div style={styles.doernenburgInfo}>
          <h4>Doernenburg Ratio Results</h4>
          <p>Showing ratio analysis for {chartData.length} data point(s)</p>
        </div>;
      
      default:
        return <div style={styles.comingSoon}>Coming Soon</div>;
    }
  }, [selectedAlgorithm, selectedSubAlgorithm, chartData, hasValidChartData]);

  // Algorithm configuration - add IEC60599
  const algorithms = {
    DUVAL_TRIANGLE: {
      label: 'DUVAL TRIANGLE',
      hasSub: true,
      subs: ['DUVAL_TRIANGLE_1', 'DUVAL_TRIANGLE_2', 'DUVAL_TRIANGLE_4', 'DUVAL_TRIANGLE_5', 'DUVAL_TRIANGLE_6'],
      implemented: true,
    },
    DUVAL_PENTAGON: {
      label: 'DUVAL PENTAGON',
      hasSub: true,
      subs: ['DUVAL_PENTAGON_1', 'DUVAL_PENTAGON_2'],
      implemented: true,
    },
    ROGERS: {
      label: 'ROGERS',
      hasSub: true,
      subs: ['ROGERS_1'],
      implemented: true,
    },
    DOERUNBERG: {
      label: 'DOERUNBERG',
      hasSub: false,
      subs: [],
      implemented: true,
    },
    IEC60599: {
      label: 'IEC 60599',
      hasSub: false,
      subs: [],
      implemented: true,
    },
    ML: {
      label: 'ML',
      hasSub: true,
      subs: ['ML_1', 'ML_2', 'ML_3', 'ML_4', 'ML_5'],
      implemented: false,
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

  // Helper function to format ratio values
  const formatRatioValue = (value) => {
    if (typeof value === 'number') {
      if (Math.abs(value) < 0.01) return value.toExponential(2);
      if (Math.abs(value) < 1) return value.toFixed(3);
      if (Math.abs(value) < 100) return value.toFixed(2);
      return value.toFixed(1);
    }
    return value;
  };

  // Helper function to render Doernenburg results in table
  const renderDoernenburgDisplay = (algoResult) => {
    if (!algoResult) return null;
    
    if (algoResult.ratios) {
      return (
        <div style={styles.percentagesInline}>
          {Object.entries(algoResult.ratios).map(([key, value]) => {
            let displayKey = key;
            if (key === 'CH4/H2') displayKey = 'CH4/H2';
            else if (key === 'C2H2/CH4') displayKey = 'C2H2/CH4';
            else if (key === 'C2H4/C2H6') displayKey = 'C2H4/C2H6';
            else if (key === 'C2H2/C2H4') displayKey = 'C2H2/C2H4';
            
            return (
              <span key={key} style={styles.ratioItem}>
                {displayKey}: {formatRatioValue(value)}
              </span>
            );
          })}
        </div>
      );
    }
    
    if (algoResult.raw_values) {
      return (
        <div style={styles.percentagesInline}>
          {Object.entries(algoResult.raw_values).map(([key, value]) => (
            <span key={key} style={styles.valueItem}>
              {key}: {typeof value === 'number' ? value.toFixed(2) : value}
            </span>
          ))}
        </div>
      );
    }
    
    const doernenburgFields = ['CH4_H2', 'C2H2_CH4', 'C2H4_C2H6', 'C2H2_C2H4'];
    const hasDoernenburgData = doernenburgFields.some(field => algoResult[field] !== undefined);
    
    if (hasDoernenburgData) {
      return (
        <div style={styles.percentagesInline}>
          {doernenburgFields.map(field => {
            if (algoResult[field] !== undefined) {
              const displayKey = field.replace('_', '/');
              return (
                <span key={field} style={styles.ratioItem}>
                  {displayKey}: {formatRatioValue(algoResult[field])}
                </span>
              );
            }
            return null;
          }).filter(Boolean)}
        </div>
      );
    }
    
    return <span style={{color: '#999', fontSize: '12px'}}>No ratio data available</span>;
  };

  // Get fault display info
  const getFaultDisplay = (algoResult) => {
    let faultType = 'UNK';
    let faultName = 'Unknown';
    let zoneColor = '#95A5A6';
    
    if (algoResult.fault_type) {
      faultType = algoResult.fault_type;
    } else if (algoResult.zone) {
      faultType = algoResult.zone;
    }
    
    if (algoResult.fault_name) {
      faultName = algoResult.fault_name;
    } else if (algoResult.zone_name) {
      faultName = algoResult.zone_name;
    }
    
    if (algoResult.zone_color) {
      zoneColor = algoResult.zone_color;
    } else if (algoResult.color) {
      zoneColor = algoResult.color;
    }
    
    return { faultType, faultName, zoneColor };
  };

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
      
      {/* Chart Section */}
      {hasChart && (
        <div style={styles.chartSection}>
          <h4>
            {algorithms[selectedAlgorithm]?.label} 
            {selectedSubAlgorithm && algorithms[selectedAlgorithm]?.hasSub ? ` - ${getSubDisplayName(selectedSubAlgorithm)}` : ''}
            {!isImplemented && <span style={styles.comingSoonBadge}> Coming Soon</span>}
          </h4>
          
          {isImplemented ? (
            hasValidChartData ? (
              <div style={{ minHeight: '400px', border: '1px solid #ddd', padding: '10px' }}>
                {renderChart()}
              </div>
            ) : (
              <div style={styles.noChartData}>
                <p>⚠️ No chart data available for the selected algorithm</p>
                <p style={{fontSize: '12px', color: '#999'}}>
                  Data: {chartData ? `${chartData.length} items` : 'null'}
                </p>
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
      )}
      
      {/* Results Table */}
      <div style={styles.tableContainer}>
        <h4>
          Results Summary 
          {selectedAlgorithm === 'DOERUNBERG' && ' - Doernenburg Ratio'}
          {selectedAlgorithm === 'ROGERS' && ' - Rogers Ratio'}
          {selectedAlgorithm === 'IEC60599' && ' - IEC 60599 Ratio'}
        </h4>
        
        {filteredResults.length === 0 ? (
          <div style={styles.noDataMessage}>
            <p>No data available for the selected algorithm</p>
            <p style={{fontSize: '12px', color: '#999'}}>
              {selectedAlgorithm === 'DOERUNBERG' 
                ? 'Doernenburg data: ' + (doernenburgData ? `${doernenburgData.length} items` : 'None')
                : selectedAlgorithm === 'IEC60599'
                ? 'IEC 60599 data: ' + (iec60599Data ? `${iec60599Data.length} items` : 'None')
                : `Available algorithms in data: ${dgaResults[0]?.algorithms ? Object.keys(dgaResults[0].algorithms).join(', ') : 'None'}`
              }
            </p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>#</th>
                <th style={styles.tableHeaderCell}>Test Date</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Algorithm</th>
                <th style={styles.tableHeaderCell}>Fault Type</th>
                <th style={styles.tableHeaderCell}>
                  {isRogersOrDoernenburg || isIEC60599 ? 'Ratios / Values' : 'Gas %'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((item, index) => {
                const algoResult = item.algoResult || {};
                
                const { faultType, faultName, zoneColor } = getFaultDisplay(algoResult);
                
                let displayData = null;
                let displayType = 'percentages';
                
                if (selectedAlgorithm === 'DOERUNBERG') {
                  displayData = algoResult;
                  displayType = 'doernenburg';
                } else if (selectedAlgorithm === 'IEC60599' || selectedAlgorithm === 'ROGERS') {
                  if (algoResult.ratios) {
                    displayData = algoResult.ratios;
                    displayType = 'ratios';
                  }
                } else if (algoResult.percentages) {
                  displayData = algoResult.percentages;
                  displayType = 'percentages';
                } else if (algoResult.gas_percentages) {
                  displayData = algoResult.gas_percentages;
                  displayType = 'percentages';
                }
                
                return (
                  <tr key={`${item.test_date || index}-${index}`} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                    <td style={styles.tableCell}>{index + 1}</td>
                    <td style={styles.tableCell}>
                      {item.test_date ? new Date(item.test_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={styles.tableCell}>
                      {item.overall_status && (
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: item.overall_status.color + '20',
                          color: item.overall_status.color
                        }}>
                          {item.overall_status.level || item.overall_status.status || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td style={styles.tableCell}>
                      <strong>
                        {selectedAlgorithm === 'DOERUNBERG' 
                          ? 'Doernenburg'
                          : selectedAlgorithm === 'IEC60599'
                          ? 'IEC 60599'
                          : item.algoKey?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                      </strong>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.zoneBadge,
                        backgroundColor: zoneColor || '#95A5A6',
                        color: 'white'
                      }}>
                        {faultType || 'UNK'}
                      </span>
                      <div style={{fontSize: '11px', color: '#888', marginTop: '2px'}}>
                        {faultName || 'Unknown'}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      {displayData ? (
                        displayType === 'doernenburg' ? (
                          renderDoernenburgDisplay(displayData)
                        ) : (
                          <div style={styles.percentagesInline}>
                            {Object.entries(displayData).map(([key, value]) => {
                              let displayValue = value;
                              if (typeof value === 'number') {
                                displayValue = displayType === 'ratios' ? value.toFixed(3) : value.toFixed(1);
                              }
                              const cleanKey = key.replace(/_/g, '/').toUpperCase();
                              return (
                                <span key={key} style={styles.percentageItem}>
                                  {cleanKey}: {displayValue}
                                </span>
                              );
                            })}
                          </div>
                        )
                      ) : (
                        <span style={{color: '#999', fontSize: '12px'}}>No data available</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Styles remain the same as before
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
  doernenburgInfo: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px'
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
  ratioItem: {
    fontSize: '12px',
    backgroundColor: '#e3f2fd',
    padding: '2px 8px',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
    color: '#0d47a1'
  },
  valueItem: {
    fontSize: '12px',
    backgroundColor: '#f3e5f5',
    padding: '2px 8px',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
    color: '#4a148c'
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