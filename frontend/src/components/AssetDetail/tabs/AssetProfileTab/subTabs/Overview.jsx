// frontend/src/components/AssetDetail/tabs/AssetProfileTab/subTabs/Overview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaFlask, FaClock, FaExclamationTriangle, FaFileAlt, FaChartBar, FaMicrochip } from 'react-icons/fa';
import API from '../../../../../services/api';

// ---- Helper: format date ----
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ---- Helper: calculate age ----
const calculateAge = (commissioningDate) => {
  if (!commissioningDate) return 'N/A';
  const years = new Date().getFullYear() - new Date(commissioningDate).getFullYear();
  return years > 0 ? `${years} years` : `${years * -1} years (future)`;
};

// ---- Helper: get asset type color ----
const getAssetTypeColor = (type) => {
  const colors = { generator: '#f59e0b', transformer: '#8b5cf6', motor: '#06b6d4' };
  return colors[type] || '#64748b';
};

// ---- Helper: get default image URLs ----
const defaultImages = {
  transformer: 'https://assets.siemens-energy.com/dam/ab8c29d4-ff32-4bb5-a6ef-b13f00953cea/GSU_Trafo_Belt_mitSchatten_rechts-jpg_Original%20file.jpg',
  generator: 'https://assets.siemens-energy.com/dam/5d4c32bb-d397-47f1-ba1a-b08300cd1148/sgen-100a-2p-cutopen-ontransparent-highres-png_Rendition1920.PNG?apr_optimization=false',
  motor: 'https://chesscontrols.com/wp-content/uploads/Screen-Shot-2021-06-08-at-9.16.01-AM.png',
};

// ---- Asset Overview Component ----
const Overview = ({ asset, assetId }) => {
  const navigate = useNavigate();
  const [testCount, setTestCount] = useState(0);
  const [lastTestDate, setLastTestDate] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch test statistics (count and last date)
  useEffect(() => {
    const fetchTestStats = async () => {
      try {
        // Fetch the most recent test result (limit 1) to get last date and total count
        const res = await API.get(`/test-results/?asset_id=${assetId}&page=1&page_size=1`);
        // Assume API returns total count in headers or meta
        const total = res.headers?.['x-total-count'] || res.data?.meta?.total || res.data?.length || 0;
        setTestCount(total);
        if (res.data && res.data.length > 0) {
          setLastTestDate(res.data[0].test_date);
        } else {
          setLastTestDate(null);
        }
      } catch (error) {
        console.error('Failed to fetch test stats:', error);
        // Fallback: use mock data
        setTestCount(0);
        setLastTestDate(null);
      } finally {
        setLoadingStats(false);
      }
    };

    if (assetId) {
      fetchTestStats();
    }
  }, [assetId]);

  // ---- Asset type specific data ----
  const getTypeSpecificData = () => {
    const type = asset?.asset_type;
    const trans = asset?.transformer || {};
    const motor = asset?.motor || {};
    const generator = asset?.generator || {};

    switch (type) {
      case 'transformer':
        return {
          title: 'Transformer Specifications',
          rows: [
            { label: 'Power Rating', value: trans.power_rating_mva ? `${trans.power_rating_mva} MVA` : 'N/A' },
            { label: 'HV Voltage', value: trans.hv_voltage_kv ? `${trans.hv_voltage_kv} kV` : 'N/A' },
            { label: 'LV Voltage', value: trans.lv_voltage_kv ? `${trans.lv_voltage_kv} kV` : 'N/A' },
            { label: 'Impedance', value: trans.impedance_percent ? `${trans.impedance_percent} %` : 'N/A' },
            { label: 'Vector Group', value: trans.vector_group || 'N/A' },
            { label: 'Cooling Type', value: trans.cooling_type || 'N/A' },
            { label: 'Oil Type', value: trans.oil_type || 'N/A' },
            { label: 'No‑Load Loss', value: trans.no_load_loss_w ? `${trans.no_load_loss_w} W` : 'N/A' },
            { label: 'Load Loss', value: trans.load_loss_w ? `${trans.load_loss_w} W` : 'N/A' },
          ],
        };
      case 'motor':
        return {
          title: 'Motor Specifications',
          rows: [
            { label: 'Power Rating', value: motor.power_rating_kw ? `${motor.power_rating_kw} kW` : 'N/A' },
            { label: 'Voltage', value: motor.voltage_v ? `${motor.voltage_v} V` : 'N/A' },
            { label: 'Current', value: motor.current_a ? `${motor.current_a} A` : 'N/A' },
            { label: 'Speed', value: motor.speed_rpm ? `${motor.speed_rpm} RPM` : 'N/A' },
            { label: 'Efficiency', value: motor.efficiency_percent ? `${motor.efficiency_percent} %` : 'N/A' },
            { label: 'Frame Size', value: motor.frame_size || 'N/A' },
            { label: 'Insulation Class', value: motor.insulation_class || 'N/A' },
            { label: 'Power Factor', value: motor.power_factor ? `${motor.power_factor}` : 'N/A' },
          ],
        };
      case 'generator':
        return {
          title: 'Generator Specifications',
          rows: [
            { label: 'Power Rating', value: generator.power_rating_mva ? `${generator.power_rating_mva} MVA` : 'N/A' },
            { label: 'Voltage', value: generator.voltage_kv ? `${generator.voltage_kv} kV` : 'N/A' },
            { label: 'Speed', value: generator.speed_rpm ? `${generator.speed_rpm} RPM` : 'N/A' },
            { label: 'Frequency', value: generator.frequency_hz ? `${generator.frequency_hz} Hz` : 'N/A' },
            { label: 'Efficiency', value: generator.efficiency_percent ? `${generator.efficiency_percent} %` : 'N/A' },
            { label: 'Power Factor', value: generator.power_factor ? `${generator.power_factor}` : 'N/A' },
            { label: 'Excitation Type', value: generator.excitation_type || 'N/A' },
            { label: 'Insulation Class', value: generator.insulation_class || 'N/A' },
          ],
        };
      default:
        return { title: 'Specifications', rows: [] };
    }
  };

  // ---- Quick actions ----
  const handleNavigate = (tabId, subTabId) => {
    // Navigate to the same asset detail page with state to activate the tab
    navigate(`/assets/${assetId}`, { state: { activeTab: tabId, activeSubTab: subTabId } });
  };

  // ---- Render ----
  const typeColor = getAssetTypeColor(asset?.asset_type);
  const defaultImage = defaultImages[asset?.asset_type] || defaultImages.transformer;
  const imageUrl = asset?.photo_url || defaultImage;
  const age = calculateAge(asset?.commissioning_date);
  const criticality = asset?.criticality_level || 'N/A';

  const specData = getTypeSpecificData();

  return (
    <div style={styles.container}>
      {/* ===== TOP SECTION: Identity + Stats ===== */}
      <div style={styles.topSection}>
        {/* Left: Asset Image + Identity */}
        <div style={styles.identityCard}>
          <div style={styles.imageWrapper}>
            <img src={imageUrl} alt={asset?.asset_name} style={styles.image} />
          </div>
          <div style={styles.identity}>
            <h1 style={styles.assetName}>{asset?.asset_name}</h1>
            <div style={styles.badgeRow}>
              <span style={{ ...styles.badge, ...styles.badgeType }}>{asset?.asset_type?.toUpperCase()}</span>
              <span style={{ ...styles.badge, ...styles.badgeStatus(asset?.operational_status) }}>
                {asset?.operational_status?.toUpperCase()}
              </span>
              <span style={{ ...styles.badge, ...styles.badgeCriticality(criticality) }}>
                {criticality.toUpperCase()}
              </span>
            </div>
            <div style={styles.metaRow}>
              <span><strong>Code:</strong> {asset?.asset_code}</span>
              <span><strong>Tag:</strong> {asset?.asset_tag}</span>
              <span><strong>Manufacturer:</strong> {asset?.manufacturer || 'N/A'}</span>
              <span><strong>Model:</strong> {asset?.model || 'N/A'}</span>
              <span><strong>Location:</strong> {asset?.location_within_plant || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <FaClock size={20} color={typeColor} />
            <div style={styles.statValue}>{age}</div>
            <div style={styles.statLabel}>Age</div>
          </div>
          <div style={styles.statCard}>
            <FaFlask size={20} color={typeColor} />
            <div style={styles.statValue}>{loadingStats ? '...' : testCount}</div>
            <div style={styles.statLabel}>Total Tests</div>
          </div>
          <div style={styles.statCard}>
            <FaCalendarAlt size={20} color={typeColor} />
            <div style={styles.statValue}>{lastTestDate ? formatDate(lastTestDate) : 'N/A'}</div>
            <div style={styles.statLabel}>Last Test</div>
          </div>
          <div style={styles.statCard}>
            <FaExclamationTriangle size={20} color={typeColor} />
            <div style={styles.statValue}>{criticality}</div>
            <div style={styles.statLabel}>Criticality</div>
          </div>
        </div>
      </div>

      {/* ===== MIDDLE: Type‑Specific Specifications ===== */}
      <div style={styles.specSection}>
        <h3 style={styles.sectionTitle}>
          <FaMicrochip style={{ marginRight: '8px' }} />
          {specData.title}
        </h3>
        <div style={styles.specGrid}>
          {specData.rows.map((row, idx) => (
            <div key={idx} style={styles.specItem}>
              <span style={styles.specLabel}>{row.label}</span>
              <span style={styles.specValue}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BOTTOM: Quick Actions ===== */}
      <div style={styles.actionsSection}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionButtons}>
          <button
            onClick={() => handleNavigate('conditionDiagnostics', 'testResults')}
            style={{ ...styles.actionButton, background: '#667eea' }}
          >
            <FaFlask /> Test Results
          </button>
          <button
            onClick={() => handleNavigate('operationalIntelligence', 'liveMonitoring')}
            style={{ ...styles.actionButton, background: '#8b5cf6' }}
          >
            <FaChartBar /> Live Monitoring
          </button>
          <button
            onClick={() => handleNavigate('assetHealth', 'healthIndex')}
            style={{ ...styles.actionButton, background: '#06b6d4' }}
          >
            <FaFileAlt /> Health & Risk
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== STYLES =====
const styles = {
  container: {
    padding: '16px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: '#0f172a',
  },
  topSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  identityCard: {
    display: 'flex',
    gap: '20px',
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  imageWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  identity: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  assetName: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  badgeType: {
    background: '#e2e8f0',
    color: '#475569',
  },
  badgeStatus: (status) => {
    const map = {
      active: { bg: '#d1fae5', color: '#065f46' },
      maintenance: { bg: '#fef3c7', color: '#92400e' },
      inactive: { bg: '#fecaca', color: '#991b1b' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#475569' };
    return { background: s.bg, color: s.color };
  },
  badgeCriticality: (level) => {
    const map = {
      critical: { bg: '#fecaca', color: '#991b1b' },
      high: { bg: '#fed7aa', color: '#9a3412' },
      medium: { bg: '#fef3c7', color: '#92400e' },
      low: { bg: '#dbeafe', color: '#1e40af' },
    };
    const s = map[level] || { bg: '#f1f5f9', color: '#475569' };
    return { background: s.bg, color: s.color };
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '14px',
    color: '#1e293b',
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  statCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '4px 0',
  },
  statLabel: {
    fontSize: '13px',
    color: '#475569',
  },
  specSection: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
  },
  specItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  specLabel: {
    color: '#475569',
    fontWeight: '500',
  },
  specValue: {
    color: '#0f172a',
    fontWeight: '400',
  },
  actionsSection: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
};

export default Overview;