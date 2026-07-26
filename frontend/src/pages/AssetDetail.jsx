// frontend/src/pages/AssetDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaFlask,
  FaClock,
  FaMapMarkerAlt,
  FaIndustry,
  FaBolt,
  FaWrench,
  FaFileAlt,
} from 'react-icons/fa';
import API from '../services/api';
import { getAssetIcon, getAssetTypeColor } from '../utils/assetHelpers';
import { MAIN_TABS } from '../config/assetTabsConfig';
import TabNavigation from '../components/AssetDetail/common/TabNavigation';
import LazyTab from '../components/AssetDetail/common/LazyTab';

// ---- Helpers ----
const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const calculateAge = (dateStr) => {
  if (!dateStr) return '—';
  const years = new Date().getFullYear() - new Date(dateStr).getFullYear();
  return years > 0 ? `${years} years` : `${Math.abs(years)} years (future)`;
};

// ---- Dynamic tab labels ----
const getDynamicTabLabel = (tab, assetType) => {
  if (tab.id === 'assetProfile') return `${capitalize(assetType)} Profile`;
  if (tab.id === 'assetHealth') return `${capitalize(assetType)} Health`;
  return tab.label;
};

function AssetDetail() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState('assetProfile');
  const [testCount, setTestCount] = useState(0);
  const [lastTestDate, setLastTestDate] = useState(null);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        const res = await API.get(`/assets/${assetId}`);
        setAsset(res.data);
        // Fetch test stats
        const testRes = await API.get(`/test-results/?asset_id=${assetId}&page=1&page_size=1`);
        const total = testRes.headers?.['x-total-count'] || testRes.data?.meta?.total || testRes.data?.length || 0;
        setTestCount(total);
        if (testRes.data && testRes.data.length > 0) {
          setLastTestDate(testRes.data[0].test_date);
        }
      } catch (error) {
        console.error('Error loading asset:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAsset();
  }, [assetId]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return <div style={styles.container}>Asset not found</div>;
  }

  const typeColor = getAssetTypeColor(asset.asset_type);
  const age = calculateAge(asset.commissioning_date);
  const lastTest = lastTestDate ? formatDate(lastTestDate) : '—';

  const dynamicTabs = MAIN_TABS.map((tab) => ({
    ...tab,
    label: getDynamicTabLabel(tab, asset.asset_type),
  }));

  const tabProps = { assetId: asset.id, asset };

  return (
    <div style={styles.container}>
      {/* ===== HERO BANNER ===== */}
      <div style={{ ...styles.hero, borderBottomColor: typeColor }}>
        <div style={styles.heroContent}>
          {/* Back button + breadcrumb */}
          <div style={styles.topNav}>
            <button onClick={() => navigate('/assets')} style={styles.backButton}>
              <FaArrowLeft size={14} /> Back to Assets
            </button>
            <span style={styles.breadcrumb}>/ {asset.asset_code}</span>
          </div>

          {/* Main hero row */}
          <div style={styles.heroMain}>
            {/* Left: Icon + Identity */}
            <div style={styles.heroIdentity}>
              <div style={{ ...styles.heroIcon, background: `${typeColor}15`, borderColor: typeColor }}>
                {getAssetIcon(asset.asset_type)}
              </div>
              <div>
                <h1 style={styles.heroTitle}>{asset.asset_name}</h1>
                <div style={styles.heroBadges}>
                  <span style={{ ...styles.badge, ...styles.badgeType }}>{asset.asset_type?.toUpperCase()}</span>
                  <span style={{ ...styles.badge, ...styles.badgeStatus(asset.operational_status) }}>
                    {asset.operational_status?.toUpperCase()}
                  </span>
                  <span style={{ ...styles.badge, ...styles.badgeCriticality(asset.criticality_level) }}>
                    {asset.criticality_level?.toUpperCase()}
                  </span>
                </div>
                <div style={styles.heroMeta}>
                  <span><FaIndustry size={14} /> {asset.manufacturer || '—'}</span>
                  <span><FaMapMarkerAlt size={14} /> {asset.location_within_plant || '—'}</span>
                  <span><FaCalendarAlt size={14} /> Installed {formatDate(asset.installation_date)}</span>
                </div>
              </div>
            </div>

            {/* Right: KPI cards */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, color: typeColor }}><FaClock /></div>
                <div style={styles.kpiValue}>{age}</div>
                <div style={styles.kpiLabel}>Age</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, color: typeColor }}><FaFlask /></div>
                <div style={styles.kpiValue}>{testCount}</div>
                <div style={styles.kpiLabel}>Tests</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, color: typeColor }}><FaCalendarAlt /></div>
                <div style={styles.kpiValue}>{lastTest}</div>
                <div style={styles.kpiLabel}>Last Test</div>
              </div>
              <div style={styles.kpiCard}>
                <div style={{ ...styles.kpiIcon, color: typeColor }}><FaBolt /></div>
                <div style={styles.kpiValue}>{asset.model || '—'}</div>
                <div style={styles.kpiLabel}>Model</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TAB NAVIGATION (sticky) ===== */}
      <div style={styles.tabsWrapper}>
        <TabNavigation
          tabs={dynamicTabs}
          activeId={activeTabId}
          onSelect={setActiveTabId}
        />
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div style={styles.tabContent}>
        {MAIN_TABS.map((tab) => (
          <div key={tab.id} style={{ display: activeTabId === tab.id ? 'block' : 'none' }}>
            <LazyTab importFn={tab.component} componentProps={tabProps} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '0 24px 32px',
    background: '#f1f5f9',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#475569',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  // ---- HERO ----
  hero: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px 32px',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    borderBottom: '4px solid #667eea',
  },
  heroContent: {
    maxWidth: '100%',
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#475569',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f1f5f9',
    },
  },
  breadcrumb: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  heroMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px',
  },
  heroIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flex: '1 1 50%',
  },
  heroIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid',
    flexShrink: 0,
  },
  heroTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  heroBadges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '6px',
  },
  badge: {
    padding: '2px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
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
  heroMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '8px',
    fontSize: '14px',
    color: '#64748b',
    '& span': {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    flexShrink: 0,
  },
  kpiCard: {
    background: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '12px',
    textAlign: 'center',
    minWidth: '80px',
    border: '1px solid #f1f5f9',
  },
  kpiIcon: {
    fontSize: '20px',
    marginBottom: '2px',
  },
  kpiValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: '2px',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginTop: '2px',
  },
  // ---- TABS ----
  tabsWrapper: {
    position: 'sticky',
    top: '0',
    background: '#f1f5f9',
    padding: '12px 0',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  },
  tabContent: {
    marginTop: '8px',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default AssetDetail;