import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import API from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function DCSVisualization({ assetId, assetName, onBack }) {
  const [mappings, setMappings] = useState([]);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [signalData, setSignalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [hours, setHours] = useState(24);

  useEffect(() => {
    loadMappings();
  }, [assetId]);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/dcs/asset/${assetId}/mappings`);
      setMappings(res.data);
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSignalData = async (signalId) => {
    setChartLoading(true);
    try {
      const res = await API.get(`/dcs/data/${signalId}?hours=${hours}`);
      setSignalData(res.data.data || []);
    } catch (error) {
      console.error('Error loading signal data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const handleSignalSelect = (mapping) => {
    setSelectedSignal(mapping);
    loadSignalData(mapping.dcs_signal_id);
  };

  const handleHoursChange = (e) => {
    const newHours = parseInt(e.target.value);
    setHours(newHours);
    if (selectedSignal) {
      loadSignalData(selectedSignal.dcs_signal_id);
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (!signalData.length) return null;

    const labels = signalData.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleTimeString();
    });

    const values = signalData.map(d => d.value);

    // Get alarm thresholds
    const minAlarm = selectedSignal?.min_alarm;
    const maxAlarm = selectedSignal?.max_alarm;

    return {
      labels,
      datasets: [
        {
          label: `${selectedSignal?.display_name} (${selectedSignal?.unit || selectedSignal?.signal_details?.unit || ''})`,
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
        ...(minAlarm !== null ? [{
          label: `Min Alarm (${minAlarm})`,
          data: Array(values.length).fill(minAlarm),
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }] : []),
        ...(maxAlarm !== null ? [{
          label: `Max Alarm (${maxAlarm})`,
          data: Array(values.length).fill(maxAlarm),
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }] : []),
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${selectedSignal?.display_name || ''} Trend`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: selectedSignal?.unit || selectedSignal?.signal_details?.unit || 'Value'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading assigned signals...</div>;
  }

  if (mappings.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={onBack} style={styles.backButton}>← Back to Asset</button>
          <h2>📊 DCS Data Visualization</h2>
        </div>
        <div style={styles.emptyMessage}>
          <p>No DCS signals assigned to this asset yet.</p>
          <p>Go to DCS Signals tab and assign signals first.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>← Back to Asset</button>
        <h2>📊 DCS Data Visualization - {assetName}</h2>
      </div>

      <div style={styles.content}>
        {/* Signal Selection Sidebar */}
        <div style={styles.sidebar}>
          <h3>Assigned Signals</h3>
          <div style={styles.signalList}>
            {mappings.map(mapping => (
              <button
                key={mapping.id}
                onClick={() => handleSignalSelect(mapping)}
                style={{
                  ...styles.signalButton,
                  backgroundColor: selectedSignal?.id === mapping.id ? '#667eea' : '#f0f0f0',
                  color: selectedSignal?.id === mapping.id ? 'white' : '#333'
                }}
              >
                <div style={styles.signalName}>{mapping.display_name}</div>
                <div style={styles.signalUnit}>{mapping.unit || mapping.signal_details?.unit || '-'}</div>
              </button>
            ))}
          </div>
          
          <div style={styles.controls}>
            <label>Time Range:</label>
            <select value={hours} onChange={handleHoursChange} style={styles.select}>
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={12}>Last 12 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={48}>Last 48 Hours</option>
              <option value={168}>Last Week</option>
            </select>
          </div>
        </div>

        {/* Chart Area */}
        <div style={styles.chartArea}>
          {!selectedSignal ? (
            <div style={styles.placeholder}>
              <p>Select a signal from the left to view data</p>
            </div>
          ) : chartLoading ? (
            <div style={styles.placeholder}>
              <p>Loading data...</p>
            </div>
          ) : signalData.length === 0 ? (
            <div style={styles.placeholder}>
              <p>No data available for this signal</p>
            </div>
          ) : (
            <div style={styles.chartContainer}>
              <div style={styles.signalInfo}>
                <span>KKS: {selectedSignal.signal_details?.kks_code}</span>
                <span> | Unit: {selectedSignal.unit || selectedSignal.signal_details?.unit || '-'}</span>
                {selectedSignal.min_alarm && <span style={styles.alarm}> | Min Alarm: {selectedSignal.min_alarm}</span>}
                {selectedSignal.max_alarm && <span style={styles.alarm}> | Max Alarm: {selectedSignal.max_alarm}</span>}
              </div>
              
              <Line data={getChartData()} options={chartOptions} height={400} />
              
              <div style={styles.stats}>
                <div style={styles.statCard}>
                  <div>Average</div>
                  <strong>{(signalData.reduce((sum, d) => sum + d.value, 0) / signalData.length).toFixed(2)}</strong>
                </div>
                <div style={styles.statCard}>
                  <div>Maximum</div>
                  <strong>{Math.max(...signalData.map(d => d.value)).toFixed(2)}</strong>
                </div>
                <div style={styles.statCard}>
                  <div>Minimum</div>
                  <strong>{Math.min(...signalData.map(d => d.value)).toFixed(2)}</strong>
                </div>
                <div style={styles.statCard}>
                  <div>Latest</div>
                  <strong>{signalData[signalData.length - 1]?.value.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  backButton: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  content: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  sidebar: { flex: '0 0 250px', background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  signalList: { maxHeight: '400px', overflowY: 'auto' },
  signalButton: { width: '100%', padding: '12px', marginBottom: '8px', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'left' },
  signalName: { fontWeight: 'bold' },
  signalUnit: { fontSize: '12px', color: '#666', marginTop: '4px' },
  controls: { marginTop: '20px' },
  select: { width: '100%', padding: '8px', marginTop: '8px', border: '1px solid #ddd', borderRadius: '5px' },
  chartArea: { flex: 1, background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', minWidth: '600px' },
  placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#999' },
  chartContainer: { textAlign: 'center' },
  signalInfo: { fontSize: '14px', color: '#666', marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px' },
  alarm: { color: '#f44336' },
  stats: { display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  statCard: { background: '#f5f5f5', padding: '10px 20px', borderRadius: '5px', textAlign: 'center', minWidth: '80px' },
  emptyMessage: { textAlign: 'center', padding: '50px', background: 'white', borderRadius: '10px' }
};

export default DCSVisualization;
