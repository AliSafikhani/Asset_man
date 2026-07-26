// frontend/src/components/AssetDetail/tabs/NameplateTab/index.jsx
import React, { useState } from 'react';
import { FaBolt, FaCogs, FaBox, FaCalendarAlt, FaMapMarkerAlt, FaIndustry, FaFileAlt, FaChartBar, FaWrench } from 'react-icons/fa';
import { MdTransform, MdBuild } from 'react-icons/md';

// ---- Default image URLs for each asset type ----
const defaultImages = {
  transformer: 'https://assets.siemens-energy.com/dam/ab8c29d4-ff32-4bb5-a6ef-b13f00953cea/GSU_Trafo_Belt_mitSchatten_rechts-jpg_Original%20file.jpg',
  generator: 'https://assets.siemens-energy.com/dam/5d4c32bb-d397-47f1-ba1a-b08300cd1148/sgen-100a-2p-cutopen-ontransparent-highres-png_Rendition1920.PNG?apr_optimization=false',
  motor: 'https://chesscontrols.com/wp-content/uploads/Screen-Shot-2021-06-08-at-9.16.01-AM.png',
};

const AssetOverview = ({ asset }) => {
  const [imageError, setImageError] = useState(false);

  if (!asset) return <div>No asset data</div>;

  // Helper to format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get the right icon for asset type (used in overlay)
  const getAssetIcon = () => {
    const type = asset.asset_type;
    const size = 28;
    const color = '#ffffff';
    if (type === 'transformer') return <MdTransform size={size} color={color} />;
    if (type === 'generator') return <FaBolt size={size} color={color} />;
    if (type === 'motor') return <FaCogs size={size} color={color} />;
    return <FaBox size={size} color={color} />;
  };

  // Get background color based on asset type (for the overlay)
  const getAssetTypeColor = () => {
    const colors = { generator: '#f59e0b', transformer: '#8b5cf6', motor: '#06b6d4' };
    return colors[asset.asset_type] || '#64748b';
  };

  // Determine which image to show
  const defaultImage = defaultImages[asset.asset_type] || defaultImages.transformer;
  const imageSource = asset.photo_url && !imageError ? asset.photo_url : defaultImage;

  // Transformer-specific data
  const transformer = asset.transformer || {};

  // Placeholder for test count (you'll fetch this later)
  const testCount = 0;

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.imageContainer}>
          <img
            src={imageSource}
            alt={asset.asset_name}
            style={styles.assetImage}
            onError={() => setImageError(true)}
          />
        </div>
        <div style={styles.headerInfo}>
          <h1 style={styles.assetName}>{asset.asset_name}</h1>
          <div style={styles.assetBadges}>
            <span style={{ ...styles.badge, ...styles.badgeType }}>{asset.asset_type?.toUpperCase()}</span>
            <span style={{ ...styles.badge, ...styles.badgeStatus(asset.operational_status) }}>
              {asset.operational_status?.toUpperCase()}
            </span>
            <span style={{ ...styles.badge, ...styles.badgeCriticality(asset.criticality_level) }}>
              {asset.criticality_level?.toUpperCase()}
            </span>
          </div>
          <div style={styles.metaInfo}>
            <span><FaFileAlt style={{ marginRight: '6px' }} /> {asset.asset_code}</span>
            <span><FaIndustry style={{ marginRight: '6px' }} /> {asset.manufacturer || 'N/A'}</span>
            <span><FaCalendarAlt style={{ marginRight: '6px' }} /> Installed: {formatDate(asset.installation_date)}</span>
            <span><FaMapMarkerAlt style={{ marginRight: '6px' }} /> {asset.location_within_plant || 'N/A'}</span>
          </div>
        </div>
        {/* Icon overlay */}
        <div style={{ ...styles.iconOverlay, background: getAssetTypeColor() }}>
          {getAssetIcon()}
        </div>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaChartBar /></div>
          <div style={styles.statValue}>{testCount}</div>
          <div style={styles.statLabel}>Test Results</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaWrench /></div>
          <div style={styles.statValue}>0</div>
          <div style={styles.statLabel}>Maintenance Events</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaCalendarAlt /></div>
          <div style={styles.statValue}>{formatDate(asset.commissioning_date)}</div>
          <div style={styles.statLabel}>Commissioned</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><MdBuild /></div>
          <div style={styles.statValue}>{asset.model || 'N/A'}</div>
          <div style={styles.statLabel}>Model</div>
        </div>
      </div>

      {/* Main Data Grid – same as before */}
      <div style={styles.dataGrid}>
        {/* General Information */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>General Information</h3>
          <div style={styles.cardContent}>
            <div style={styles.row}><span style={styles.label}>Asset Code</span><span style={styles.value}>{asset.asset_code || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Asset Tag</span><span style={styles.value}>{asset.asset_tag || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Manufacturer</span><span style={styles.value}>{asset.manufacturer || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Model</span><span style={styles.value}>{asset.model || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Serial Number</span><span style={styles.value}>{asset.serial_number || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Manufacturing Year</span><span style={styles.value}>{asset.manufacturing_year || 'N/A'}</span></div>
          </div>
        </div>

        {/* Operational Data */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Operational Data</h3>
          <div style={styles.cardContent}>
            <div style={styles.row}><span style={styles.label}>Installation Date</span><span style={styles.value}>{formatDate(asset.installation_date)}</span></div>
            <div style={styles.row}><span style={styles.label}>Commissioning Date</span><span style={styles.value}>{formatDate(asset.commissioning_date)}</span></div>
            <div style={styles.row}><span style={styles.label}>Operational Status</span><span style={styles.value}>{asset.operational_status || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Location</span><span style={styles.value}>{asset.location_within_plant || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Criticality Level</span><span style={styles.value}>{asset.criticality_level || 'N/A'}</span></div>
            <div style={styles.row}><span style={styles.label}>Documentation</span><span style={styles.value}>
              {asset.technical_documentation_url ? <a href={asset.technical_documentation_url} target="_blank" rel="noopener noreferrer">Link</a> : 'N/A'}
            </span></div>
          </div>
        </div>

        {/* Transformer-specific Technical Data */}
        {asset.asset_type === 'transformer' && (
          <>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Transformer Technical Data</h3>
              <div style={styles.cardContent}>
                <div style={styles.row}><span style={styles.label}>Type</span><span style={styles.value}>{transformer.transformer_type || 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Power Rating</span><span style={styles.value}>{transformer.power_rating_mva || 'N/A'} MVA</span></div>
                <div style={styles.row}><span style={styles.label}>HV Voltage</span><span style={styles.value}>{transformer.hv_voltage_kv || 'N/A'} kV</span></div>
                <div style={styles.row}><span style={styles.label}>LV Voltage</span><span style={styles.value}>{transformer.lv_voltage_kv || 'N/A'} kV</span></div>
                <div style={styles.row}><span style={styles.label}>Impedance</span><span style={styles.value}>{transformer.impedance_percent || 'N/A'} %</span></div>
                <div style={styles.row}><span style={styles.label}>Vector Group</span><span style={styles.value}>{transformer.vector_group || 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Cooling Type</span><span style={styles.value}>{transformer.cooling_type || 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Oil Type</span><span style={styles.value}>{transformer.oil_type || 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Insulation Class</span><span style={styles.value}>{transformer.insulation_class || 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Frequency</span><span style={styles.value}>{transformer.frequency_hz || 'N/A'} Hz</span></div>
                <div style={styles.row}><span style={styles.label}>Weight</span><span style={styles.value}>{transformer.weight_kg ? `${transformer.weight_kg} kg` : 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Oil Volume</span><span style={styles.value}>{transformer.oil_volume_liters ? `${transformer.oil_volume_liters} L` : 'N/A'}</span></div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Transformer Performance</h3>
              <div style={styles.cardContent}>
                <div style={styles.row}><span style={styles.label}>No‑Load Loss</span><span style={styles.value}>{transformer.no_load_loss_w ? `${transformer.no_load_loss_w} W` : 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Load Loss</span><span style={styles.value}>{transformer.load_loss_w ? `${transformer.load_loss_w} W` : 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Efficiency</span><span style={styles.value}>{transformer.efficiency_percent ? `${transformer.efficiency_percent} %` : 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Temperature Rise (Oil)</span><span style={styles.value}>{transformer.temperature_rise_oil_c ? `${transformer.temperature_rise_oil_c} °C` : 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Temperature Rise (Winding)</span><span style={styles.value}>{transformer.temperature_rise_winding_c ? `${transformer.temperature_rise_winding_c} °C` : 'N/A'}</span></div>
                <div style={styles.row}><span style={styles.label}>Magnetizing Current</span><span style={styles.value}>{transformer.magnetizing_current_percent ? `${transformer.magnetizing_current_percent} %` : 'N/A'}</span></div>
              </div>
            </div>
          </>
        )}
        {/* You can add similar sections for motor and generator later */}
      </div>
    </div>
  );
};

// ========== STYLES (unchanged) ==========
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    flexWrap: 'wrap',
    position: 'relative',
  },
  imageContainer: {
    width: '150px',
    height: '150px',
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
  },
  assetImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    border: '2px solid white',
  },
  headerInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    color: '#0f172a',
  },
  assetBadges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '8px',
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
  metaInfo: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '24px',
    color: '#667eea',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  dataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  cardTitle: {
    margin: '0',
    padding: '16px 20px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  cardContent: {
    padding: '16px 20px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
  },
  label: {
    color: '#64748b',
    fontWeight: '500',
  },
  value: {
    color: '#0f172a',
    fontWeight: '400',
    textAlign: 'right',
    maxWidth: '60%',
  },
};

export default AssetOverview;