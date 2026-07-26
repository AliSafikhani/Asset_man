// frontend/src/components/AssetDetail/tabs/DecisionSupportTab/subTabs/Maintenance.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../../../../services/api';
import Pagination from '../../../Pagination';
import LoadingSpinner from '../../../../ui/LoadingSpinner';

// Helper to get maintenance section options based on asset type
const getMaintenanceSectionOptions = (assetType) => {
  const options = {
    generator: ['Engine', 'Alternator', 'Fuel System', 'Cooling Radiator', 'Exhaust', 'Control Panel', 'Battery', 'Lubrication'],
    motor: ['Bearings', 'Stator Winding', 'Rotor', 'Cooling Fan', 'Terminal Box', 'Shaft', 'Housing', 'Insulation'],
    transformer: ['Oil', 'Winding', 'Paper', 'Cooling', 'OLTC', 'Bushing', 'Tank', 'Conservator', 'Buchholz Relay'],
  };
  return options[assetType] || ['General'];
};

// Helper to get extra data fields based on asset type
const getExtraDataFields = (assetType) => {
  const fields = {
    generator: [
      { key: 'oil_pressure_psi', label: 'Oil Pressure (PSI)', type: 'number', placeholder: 'e.g., 45.5' },
      { key: 'coolant_temp_c', label: 'Coolant Temp (°C)', type: 'number', placeholder: 'e.g., 82' },
      { key: 'fuel_level_pct', label: 'Fuel Level (%)', type: 'number', placeholder: 'e.g., 75' },
      { key: 'rpm', label: 'RPM', type: 'number', placeholder: 'e.g., 1800' },
      { key: 'battery_voltage', label: 'Battery Voltage (V)', type: 'number', placeholder: 'e.g., 24.5' },
    ],
    motor: [
      { key: 'winding_resistance_ohms', label: 'Winding Resistance (Ω)', type: 'number', placeholder: 'e.g., 2.4' },
      { key: 'vibration_mm_s', label: 'Vibration (mm/s)', type: 'number', placeholder: 'e.g., 1.1' },
      { key: 'bearing_temp_c', label: 'Bearing Temp (°C)', type: 'number', placeholder: 'e.g., 65' },
      { key: 'amp_draw_l1', label: 'Amp Draw L1 (A)', type: 'number', placeholder: 'e.g., 15.2' },
      { key: 'amp_draw_l2', label: 'Amp Draw L2 (A)', type: 'number', placeholder: 'e.g., 15.4' },
      { key: 'amp_draw_l3', label: 'Amp Draw L3 (A)', type: 'number', placeholder: 'e.g., 15.1' },
      { key: 'insulation_resistance_mohm', label: 'Insulation Resistance (MΩ)', type: 'number', placeholder: 'e.g., 100' },
    ],
    transformer: [
      { key: 'oil_temp_c', label: 'Oil Temp (°C)', type: 'number', placeholder: 'e.g., 75' },
      { key: 'winding_hot_spot_c', label: 'Winding Hot Spot (°C)', type: 'number', placeholder: 'e.g., 85' },
      { key: 'voltage_primary_kv', label: 'Primary Voltage (kV)', type: 'number', placeholder: 'e.g., 11.0' },
      { key: 'voltage_secondary_v', label: 'Secondary Voltage (V)', type: 'number', placeholder: 'e.g., 415' },
      { key: 'dissolved_gas_h2_ppm', label: 'Dissolved H₂ (ppm)', type: 'number', placeholder: 'e.g., 3' },
      { key: 'moisture_content_ppm', label: 'Moisture Content (ppm)', type: 'number', placeholder: 'e.g., 12' },
    ],
  };
  return fields[assetType] || [];
};

const STATUS_ORDER = ['planned', 'scheduled', 'in_progress', 'completed'];
const STATUS_LABELS = {
  planned: 'Planned',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  canceled: 'Canceled',
  on_hold: 'On Hold',
};
const STATUS_COLORS = {
  planned: '#6b7280',
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  canceled: '#ef4444',
  on_hold: '#8b5cf6',
};
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };
const ORDER_LABELS = { minor: 'Minor', major: 'Major', emergency: 'Emergency', overhaul: 'Overhaul' };

const Maintenance = ({ asset, assetId }) => {
  const assetType = asset?.asset_type;

  // ---- State ----
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterOrder, setFilterOrder] = useState('all');

  // ---- Computed ----
  const sectionOptions = getMaintenanceSectionOptions(assetType);
  const extraDataFields = getExtraDataFields(assetType);

  // ---- Load Activities ----
  const loadActivities = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('asset_id', assetId);
      params.append('limit', '1000');
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterOrder !== 'all') params.append('maintenance_order', filterOrder);

      const res = await API.get(`/maintenance-activities/?${params.toString()}`);
      setActivities(res.data.items || []);
    } catch (error) {
      console.error('Error loading maintenance activities:', error);
      alert('Error loading activities: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  }, [assetId, filterStatus, filterPriority, filterOrder]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // ---- Sorting & Filtering ----
  const sortedActivities = useMemo(() => {
    const sorted = [...activities];
    // Sort by scheduled_date descending (newest first)
    sorted.sort((a, b) => {
      const dateA = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0;
      const dateB = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0;
      return dateB - dateA;
    });
    return sorted;
  }, [activities]);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedActivities.slice(start, start + pageSize);
  }, [sortedActivities, currentPage, pageSize]);

  const totalRecords = sortedActivities.length;

  // ---- Handlers ----
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedRows(selectAll ? [] : paginatedActivities.map(a => a.id));
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedRows([]);
    setSelectAll(false);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAll(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      maintenance_order: 'minor',
      maintenance_section: sectionOptions[0] || '',
      priority: 'medium',
      scheduled_date: new Date().toISOString().split('T')[0],
      assigned_technician: null,
      meter_reading: '',
      labor_cost: 0,
      parts_cost: 0,
      findings_description: '',
      action_taken: '',
      attachments: [],
      recommended_next_date: '',
      extra_data: {},
    });
    setEditingActivity(null);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title || '',
      description: activity.description || '',
      maintenance_order: activity.maintenance_order || 'minor',
      maintenance_section: activity.maintenance_section || sectionOptions[0] || '',
      priority: activity.priority || 'medium',
      scheduled_date: activity.scheduled_date ? new Date(activity.scheduled_date).toISOString().split('T')[0] : '',
      assigned_technician: activity.assigned_technician || null,
      meter_reading: activity.meter_reading || '',
      labor_cost: activity.labor_cost || 0,
      parts_cost: activity.parts_cost || 0,
      findings_description: activity.findings_description || '',
      action_taken: activity.action_taken || '',
      attachments: activity.attachments || [],
      recommended_next_date: activity.recommended_next_date ? new Date(activity.recommended_next_date).toISOString().split('T')[0] : '',
      extra_data: activity.extra_data || {},
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      description: formData.description,
      maintenance_order: formData.maintenance_order,
      maintenance_section: formData.maintenance_section,
      priority: formData.priority,
      scheduled_date: formData.scheduled_date || null,
      assigned_technician: formData.assigned_technician,
      meter_reading: formData.meter_reading ? parseFloat(formData.meter_reading) : null,
      labor_cost: parseFloat(formData.labor_cost) || 0,
      parts_cost: parseFloat(formData.parts_cost) || 0,
      findings_description: formData.findings_description,
      action_taken: formData.action_taken,
      attachments: formData.attachments || [],
      recommended_next_date: formData.recommended_next_date || null,
      extra_data: formData.extra_data || {},
    };

    try {
      if (editingActivity) {
        await API.put(`/maintenance-activities/${editingActivity.id}`, payload);
        alert('Activity updated successfully!');
      } else {
        await API.post(`/maintenance-activities/?asset_id=${assetId}`, payload);
        alert('Activity created successfully!');
      }
      setShowForm(false);
      resetForm();
      await loadActivities();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance activity?')) return;
    try {
      await API.delete(`/maintenance-activities/${id}`);
      alert('Deleted successfully!');
      await loadActivities();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRows.length) return alert('Select at least one activity.');
    if (!window.confirm(`Delete ${selectedRows.length} activity(ies)?`)) return;
    try {
      // Delete one by one (since no batch endpoint yet)
      for (const id of selectedRows) {
        await API.delete(`/maintenance-activities/${id}`);
      }
      alert(`${selectedRows.length} activity(ies) deleted!`);
      setSelectedRows([]);
      setSelectAll(false);
      await loadActivities();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await API.put(`/maintenance-activities/${id}`, { status: newStatus });
      await loadActivities();
    } catch (error) {
      alert('Error updating status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleExtraDataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      extra_data: {
        ...prev.extra_data,
        [key]: value,
      },
    }));
  };

  // ---- Table Styles ----
  const tableStyles = {
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '14px',
      color: '#0f172a',
    },
    th: {
      padding: '10px 12px',
      textAlign: 'left',
      backgroundColor: '#f1f5f9',
      fontWeight: '600',
      color: '#0f172a',
      borderBottom: '2px solid #e2e8f0',
      whiteSpace: 'nowrap',
    },
    td: {
      padding: '8px 12px',
      borderBottom: '1px solid #e2e8f0',
      color: '#1e293b',
      fontSize: '13px',
    },
    tdActions: {
      padding: '8px 12px',
      borderBottom: '1px solid #e2e8f0',
      whiteSpace: 'nowrap',
    },
    trSelected: {
      backgroundColor: '#e3f2fd',
    },
    trEven: {
      backgroundColor: '#ffffff',
    },
    trOdd: {
      backgroundColor: '#f8fafc',
    },
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
    statusButton: {
      padding: '2px 8px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '10px',
      marginRight: '2px',
    },
  };

  // ---- Render ----
  if (loading && !activities.length) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Header with filters and actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', fontSize: '13px', color: '#1e293b' }}
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', fontSize: '13px', color: '#1e293b' }}
          >
            <option value="all">All Priority</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterOrder}
            onChange={(e) => { setFilterOrder(e.target.value); setCurrentPage(1); }}
            style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', fontSize: '13px', color: '#1e293b' }}
          >
            <option value="all">All Orders</option>
            {Object.entries(ORDER_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{ padding: '6px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
          >
            + Add Activity
          </button>
          {selectedRows.length > 0 && (
            <button
              onClick={handleBulkDelete}
              style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              🗑 Delete ({selectedRows.length})
            </button>
          )}
          <button
            onClick={loadActivities}
            style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f1f5f9', cursor: 'pointer', fontSize: '13px', color: '#1e293b' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
          <div style={{ fontSize: '48px' }}>🔧</div>
          <h3 style={{ color: '#1e293b' }}>No Maintenance Activities</h3>
          <p>No maintenance activities found for this asset.</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{ marginTop: '12px', padding: '8px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            + Add First Activity
          </button>
        </div>
      ) : (
        <>
          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
          <div style={{ overflowX: 'auto', marginTop: '8px' }}>
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                  </th>
                  <th style={tableStyles.th}>Title</th>
                  <th style={tableStyles.th}>Section</th>
                  <th style={tableStyles.th}>Order</th>
                  <th style={tableStyles.th}>Priority</th>
                  <th style={tableStyles.th}>Status</th>
                  <th style={tableStyles.th}>Scheduled Date</th>
                  <th style={tableStyles.th}>Cost</th>
                  <th style={tableStyles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedActivities.map((activity, index) => {
                  const isChecked = selectedRows.includes(activity.id);
                  const rowStyle = {
                    background: isChecked ? tableStyles.trSelected.backgroundColor : (index % 2 === 0 ? tableStyles.trEven.backgroundColor : tableStyles.trOdd.backgroundColor),
                  };
                  const statusIdx = STATUS_ORDER.indexOf(activity.status);
                  const nextStatus = statusIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[statusIdx + 1] : null;

                  return (
                    <tr key={activity.id} style={rowStyle}>
                      <td style={tableStyles.td}>
                        <input type="checkbox" checked={isChecked} onChange={() => handleRowSelect(activity.id)} />
                      </td>
                      <td style={tableStyles.td}>
                        <strong>{activity.title}</strong>
                        {activity.description && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{activity.description.substring(0, 60)}...</div>
                        )}
                      </td>
                      <td style={tableStyles.td}>
                        <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                          {activity.maintenance_section}
                        </span>
                      </td>
                      <td style={tableStyles.td}>
                        <span style={{ fontSize: '12px' }}>{ORDER_LABELS[activity.maintenance_order] || activity.maintenance_order}</span>
                      </td>
                      <td style={tableStyles.td}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: PRIORITY_COLORS[activity.priority] || '#6b7280',
                          color: 'white',
                        }}>
                          {PRIORITY_LABELS[activity.priority] || activity.priority}
                        </span>
                      </td>
                      <td style={tableStyles.td}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: STATUS_COLORS[activity.status] || '#6b7280',
                          color: 'white',
                        }}>
                          {STATUS_LABELS[activity.status] || activity.status}
                        </span>
                      </td>
                      <td style={tableStyles.td}>
                        {activity.scheduled_date ? new Date(activity.scheduled_date).toLocaleDateString() : '-'}
                      </td>
                      <td style={tableStyles.td}>
                        ${(activity.total_cost || activity.labor_cost + activity.parts_cost || 0).toFixed(2)}
                      </td>
                      <td style={tableStyles.tdActions}>
                        {/* Status transition buttons */}
                        {nextStatus && activity.status !== 'completed' && activity.status !== 'canceled' && (
                          <button
                            onClick={() => handleStatusUpdate(activity.id, nextStatus)}
                            style={{
                              ...tableStyles.statusButton,
                              background: STATUS_COLORS[nextStatus],
                              color: 'white',
                            }}
                          >
                            {STATUS_LABELS[nextStatus]}
                          </button>
                        )}
                        <button onClick={() => handleEdit(activity)} style={tableStyles.editButton}>Edit</button>
                        <button onClick={() => handleDelete(activity.id)} style={tableStyles.deleteButton}>Delete</button>
                      </td>
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
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: '#1e293b' }}>
              {editingActivity ? 'Edit Maintenance Activity' : 'New Maintenance Activity'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              {/* Row: Order + Section + Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Order *</label>
                  <select
                    value={formData.maintenance_order}
                    onChange={(e) => setFormData({ ...formData, maintenance_order: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="emergency">Emergency</option>
                    <option value="overhaul">Overhaul</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Section *</label>
                  <select
                    value={formData.maintenance_section}
                    onChange={(e) => setFormData({ ...formData, maintenance_section: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  >
                    {sectionOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Date + Meter Reading */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Scheduled Date</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Meter Reading (hours)</label>
                  <input
                    type="number"
                    value={formData.meter_reading}
                    onChange={(e) => setFormData({ ...formData, meter_reading: e.target.value })}
                    step="0.01"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Costs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Labor Cost ($)</label>
                  <input
                    type="number"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Parts Cost ($)</label>
                  <input
                    type="number"
                    value={formData.parts_cost}
                    onChange={(e) => setFormData({ ...formData, parts_cost: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Extra Data (Asset-Specific) */}
              {extraDataFields.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '13px', color: '#1e293b' }}>
                    Asset-Specific Readings
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {extraDataFields.map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '2px' }}>{field.label}</label>
                        <input
                          type="number"
                          value={formData.extra_data[field.key] || ''}
                          onChange={(e) => handleExtraDataChange(field.key, e.target.value ? parseFloat(e.target.value) : '')}
                          step="0.01"
                          placeholder={field.placeholder}
                          style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings & Action */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Findings</label>
                <textarea
                  value={formData.findings_description}
                  onChange={(e) => setFormData({ ...formData, findings_description: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Action Taken</label>
                <textarea
                  value={formData.action_taken}
                  onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              {/* Recommended Next Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '4px', fontSize: '13px', color: '#1e293b' }}>Recommended Next Date</label>
                <input
                  type="date"
                  value={formData.recommended_next_date}
                  onChange={(e) => setFormData({ ...formData, recommended_next_date: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  style={{ padding: '8px 20px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {editingActivity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;