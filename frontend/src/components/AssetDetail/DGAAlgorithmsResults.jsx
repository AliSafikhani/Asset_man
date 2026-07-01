import React from 'react';
import DuvalTriangle1Chart from '../DuvalTriangle1Chart';

const DGAAlgorithmsResults = ({ 
  dgaResults, 
  duvalData, 
  algoError,
  onClose 
}) => {
  // Debug logging
  console.log('DGAAlgorithmsResults - duvalData:', duvalData);
  console.log('DGAAlgorithmsResults - duvalData length:', duvalData?.length);
  console.log('DGAAlgorithmsResults - dgaResults:', dgaResults);

  if (!dgaResults || dgaResults.length === 0) {
    console.log('No dgaResults, returning null');
    return null;
  }

  const hasValidDuvalData = duvalData && duvalData.length > 0 && 
    duvalData.some(d => d.coordinates && d.coordinates.x !== undefined && d.coordinates.y !== undefined);

  console.log('hasValidDuvalData:', hasValidDuvalData);
  if (duvalData && duvalData.length > 0) {
    console.log('First duvalData item:', JSON.stringify(duvalData[0], null, 2));
  }

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
      
      {/* Duval Triangle 1 Visualization */}
      {hasValidDuvalData ? (
        <div style={styles.chartSection}>
          <h4>Duval Triangle 1</h4>
          <div style={{ minHeight: '400px', border: '1px solid #ddd', padding: '10px' }}>
            <DuvalTriangle1Chart data={duvalData} width={650} height={600} />
          </div>
          <div style={styles.chartLegend}>
            <p>💡 Hover over points for details | Color indicates fault zone</p>
            <p style={styles.chartDataInfo}>Showing {duvalData.length} data point(s)</p>
          </div>
        </div>
      ) : (
        <div style={styles.noChartData}>
          <p>⚠️ No Duval Triangle data available</p>
          <p style={styles.noChartSubtext}>
            {duvalData && duvalData.length > 0 
              ? `Data received but missing valid coordinates. First item: ${JSON.stringify(duvalData[0])}` 
              : 'No data received from server'}
          </p>
        </div>
      )}
      
      {/* Algorithm Results Cards */}
      {dgaResults.map((item, index) => (
        <div key={index} style={styles.algoCard}>
          <div style={styles.algoHeader}>
            <span style={styles.algoDate}>
              Test Date: {new Date(item.test_date).toLocaleDateString()}
            </span>
            {item.overall_status && (
              <span style={{
                ...styles.algoStatus,
                backgroundColor: item.overall_status.color + '20',
                color: item.overall_status.color
              }}>
                {item.overall_status.status} - {item.overall_status.level}
              </span>
            )}
          </div>
          
          {!item.error && item.algorithms && (
            <div style={styles.algoGrid}>
              {Object.entries(item.algorithms).map(([algoName, result]) => (
                <div key={algoName} style={styles.algoSection}>
                  <h4 style={styles.algoSectionTitle}>
                    {algoName.replace(/_/g, ' ').toUpperCase()}
                  </h4>
                  <div style={styles.algoResult}>
                    <div style={{width: '100%'}}>
                      <span style={styles.algoLabel}>Zone:</span>
                      <span style={styles.algoValue}>{result.fault_zone || 'UNK'}</span>
                    </div>
                    <div style={{width: '100%'}}>
                      <span style={styles.algoLabel}>Fault:</span>
                      <span style={styles.algoValue}>{result.fault_name || 'Unknown'}</span>
                    </div>
                    {result.percentages && (
                      <div style={styles.percentages}>
                        {Object.entries(result.percentages).map(([key, value]) => (
                          <small key={key}>{key}: {value}%</small>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
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
    marginBottom: '20px',
    textAlign: 'center'
  },
  noChartSubtext: {
    fontSize: '12px',
    color: '#856404',
    marginTop: '5px'
  },
  algoCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '15px'
  },
  algoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e0e0e0',
    flexWrap: 'wrap',
    gap: '10px'
  },
  algoDate: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#333'
  },
  algoStatus: {
    padding: '5px 12px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  algoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px'
  },
  algoSection: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  algoSectionTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#555',
    fontWeight: 'bold'
  },
  algoResult: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center'
  },
  algoLabel: {
    fontSize: '12px',
    color: '#777',
    fontWeight: 'bold'
  },
  algoValue: {
    fontSize: '13px',
    color: '#333',
    marginRight: '10px'
  },
  percentages: {
    display: 'flex',
    gap: '10px',
    marginTop: '5px',
    fontSize: '11px',
    color: '#666',
    flexWrap: 'wrap'
  }
};

export default DGAAlgorithmsResults;