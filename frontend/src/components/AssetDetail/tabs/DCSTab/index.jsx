// frontend/src/components/AssetDetail/tabs/DCSTab/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FaPlus, FaTrash, FaChartLine, FaTable, FaEdit, FaTimes, FaExpand, FaCompress } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ============================================================
//  SignalTable – Professional Table
// ============================================================
const SignalTable = ({ signals, onDelete, onEdit }) => {
  if (signals.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>No signals assigned. Click <strong>"Add Signal"</strong> to assign one.</p>
      </div>
    );
  }

  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Signal Name</th>
            <th style={styles.th}>Assigned Name</th>
            <th style={styles.th}>Unit</th>
            <th style={styles.th}>Min</th>
            <th style={styles.th}>Max</th>
            <th style={styles.th}>Color</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((sig, index) => (
            <tr
              key={sig.id}
              style={{
                ...styles.tr,
                ...(index % 2 === 0 ? styles.trEven : styles.trOdd),
              }}
              className="signal-row"
            >
              <td style={styles.td}>{sig.original_name}</td>
              <td style={styles.td}>{sig.display_name || '-'}</td>
              <td style={styles.td}>{sig.unit || '-'}</td>
              <td style={styles.td}>{sig.min_value !== undefined ? sig.min_value : '-'}</td>
              <td style={styles.td}>{sig.max_value !== undefined ? sig.max_value : '-'}</td>
              <td style={styles.td}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '28px',
                    height: '28px',
                    background: sig.color || '#667eea',
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                />
              </td>
              <td style={styles.tdActions}>
                <button
                  onClick={() => onEdit(sig.id)}
                  style={styles.editButton}
                  title="Edit signal assignment"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => onDelete(sig.id)}
                  style={styles.deleteButton}
                  title="Remove signal"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================
//  SignalForm – Modal for Add/Edit
// ============================================================
const SignalForm = ({ isOpen, onClose, onSubmit, initialData, availableSignals }) => {
  const [formData, setFormData] = useState({
    original_signal_id: '',
    display_name: '',
    unit: '',
    min_value: '',
    max_value: '',
    color: '#667eea',
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        original_signal_id: initialData.original_signal_id || '',
        display_name: initialData.display_name || '',
        unit: initialData.unit || '',
        min_value: initialData.min_value !== undefined ? initialData.min_value : '',
        max_value: initialData.max_value !== undefined ? initialData.max_value : '',
        color: initialData.color || '#667eea',
      });
    } else {
      setFormData({
        original_signal_id: '',
        display_name: '',
        unit: '',
        min_value: '',
        max_value: '',
        color: '#667eea',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      min_value: formData.min_value !== '' ? parseFloat(formData.min_value) : undefined,
      max_value: formData.max_value !== '' ? parseFloat(formData.max_value) : undefined,
    };
    onSubmit(submitData);
    onClose();
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3>{initialData ? 'Edit Signal Assignment' : 'Add Signal Assignment'}</h3>
          <button onClick={onClose} style={styles.closeButton}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Original Signal *</label>
            <select
              name="original_signal_id"
              value={formData.original_signal_id}
              onChange={handleChange}
              required
              style={styles.formInput}
            >
              <option value="">Select a signal</option>
              {availableSignals.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Display Name (optional)</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Custom name for this asset"
              style={styles.formInput}
            />
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Unit (optional)</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., °C, kW"
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Color</label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                style={{ ...styles.formInput, height: '40px', padding: '4px' }}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Min Value (optional)</label>
              <input
                type="number"
                name="min_value"
                value={formData.min_value}
                onChange={handleChange}
                step="any"
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Max Value (optional)</label>
              <input
                type="number"
                name="max_value"
                value={formData.max_value}
                onChange={handleChange}
                step="any"
                style={styles.formInput}
              />
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>Cancel</button>
            <button type="submit" style={styles.submitButton}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
//  ChartBuilder – Advanced Chart
// ============================================================
const ChartBuilder = ({
  assignedSignals,
  onToggleSignal,
  onUpdateColor,
  onSelectChartType,
  selectedSignals,
  chartType,
  tension,
  onToggleTension,
  fill,
  onToggleFill,
  showLegend,
  onToggleLegend,
}) => {
  const chartData = useMemo(() => {
    if (!selectedSignals.length) return null;

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const datasets = selectedSignals.map((sig) => {
      // Generate random data with some trend and noise
      const base = Math.random() * 50 + 20;
      const data = labels.map((_, i) => {
        const trend = i * (Math.random() * 2 + 1);
        const noise = (Math.random() - 0.5) * 20;
        return Math.round((base + trend + noise) * 10) / 10;
      });

      const color = sig.color || '#667eea';
      return {
        label: sig.display_name || sig.original_name,
        data,
        borderColor: color,
        backgroundColor: fill ? color + '30' : 'transparent',
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        tension: tension ? 0.4 : 0,
        fill: fill,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return { labels, datasets };
  }, [selectedSignals, tension, fill]);

  const renderChart = () => {
    if (!chartData) {
      return (
        <div style={styles.noChartMessage}>
          <p>Select at least one signal to display the chart.</p>
        </div>
      );
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    };

    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'area':
        // Area is just line with fill = true
        return <Line data={chartData} options={options} />;
      case 'scatter':
        // For scatter, we need to transform data
        const scatterData = {
          datasets: chartData.datasets.map((ds) => ({
            ...ds,
            data: ds.data.map((y, i) => ({ x: i, y })),
          })),
        };
        return <Scatter data={scatterData} options={options} />;
      default:
        return <Line data={chartData} options={options} />;
    }
  };

  return (
    <div style={styles.chartBuilder}>
      {/* Left Panel – Controls */}
      <div style={styles.chartControls}>
        <div style={styles.controlSection}>
          <label style={styles.formLabel}>Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => onSelectChartType(e.target.value)}
            style={styles.formInput}
          >
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="bar">Bar</option>
            <option value="scatter">Scatter</option>
          </select>
        </div>

        <div style={styles.controlSection}>
          <label style={styles.formLabel}>Signal Selection</label>
          <div style={styles.signalList}>
            {assignedSignals.map((sig) => (
              <label key={sig.id} style={styles.signalCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedSignals.some((s) => s.id === sig.id)}
                  onChange={() => onToggleSignal(sig.id)}
                />
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    background: sig.color || '#667eea',
                    borderRadius: '3px',
                  }}
                />
                {sig.display_name || sig.original_name}
                <input
                  type="color"
                  value={sig.color || '#667eea'}
                  onChange={(e) => onUpdateColor(sig.id, e.target.value)}
                  style={{
                    width: '28px',
                    height: '28px',
                    border: 'none',
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <div style={styles.controlSection}>
          <label style={styles.formLabel}>Chart Options</label>
          <div style={styles.optionGroup}>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={tension}
                onChange={onToggleTension}
              />
              Smooth Curves
            </label>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={fill}
                onChange={onToggleFill}
              />
              Area Fill
            </label>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={showLegend}
                onChange={onToggleLegend}
              />
              Show Legend
            </label>
          </div>
        </div>
      </div>

      {/* Right Panel – Chart */}
      <div style={styles.chartContainer}>
        {renderChart()}
      </div>
    </div>
  );
};

// ============================================================
//  Main DCSTab Component
// ============================================================
const DCSTab = ({ assetId }) => {
  const [activeSubTab, setActiveSubTab] = useState('signals');

  // Assigned signals (mock)
  const [assignedSignals, setAssignedSignals] = useState([
    { id: 1, original_name: 'Temperature', display_name: 'Oil Temp', unit: '°C', min_value: 0, max_value: 100, color: '#ef4444' },
    { id: 2, original_name: 'Pressure', display_name: 'Oil Pressure', unit: 'bar', min_value: 0, max_value: 10, color: '#3b82f6' },
    { id: 3, original_name: 'Vibration', display_name: null, unit: 'mm/s', min_value: undefined, max_value: undefined, color: '#8b5cf6' },
  ]);

  // Available signals (mock)
  const [availableSignals, setAvailableSignals] = useState([
    { id: 101, name: 'Load Current' },
    { id: 102, name: 'Voltage' },
    { id: 103, name: 'Power Factor' },
    { id: 104, name: 'Frequency' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Chart state
  const [selectedSignalIds, setSelectedSignalIds] = useState([1, 2]);
  const [chartType, setChartType] = useState('line');
  const [tension, setTension] = useState(true);
  const [fill, setFill] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // ---- Handlers ----
  const handleAddSignal = (data) => {
    const newSignal = {
      id: Date.now(),
      original_name: availableSignals.find(s => s.id === parseInt(data.original_signal_id))?.name || 'Unknown',
      display_name: data.display_name || null,
      unit: data.unit || null,
      min_value: data.min_value,
      max_value: data.max_value,
      color: data.color || '#667eea',
    };
    setAssignedSignals([...assignedSignals, newSignal]);
    setAvailableSignals(availableSignals.filter(s => s.id !== parseInt(data.original_signal_id)));
    setShowForm(false);
  };

  const handleEditSignal = (id) => {
    const sig = assignedSignals.find(s => s.id === id);
    if (sig) {
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleUpdateSignal = (data) => {
    setAssignedSignals((prev) =>
      prev.map((s) => {
        if (s.id === editingId) {
          const oldOriginalId = s.original_signal_id;
          const newOriginalId = parseInt(data.original_signal_id);
          if (oldOriginalId !== newOriginalId) {
            setAvailableSignals((av) => [
              ...av,
              { id: oldOriginalId, name: s.original_name },
            ].filter(item => item.id !== newOriginalId));
          }
          return {
            ...s,
            original_signal_id: newOriginalId,
            original_name: availableSignals.find(s => s.id === newOriginalId)?.name || s.original_name,
            display_name: data.display_name || null,
            unit: data.unit || null,
            min_value: data.min_value,
            max_value: data.max_value,
            color: data.color || '#667eea',
          };
        }
        return s;
      })
    );
    setEditingId(null);
    setShowForm(false);
  };

  const handleDeleteSignal = (id) => {
    const sig = assignedSignals.find(s => s.id === id);
    if (sig && window.confirm(`Remove signal "${sig.display_name || sig.original_name}"?`)) {
      setAvailableSignals((prev) => [...prev, { id: sig.original_signal_id || Date.now(), name: sig.original_name }]);
      setAssignedSignals(assignedSignals.filter(s => s.id !== id));
      setSelectedSignalIds(selectedSignalIds.filter(sid => sid !== id));
    }
  };

  const toggleSignalForChart = (id) => {
    setSelectedSignalIds((prev) =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const updateSignalColor = (id, color) => {
    setAssignedSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s))
    );
  };

  const selectedSignals = assignedSignals.filter(s => selectedSignalIds.includes(s.id));

  return (
    <div style={styles.container}>
      {/* Sub‑tab navigation */}
      <div style={styles.subTabNav}>
        <button
          onClick={() => setActiveSubTab('signals')}
          style={{ ...styles.subTab, ...(activeSubTab === 'signals' ? styles.activeSubTab : {}) }}
        >
          <FaTable style={{ marginRight: '8px' }} /> Signals
        </button>
        <button
          onClick={() => setActiveSubTab('charts')}
          style={{ ...styles.subTab, ...(activeSubTab === 'charts' ? styles.activeSubTab : {}) }}
        >
          <FaChartLine style={{ marginRight: '8px' }} /> Charts
        </button>
      </div>

      {/* Signals Sub‑tab */}
      {activeSubTab === 'signals' && (
        <div>
          <div style={styles.toolbar}>
            <button onClick={() => { setEditingId(null); setShowForm(true); }} style={styles.addButton}>
              <FaPlus /> Add Signal
            </button>
          </div>
          <SignalTable
            signals={assignedSignals}
            onDelete={handleDeleteSignal}
            onEdit={handleEditSignal}
          />
        </div>
      )}

      {/* Charts Sub‑tab */}
      {activeSubTab === 'charts' && (
        <ChartBuilder
          assignedSignals={assignedSignals}
          selectedSignals={selectedSignals}
          onToggleSignal={toggleSignalForChart}
          onUpdateColor={updateSignalColor}
          onSelectChartType={setChartType}
          chartType={chartType}
          tension={tension}
          onToggleTension={() => setTension(!tension)}
          fill={fill}
          onToggleFill={() => setFill(!fill)}
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend(!showLegend)}
        />
      )}

      {/* Signal Form Modal */}
      <SignalForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingId(null); }}
        onSubmit={editingId ? handleUpdateSignal : handleAddSignal}
        initialData={editingId ? assignedSignals.find(s => s.id === editingId) : null}
        availableSignals={availableSignals}
      />
    </div>
  );
};

// ============================================================
//  Styles
// ============================================================
const styles = {
  container: {
    padding: '16px',
  },
  subTabNav: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
  },
  subTab: {
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  activeSubTab: {
    background: '#667eea',
    color: 'white',
    boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  // ---- Table styles ----
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    background: 'white',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f1f5f9',
    fontWeight: '600',
    color: '#0f172a',
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#1e293b',
  },
  tdActions: {
    padding: '10px 16px',
    borderBottom: '1px solid #f1f5f9',
    whiteSpace: 'nowrap',
  },
  tr: {
    transition: 'background-color 0.15s ease',
    cursor: 'default',
  },
  trEven: {
    backgroundColor: '#ffffff',
  },
  trOdd: {
    backgroundColor: '#f8fafc',
  },
  editButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#3b82f6',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    marginRight: '4px',
    '&:hover': {
      backgroundColor: '#dbeafe',
    },
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ef4444',
    fontSize: '16px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#fecaca',
    },
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #e2e8f0',
  },
  // ---- Modal styles ----
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  formGroup: {
    marginBottom: '12px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '4px',
  },
  formInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '8px 16px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#475569',
  },
  submitButton: {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  // ---- Chart styles ----
  chartBuilder: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '24px',
  },
  chartControls: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  controlSection: {
    marginBottom: '16px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  signalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  signalCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '4px',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  chartContainer: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    height: '400px',
    position: 'relative',
  },
  noChartMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#94a3b8',
    fontSize: '16px',
  },
};

// Add hover effect for table rows via global CSS (since we can't use pseudo-selectors inline)
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .signal-row:hover {
    background-color: #f1f5f9 !important;
  }
  .signal-row:hover td {
    background-color: #f1f5f9 !important;
  }
`;
document.head.appendChild(styleSheet);

export default DCSTab;