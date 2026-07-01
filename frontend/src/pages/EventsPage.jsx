import { useState, useEffect } from 'react';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    asset_id: '',
    event_type: 'maintenance',
    priority: 'medium',
    reported_date: new Date().toISOString().split('T')[0],
    description: '',
    assigned_to: '',
    due_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, assetsRes] = await Promise.all([
        API.get('/events'),
        API.get('/assets/')
      ]);
      setEvents(eventsRes.data || []);
      setAssets(assetsRes.data.items || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await API.put(`/events/${editingEvent.id}`, formData);
        toast.success('Event updated successfully!');
      } else {
        await API.post('/events', formData);
        toast.success('Event created successfully!');
      }
      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        asset_id: '',
        event_type: 'maintenance',
        priority: 'medium',
        reported_date: new Date().toISOString().split('T')[0],
        description: '',
        assigned_to: '',
        due_date: ''
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      asset_id: event.asset_id,
      event_type: event.event_type,
      priority: event.priority,
      reported_date: event.reported_date,
      description: event.description || '',
      assigned_to: event.assigned_to || '',
      due_date: event.due_date || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await API.delete(`/events/${id}`);
        toast.success('Event deleted successfully');
        loadData();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Delete failed');
      }
    }
  };

  const handleComplete = async (id) => {
    try {
      await API.put(`/events/${id}`, { status: 'completed', completed_date: new Date().toISOString().split('T')[0] });
      toast.success('Event marked as completed');
      loadData();
    } catch (error) {
      toast.error('Failed to complete event');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      default: return '#0dcaf0';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open': return { bg: '#dc3545', text: 'Open' };
      case 'in_progress': return { bg: '#ffc107', text: 'In Progress' };
      case 'completed': return { bg: '#198754', text: 'Completed' };
      case 'cancelled': return { bg: '#6c757d', text: 'Cancelled' };
      default: return { bg: '#6c757d', text: status };
    }
  };

  const openEvents = events.filter(e => e.status === 'open');
  const inProgressEvents = events.filter(e => e.status === 'in_progress');
  const completedEvents = events.filter(e => e.status === 'completed');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>📋 Event Management</h1>
          <p style={{ color: '#6b7280' }}>Track work orders, maintenance activities, and incidents</p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setFormData({ title: '', asset_id: '', event_type: 'maintenance', priority: 'medium', reported_date: new Date().toISOString().split('T')[0], description: '', assigned_to: '', due_date: '' }); setShowForm(true); }}>
          + New Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', borderLeft: '4px solid #dc3545' }}>
          <h2 style={{ fontSize: '32px', margin: 0, color: '#dc3545' }}>{openEvents.length}</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Open Events</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', borderLeft: '4px solid #ffc107' }}>
          <h2 style={{ fontSize: '32px', margin: 0, color: '#ffc107' }}>{inProgressEvents.length}</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>In Progress</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', borderLeft: '4px solid #198754' }}>
          <h2 style={{ fontSize: '32px', margin: 0, color: '#198754' }}>{completedEvents.length}</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Completed (30d)</p>
        </div>
      </div>

      {/* Events Table */}
      <Card title="All Events" icon="📋">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Asset</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Reported Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Due Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => {
                const status = getStatusBadge(event.status);
                return (
                  <tr key={event.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>{event.event_number}</td>
                    <td style={{ padding: '12px' }}><strong>{event.title}</strong></td>
                    <td style={{ padding: '12px' }}>{event.asset_name || '-'}</td>
                    <td style={{ padding: '12px' }}>{event.event_type}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: getPriorityColor(event.priority), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {event.priority.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: status.bg, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {status.text}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(event.reported_date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{event.due_date ? new Date(event.due_date).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button size="sm" variant="warning" onClick={() => handleEdit(event)}>Edit</Button>
                        {event.status !== 'completed' && <Button size="sm" variant="success" onClick={() => handleComplete(event.id)}>Complete</Button>}
                        <Button size="sm" variant="danger" onClick={() => handleDelete(event.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Event Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>Asset *</label>
                <select value={formData.asset_id} onChange={(e) => setFormData({...formData, asset_id: e.target.value})} required style={styles.input}>
                  <option value="">Select Asset</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Event Type *</label>
                <select value={formData.event_type} onChange={(e) => setFormData({...formData, event_type: e.target.value})} style={styles.input}>
                  <option value="maintenance">Maintenance</option>
                  <option value="failure">Failure</option>
                  <option value="inspection">Inspection</option>
                  <option value="test">Test</option>
                  <option value="repair">Repair</option>
                  <option value="replacement">Replacement</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Priority *</label>
                <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} style={styles.input}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Reported Date *</label>
                <input type="date" value={formData.reported_date} onChange={(e) => setFormData({...formData, reported_date: e.target.value})} required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>Due Date</label>
                <input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={styles.textarea} rows="3" />
              </div>
              <div style={styles.modalButtons}>
                <Button type="submit">{editingEvent ? 'Update' : 'Create'}</Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '550px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  formGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  }
};

export default EventsPage;
