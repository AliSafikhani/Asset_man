// frontend/src/components/AssetDetail/tabs/AssetProfileTab/subTabs/History.jsx
import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt,
  FaFlask,
  FaWrench,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaPowerOff,
  FaPlay,
} from 'react-icons/fa';
import API from '../../../../../services/api';

// ---- Helper: format date ----
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ---- Helper: get event icon and color ----
const getEventIcon = (type) => {
  const map = {
    commissioning: { icon: <FaPlay />, color: '#10b981' },
    test: { icon: <FaFlask />, color: '#3b82f6' },
    maintenance: { icon: <FaWrench />, color: '#f59e0b' },
    alarm: { icon: <FaExclamationTriangle />, color: '#ef4444' },
    status_change: { icon: <FaPowerOff />, color: '#8b5cf6' },
    default: { icon: <FaClock />, color: '#94a3b8' },
  };
  return map[type] || map.default;
};

// ---- Main Component ----
const History = ({ assetId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Replace with your actual API endpoint
        // const res = await API.get(`/assets/${assetId}/events`);
        // setEvents(res.data);
        // Mock data:
        setEvents([
          {
            id: 1,
            type: 'commissioning',
            date: '2024-02-15T10:00:00Z',
            title: 'Asset Commissioned',
            description: 'Asset was commissioned and put into service.',
          },
          {
            id: 2,
            type: 'test',
            date: '2024-06-20T14:30:00Z',
            title: 'DGA Test Performed',
            description: 'Dissolved Gas Analysis test completed. Results within normal limits.',
          },
          {
            id: 3,
            type: 'maintenance',
            date: '2024-08-10T09:00:00Z',
            title: 'Preventive Maintenance',
            description: 'Annual preventive maintenance performed. Oil filtered and samples taken.',
          },
          {
            id: 4,
            type: 'alarm',
            date: '2024-09-05T16:45:00Z',
            title: 'High Temperature Alarm',
            description: 'Winding temperature exceeded threshold. Investigation revealed cooling fan malfunction.',
          },
          {
            id: 5,
            type: 'status_change',
            date: '2024-09-06T08:00:00Z',
            title: 'Status Changed to Maintenance',
            description: 'Asset status changed from Active to Maintenance for cooling fan repair.',
          },
          {
            id: 6,
            type: 'test',
            date: '2024-10-15T11:00:00Z',
            title: 'Insulation Resistance Test',
            description: 'Insulation resistance values within acceptable range. PI > 2.0.',
          },
          {
            id: 7,
            type: 'commissioning',
            date: '2024-11-01T12:00:00Z',
            title: 'Return to Service',
            description: 'Maintenance completed. Asset returned to Active status.',
          },
        ]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [assetId]);

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return <div style={styles.loading}>Loading events...</div>;
  }

  if (sortedEvents.length === 0) {
    return (
      <div style={styles.emptyState}>
        <FaClock size={48} color="#94a3b8" />
        <p>No events recorded for this asset.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Asset History Timeline</h2>
      <div style={styles.timeline}>
        {sortedEvents.map((event, index) => {
          const { icon, color } = getEventIcon(event.type);
          const isLast = index === sortedEvents.length - 1;
          return (
            <div key={event.id} style={styles.timelineItem}>
              {/* Vertical line */}
              {!isLast && <div style={styles.connector} />}
              {/* Icon */}
              <div style={{ ...styles.iconWrapper, background: color }}>
                {icon}
              </div>
              {/* Content */}
              <div style={styles.content}>
                <div style={styles.headerRow}>
                  <span style={styles.eventTitle}>{event.title}</span>
                  <span style={styles.eventDate}>{formatDate(event.date)}</span>
                </div>
                <div style={styles.eventDescription}>{event.description}</div>
                <div style={styles.eventTypeBadge}>{event.type.replace('_', ' ').toUpperCase()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Styles ----
const styles = {
  container: {
    padding: '16px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 20px 0',
  },
  timeline: {
    position: 'relative',
    padding: '8px 0',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '24px',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: '20px',
    top: '40px',
    bottom: '-24px',
    width: '2px',
    background: '#e2e8f0',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    flexShrink: 0,
    marginRight: '16px',
    zIndex: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    background: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '4px',
  },
  eventTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
  },
  eventDate: {
    fontSize: '13px',
    color: '#475569',
  },
  eventDescription: {
    fontSize: '14px',
    color: '#1e293b',
    marginTop: '4px',
    marginBottom: '6px',
  },
  eventTypeBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '2px 8px',
    borderRadius: '12px',
    background: '#f1f5f9',
    color: '#475569',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#475569',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px dashed #e2e8f0',
    color: '#475569',
  },
};

export default History;