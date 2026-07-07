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
import MLDGAChart from '../MLDGAChart';

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
  mlData1,
  mlData2,
  mlData3,
  mlData4,
  mlData5,
  algoError,
  onClose 
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('DUVAL_TRIANGLE');
  const [selectedSubAlgorithm, setSelectedSubAlgorithm] = useState('DUVAL_TRIANGLE_1');

  console.log('=== DGAAlgorithmsResults Debug ===');
  console.log('rogersData:', rogersData);
  console.log('doernenburgData:', doernenburgData);
  console.log('iec60599Data:', iec60599Data);
  console.log('mlData1:', mlData1);

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
      'ML_1': ['ml_dga_1', 'ml_dga1', 'ml1'],
      'ML_2': ['ml_dga_2', 'ml_dga2', 'ml2'],
      'ML_3': ['ml_dga_3', 'ml_dga3', 'ml3'],
      'ML_4': ['ml_dga_4', 'ml_dga4', 'ml4'],
      'ML_5': ['ml_dga_5', 'ml_dga5', 'ml5'],
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

  // Check if a sub-algorithm is implemented
// Check if a sub-algorithm is implemented
// Check if a sub-algorithm is implemented
const isSubImplemented = useCallback((subKey) => {
  // All Duval Triangle and Pentagon sub-algorithms are implemented
  if (subKey.startsWith('DUVAL_TRIANGLE_') || subKey.startsWith('DUVAL_PENTAGON_')) {
    return true;
  }
  // Rogers is implemented
  if (subKey === 'ROGERS_1') {
    return true;
  }
  // ML: Only ML_1 is implemented for now
  if (subKey === 'ML_1') {
    return true;
  }
  // ML_2 through ML_5 are not implemented yet
  if (subKey.startsWith('ML_')) {
    return false;
  }
  return true;
}, []);

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

    // Special handling for Rogers - use direct prop data
    if (selectedAlgorithm === 'ROGERS') {
      console.log('Using direct rogersData prop:', rogersData);
      
      if (rogersData && rogersData.length > 0) {
        rogersData.forEach((item, index) => {
          let testDate = null;
          if (dgaResults[index]) {
            testDate = dgaResults[index].test_date;
          }
          
          results.push({
            test_date: testDate,
            algoKey: 'rogers',
            algoResult: item,
            overall_status: dgaResults[index]?.overall_status || null
          });
        });
      }
      
      console.log('Rogers results count:', results.length);
      return results;
    }

    // Special handling for ML - use direct prop data
    if (selectedAlgorithm === 'ML') {
      let mlData = null;
      let mlKey = '';
      
      // Determine which ML model to use
      switch(selectedSubAlgorithm) {
        case 'ML_1':
          mlData = mlData1;
          mlKey = 'ml_1';
          break;
        case 'ML_2':
          mlData = mlData2;
          mlKey = 'ml_2';
          break;
        case 'ML_3':
          mlData = mlData3;
          mlKey = 'ml_3';
          break;
        case 'ML_4':
          mlData = mlData4;
          mlKey = 'ml_4';
          break;
        case 'ML_5':
          mlData = mlData5;
          mlKey = 'ml_5';
          break;
        default:
          mlData = mlData1;
          mlKey = 'ml_1';
      }
      
      console.log(`Using direct ${mlKey}Data prop:`, mlData);
      
      if (mlData && mlData.length > 0) {
        mlData.forEach((item, index) => {
          let testDate = null;
          if (dgaResults[index]) {
            testDate = dgaResults[index].test_date;
          }
          
          results.push({
            test_date: testDate,
            algoKey: mlKey,
            algoResult: item,
            overall_status: dgaResults[index]?.overall_status || null
          });
        });
      }
      
      console.log('ML results count:', results.length);
      return results;
    }
    
    // For Duval Triangle algorithms - get from dgaResults
    if (selectedAlgorithm === 'DUVAL_TRIANGLE') {
      const actualKey = getActualKey(selectedSubAlgorithm);
      console.log('Actual key for Duval Triangle:', actualKey);
      
      if (!actualKey && dgaResults[0]?.algorithms) {
        const allKeys = Object.keys(dgaResults[0].algorithms);
        const found = allKeys.find(k => k.toLowerCase().includes('duval') && k.toLowerCase().includes('triangle'));
        if (found) {
          console.log('Fallback Duval Triangle key found:', found);
          dgaResults.forEach((item) => {
            if (!item.algorithms) return;
            if (item.algorithms[found]) {
              results.push({
                ...item,
                algoKey: found,
                algoResult: item.algorithms[found]
              });
            }
          });
        }
      } else if (actualKey) {
        dgaResults.forEach((item) => {
          if (!item.algorithms) return;
          if (item.algorithms[actualKey]) {
            results.push({
              ...item,
              algoKey: actualKey,
              algoResult: item.algorithms[actualKey]
            });
          }
        });
      }
      
      console.log('Duval Triangle results count:', results.length);
      return results;
    }

    // For Duval Pentagon algorithms - get from dgaResults
    if (selectedAlgorithm === 'DUVAL_PENTAGON') {
      const actualKey = getActualKey(selectedSubAlgorithm);
      console.log('Actual key for Duval Pentagon:', actualKey);
      
      if (!actualKey && dgaResults[0]?.algorithms) {
        const allKeys = Object.keys(dgaResults[0].algorithms);
        const found = allKeys.find(k => k.toLowerCase().includes('duval') && k.toLowerCase().includes('pentagon'));
        if (found) {
          console.log('Fallback Duval Pentagon key found:', found);
          dgaResults.forEach((item) => {
            if (!item.algorithms) return;
            if (item.algorithms[found]) {
              results.push({
                ...item,
                algoKey: found,
                algoResult: item.algorithms[found]
              });
            }
          });
        }
      } else if (actualKey) {
        dgaResults.forEach((item) => {
          if (!item.algorithms) return;
          if (item.algorithms[actualKey]) {
            results.push({
              ...item,
              algoKey: actualKey,
              algoResult: item.algorithms[actualKey]
            });
          }
        });
      }
      
      console.log('Duval Pentagon results count:', results.length);
      return results;
    }
    
    console.log('Filtered results count:', results.length);
    return results;
  }, [dgaResults, selectedAlgorithm, selectedSubAlgorithm, getActualKey, doernenburgData, iec60599Data, rogersData, mlData1, mlData2, mlData3, mlData4, mlData5]);

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
    } else if (selectedAlgorithm === 'ML') {
      // Determine which ML model data to use
      switch(selectedSubAlgorithm) {
        case 'ML_1':
          return mlData1;
        case 'ML_2':
          return mlData2;
        case 'ML_3':
          return mlData3;
        case 'ML_4':
          return mlData4;
        case 'ML_5':
          return mlData5;
        default:
          return mlData1;
      }
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
    iec60599Data,
    mlData1,
    mlData2,
    mlData3,
    mlData4,
    mlData5
  ]);

  console.log('chartData:', chartData);

  const hasValidChartData = chartData && chartData.length > 0;
  const isRogersOrDoernenburg = selectedAlgorithm === 'ROGERS' || selectedAlgorithm === 'DOERUNBERG';
  const isIEC60599 = selectedAlgorithm === 'IEC60599';
  const isML = selectedAlgorithm === 'ML';
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
      
      case 'ML':
        console.log('Rendering ML chart with data:', chartData);
        return <MLDGAChart data={chartData} width={650} height={550} />;
      
      case 'DOERUNBERG':
        return <div style={styles.doernenburgInfo}>
          <h4>Doernenburg Ratio Results</h4>
          <p>Showing ratio analysis for {chartData.length} data point(s)</p>
        </div>;
      
      default:
        return <div style={styles.comingSoon}>Coming Soon</div>;
    }
  }, [selectedAlgorithm, selectedSubAlgorithm, chartData, hasValidChartData]);

  // Algorithm configuration
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
      implemented: true,
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
      'ML_1': 'ML Model 1 ✅',
      'ML_2': 'ML Model 2 🚧',
      'ML_3': 'ML Model 3 🚧',
      'ML_4': 'ML Model 4 🚧',
      'ML_5': 'ML Model 5 🚧'
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
    
    // First, try to get the fault type
    if (algoResult.fault_type) {
      faultType = algoResult.fault_type;
    } else if (algoResult.zone) {
      faultType = algoResult.zone;
    }
    
    // Get fault name
    if (algoResult.fault_name) {
      faultName = algoResult.fault_name;
    } else if (algoResult.zone_name) {
      faultName = algoResult.zone_name;
    }
    
    // Get color
    if (algoResult.zone_color) {
      zoneColor = algoResult.zone_color;
    } else if (algoResult.color) {
      zoneColor = algoResult.color;
    }
    
    // FIX: If fault_type is "UNK" but we have a valid fault_name, 
    // try to extract the actual fault type from the name
    if (faultType === 'UNK' && faultName && faultName !== 'Unknown') {
      const nameToTypeMap = {
        'Partial Discharge': 'PD',
        'Thermal Fault T1 (<300 C)': 'T1',
        'Thermal Fault T2 (300-700 C)': 'T2',
        'Thermal Fault T3 (>700 C)': 'T3',
        'Discharge D1 (low energy)': 'D1',
        'Discharge D2 (high energy)': 'D2',
        'Mixed Fault (DT)': 'DT',
        'Normal Operation': 'N',
        'Stray Gassing': 'S',
        'Overheating': 'O',
        'Low Energy Discharge': 'D1',
        'High Energy Discharge': 'D2',
        'Low/High Energy Discharge': 'D1D2',
        'No Diagnosis': 'ND',
        'Arcing (Electrical Discharge)': 'ARC',
        'Arcing': 'ARC',
        'Normal': 'NL',
        'Thermal Fault < 300 C': 'T1',
        'Thermal Fault 300-700 C': 'T2',
        'Thermal Fault > 700 C': 'T3',
        'Not Determined': 'ND',
        'Resample Required': 'RESAMPLE'
      };
      
      for (const [name, type] of Object.entries(nameToTypeMap)) {
        if (faultName.includes(name) || name.includes(faultName)) {
          faultType = type;
          break;
        }
      }
      
      if (faultType === 'UNK') {
        const matches = faultName.match(/\b(PD|T1|T2|T3|D1|D2|DT|ND|ARC|NL|S|O|D1D2)\b/);
        if (matches && matches[1]) {
          faultType = matches[1];
        }
      }
    }
    
    return { faultType, faultName, zoneColor };
  };

  // Render sub-tabs with status indicators
  const renderSubTabs = () => {
    const subs = algorithms[selectedAlgorithm]?.subs || [];
    
    return (
      <div style={styles.subTabs}>
        {subs.map(sub => {
          const implemented = isSubImplemented(sub);
          return (
            <button
              key={sub}
              style={{
                ...styles.subTab,
                ...(selectedSubAlgorithm === sub ? styles.subTabActive : {}),
                ...(!implemented ? styles.subTabDisabled : {})
              }}
              onClick={() => {
                if (implemented) {
                  setSelectedSubAlgorithm(sub);
                }
              }}
              disabled={!implemented}
              title={!implemented ? 'Coming Soon' : ''}
            >
              {getSubDisplayName(sub)}
            </button>
          );
        })}
      </div>
    );
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
                  // Select the first implemented sub-algorithm
                  const firstImplemented = algo.subs.find(sub => isSubImplemented(sub));
                  setSelectedSubAlgorithm(firstImplemented || algo.subs[0]);
                }
              }}
              disabled={!algo.implemented}
            >
              {algo.label}
              {!algo.implemented && <span style={styles.comingSoonBadge}>Soon</span>}
            </button>
          ))}
        </div>
        
        {algorithms[selectedAlgorithm]?.hasSub && renderSubTabs()}
      </div>
      
      {/* Chart Section */}
      {hasChart && (
        <div style={styles.chartSection}>
          <h4>
            {algorithms[selectedAlgorithm]?.label} 
            {selectedSubAlgorithm && algorithms[selectedAlgorithm]?.hasSub ? ` - ${getSubDisplayName(selectedSubAlgorithm)}` : ''}
            {!isImplemented && <span style={styles.comingSoonBadge}> Coming Soon</span>}
          </h4>
          
          {isImplemented && isSubImplemented(selectedSubAlgorithm) ? (
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
                {selectedAlgorithm === 'ML' 
                  ? `The ${getSubDisplayName(selectedSubAlgorithm)} is currently under development.`
                  : `The ${algorithms[selectedAlgorithm]?.label} algorithm is currently under development.`
                }
              </p>
            </div>
          )}
          
          {isImplemented && isSubImplemented(selectedSubAlgorithm) && hasValidChartData && (
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
          {selectedAlgorithm === 'ML' && ` - ${getSubDisplayName(selectedSubAlgorithm)}`}
        </h4>
        
        {filteredResults.length === 0 ? (
          <div style={styles.noDataMessage}>
            <p>No data available for the selected algorithm</p>
            <p style={{fontSize: '12px', color: '#999'}}>
              {selectedAlgorithm === 'DOERUNBERG' 
                ? 'Doernenburg data: ' + (doernenburgData ? `${doernenburgData.length} items` : 'None')
                : selectedAlgorithm === 'IEC60599'
                ? 'IEC 60599 data: ' + (iec60599Data ? `${iec60599Data.length} items` : 'None')
                : selectedAlgorithm === 'ML'
                ? 'ML data: ' + (chartData ? `${chartData.length} items` : 'None')
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
                  {isRogersOrDoernenburg || isIEC60599 || isML ? 'Probabilities / Values' : 'Gas %'}
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
                } else if (selectedAlgorithm === 'ML') {
                  // Show top 3 probabilities
                  const top3 = algoResult.top_3 || [];
                  if (top3.length > 0) {
                    displayData = top3;
                    displayType = 'ml';
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
                          : selectedAlgorithm === 'ML'
                          ? `ML ${selectedSubAlgorithm.replace('ML_', '')}`
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
                        ) : displayType === 'ml' ? (
                          <div style={styles.percentagesInline}>
                            {displayData.map((pred, idx) => (
                              <span key={idx} style={{
                                ...styles.percentageItem,
                                backgroundColor: idx === 0 ? '#e8f5e9' : '#f5f5f5',
                                fontWeight: idx === 0 ? 'bold' : 'normal',
                                border: idx === 0 ? '2px solid #4CAF50' : 'none'
                              }}>
                                {pred.fault}: {pred.percentage}
                                {idx === 0 && ' ★'}
                              </span>
                            ))}
                          </div>
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

// Styles
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
  subTabDisabled: {
    backgroundColor: '#e0e0e0',
    color: '#999',
    cursor: 'not-allowed',
    opacity: 0.6
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