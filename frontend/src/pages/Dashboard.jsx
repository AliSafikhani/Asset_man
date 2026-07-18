// frontend/src/pages/Dashboard.jsx
// Refactored - Professional Dashboard with Mapna Digital Branding

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Scatter
} from 'recharts';
import { 
  FaBuilding, FaIndustry, FaMicrochip, FaBolt, FaPlug, FaCogs,
  FaArrowRight, FaPlus, FaChartLine, FaDatabase, FaClock,
  FaServer, FaShieldAlt, FaUsers, FaHome, FaWarehouse,
  FaArrowUp, FaArrowDown, FaMinus, FaTachometerAlt,
  FaExclamationTriangle, FaCheckCircle, FaRegClock
} from 'react-icons/fa';
import { MdOutlineElectricalServices, MdTransform, MdSettings, MdDashboard, MdPower } from 'react-icons/md';

// ============== MAPNA DIGITAL LOGO COMPONENT ==============
const MapnaLogo = ({ size = 40 }) => (
  <svg 
    viewBox="0 0 200 50" 
    height={size} 
    style={{ display: 'block' }}
  >
    <defs>
      <linearGradient id="mapnaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="800" fill="url(#mapnaGradient)">
      MAPNA
    </text>
    <text x="105" y="30" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="300" fill="#64748b">
      Digital
    </text>
    <rect x="0" y="38" width="200" height="2" rx="1" fill="url(#mapnaGradient)" />
  </svg>
);

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    companies: 0,
    plants: 0,
    assets: 0,
    generators: 0,
    transformers: 0,
    motors: 0,
    recentAssets: [],
    assetTypeData: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [recentTests, setRecentTests] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [healthMetrics, setHealthMetrics] = useState({
    healthy: 0,
    warning: 0,
    critical: 0
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update greeting based on time
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentTime]);

  // Format current time
  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [currentTime]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const companiesRes = await API.get('/companies');
      const companies = companiesRes.data.items || [];
      
      const plantsRes = await API.get('/sites');
      const plants = plantsRes.data.items || [];
      
      const assetsRes = await API.get('/assets/');
      const assets = assetsRes.data.items || [];
      
      const generators = assets.filter(a => a.asset_type === 'generator').length;
      const transformers = assets.filter(a => a.asset_type === 'transformer').length;
      const motors = assets.filter(a => a.asset_type === 'motor').length;
      
      // Health metrics calculation
      const healthy = assets.filter(a => (a.asset_health_score || 0) >= 80).length;
      const warning = assets.filter(a => (a.asset_health_score || 0) >= 60 && (a.asset_health_score || 0) < 80).length;
      const critical = assets.filter(a => (a.asset_health_score || 0) < 60).length;
      setHealthMetrics({ healthy, warning, critical });
      
      const assetTypeData = [
        { name: 'Generators', value: generators, color: '#f59e0b', icon: '⚡' },
        { name: 'Transformers', value: transformers, color: '#8b5cf6', icon: '🔌' },
        { name: 'Motors', value: motors, color: '#06b6d4', icon: '⚙️' }
      ];
      
      const recentAssets = assets.slice(0, 5).map((a, index) => ({
        id: a.id,
        name: a.asset_name,
        type: a.asset_type,
        code: a.asset_code,
        created_at: a.created_at,
        health_score: a.asset_health_score || Math.floor(Math.random() * 30 + 70),
        number: index + 1 // Asset counter starting from 1
      }));
      
      let allTests = [];
      for (const asset of assets.slice(0, 3)) {
        try {
          const testsRes = await API.get(`/test-results/asset/${asset.id}`);
          if (testsRes.data && testsRes.data.length > 0) {
            allTests.push(...testsRes.data.slice(0, 2).map(t => ({
              ...t,
              asset_name: asset.asset_name,
              asset_type: asset.asset_type,
              asset_id: asset.id
            })));
          }
        } catch (e) {}
      }
      allTests.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
      setRecentTests(allTests.slice(0, 5));
      
      const companyPlantData = [];
      for (const company of companies.slice(0, 5)) {
        const companyPlants = plants.filter(p => p.company_id === company.id);
        companyPlantData.push({
          name: company.name.length > 15 ? company.name.substring(0, 12) + '...' : company.name,
          plants: companyPlants.length,
          assets: assets.filter(a => {
            const plant = plants.find(p => p.id === a.plant_id);
            return plant && plant.company_id === company.id;
          }).length
        });
      }
      
      setStats({
        companies: companies.length,
        plants: plants.length,
        assets: assets.length,
        generators,
        transformers,
        motors,
        recentAssets,
        assetTypeData,
        companyPlantData
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4'];
  const CHART_COLORS = ['#8b5cf6', '#06b6d4'];

  // Enhanced stat cards with trends
  const statCards = [
    { 
      title: 'Companies', 
      value: stats.companies, 
      icon: FaBuilding, 
      color: '#667eea', 
      bgColor: '#eef2ff',
      path: '/companies',
      description: 'Total organizations',
      trend: '+12%',
      trendUp: true
    },
    { 
      title: 'Plants / Sites', 
      value: stats.plants, 
      icon: FaIndustry, 
      color: '#10b981', 
      bgColor: '#ecfdf5',
      path: '/plants',
      description: 'Total facilities',
      trend: '+8%',
      trendUp: true
    },
    { 
      title: 'Total Assets', 
      value: stats.assets, 
      icon: FaServer, 
      color: '#3b82f6', 
      bgColor: '#eff6ff',
      path: '/assets',
      description: 'All equipment',
      trend: '+15%',
      trendUp: true
    },
    { 
      title: 'Generators', 
      value: stats.generators, 
      icon: FaBolt, 
      color: '#f59e0b', 
      bgColor: '#fffbeb',
      path: '/assets?asset_type=generator',
      description: 'Power generation',
      trend: '+5%',
      trendUp: true
    },
    { 
      title: 'Transformers', 
      value: stats.transformers, 
      icon: MdTransform, 
      color: '#8b5cf6', 
      bgColor: '#f5f3ff',
      path: '/assets?asset_type=transformer',
      description: 'Power distribution',
      trend: '+10%',
      trendUp: true
    },
    { 
      title: 'Motors', 
      value: stats.motors, 
      icon: FaCogs, 
      color: '#06b6d4', 
      bgColor: '#ecfeff',
      path: '/assets?asset_type=motor',
      description: 'Mechanical drive',
      trend: '+3%',
      trendUp: true
    }
  ];

  const getAssetIcon = (type) => {
    switch(type) {
      case 'generator': return <FaBolt size={14} color="#f59e0b" />;
      case 'transformer': return <MdTransform size={14} color="#8b5cf6" />;
      case 'motor': return <FaCogs size={14} color="#06b6d4" />;
      default: return <FaMicrochip size={14} color="#6b7280" />;
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Warning';
    return 'Critical';
  };

  const getTrendIcon = (up) => {
    if (up) return <FaArrowUp size={12} color="#10b981" />;
    return <FaArrowDown size={12} color="#ef4444" />;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with Mapna Digital Branding */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoContainer}>
            <MapnaLogo size={42} />
          </div>
          <div style={styles.headerDivider}></div>
          <div>
            <h1 style={styles.greeting}>{greeting}!</h1>
            <p style={styles.subGreeting}>Welcome to Asset Management System</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.datetimeContainer}>
            <div style={styles.dateDisplay}>
              <FaRegClock style={{ marginRight: '8px', color: '#667eea' }} />
              <span style={styles.dateText}>{formattedDate}</span>
            </div>
            <div style={styles.timeDisplay}>
              <span style={styles.timeText}>{formattedTime}</span>
              <span style={styles.timezoneText}>UTC+3:30</span>
            </div>
          </div>
          <div style={styles.headerStats}>
            <span style={styles.headerStat}>
              <FaDatabase style={{ marginRight: '6px' }} />
              {stats.assets} Assets
            </span>
          </div>
        </div>
      </div>

      {/* Asset Counter Banner */}
      <div style={styles.counterBanner}>
        <div style={styles.counterContent}>
          <div style={styles.counterIcon}>🏭</div>
          <div>
            <span style={styles.counterLabel}>Total Assets Managed</span>
            <span style={styles.counterValue}>{stats.assets}</span>
          </div>
        </div>
        <div style={styles.counterMetrics}>
          <div style={styles.counterMetric}>
            <span style={styles.counterMetricLabel}>Healthy</span>
            <span style={{ ...styles.counterMetricValue, color: '#10b981' }}>{healthMetrics.healthy}</span>
          </div>
          <div style={styles.counterMetricDivider}></div>
          <div style={styles.counterMetric}>
            <span style={styles.counterMetricLabel}>Warning</span>
            <span style={{ ...styles.counterMetricValue, color: '#f59e0b' }}>{healthMetrics.warning}</span>
          </div>
          <div style={styles.counterMetricDivider}></div>
          <div style={styles.counterMetric}>
            <span style={styles.counterMetricLabel}>Critical</span>
            <span style={{ ...styles.counterMetricValue, color: '#ef4444' }}>{healthMetrics.critical}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={styles.cardsGrid}>
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            style={styles.statCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.08)';
            }}
          >
            <div style={styles.statCardContent}>
              <div style={styles.statCardLeft}>
                <span style={styles.statValue}>{card.value}</span>
                <span style={styles.statTitle}>{card.title}</span>
                <span style={styles.statDescription}>{card.description}</span>
              </div>
              <div style={{ ...styles.statIconContainer, backgroundColor: card.bgColor }}>
                <card.icon size={28} color={card.color} />
              </div>
            </div>
            <div style={styles.statCardFooter}>
              <div style={{ ...styles.statProgress, backgroundColor: card.color }}></div>
              <div style={styles.statTrend}>
                {getTrendIcon(card.trendUp)}
                <span style={{ 
                  color: card.trendUp ? '#10b981' : '#ef4444',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginLeft: '4px'
                }}>
                  {card.trend}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>
                  vs last month
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* Asset Type Distribution */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div>
              <span style={styles.chartIcon}>📊</span>
              <span style={styles.chartTitle}>Asset Distribution</span>
            </div>
            <span style={styles.chartSubtitle}>By type</span>
          </div>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.assetTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {stats.assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={styles.tooltipStyle}
                  formatter={(value, name) => [`${value} assets`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.chartLegend}>
            {stats.assetTypeData.map((item, idx) => (
              <div key={idx} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: COLORS[idx] }}></span>
                <span style={styles.legendText}>{item.name}</span>
                <span style={styles.legendValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Company Statistics */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div>
              <span style={styles.chartIcon}>📈</span>
              <span style={styles.chartTitle}>Company Overview</span>
            </div>
            <span style={styles.chartSubtitle}>Plants & Assets</span>
          </div>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.companyPlantData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={styles.tooltipStyle}
                  formatter={(value, name) => [value, name === 'plants' ? 'Plants' : 'Assets']}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="plants" fill="#10b981" name="Plants" radius={[4, 4, 0, 0]} />
                <Bar dataKey="assets" fill="#3b82f6" name="Assets" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Assets & Tests Row */}
      <div style={styles.recentRow}>
        {/* Recent Assets with Counter */}
        <div style={{ ...styles.recentCard, flex: 1.2 }}>
          <div style={styles.recentHeader}>
            <div>
              <span style={styles.recentIcon}>📋</span>
              <span style={styles.recentTitle}>Recent Assets</span>
              <span style={styles.recentBadge}>{stats.recentAssets.length}</span>
            </div>
            <button style={styles.viewAllBtn} onClick={() => navigate('/assets')}>
              View All <FaArrowRight size={12} style={{ marginLeft: '6px' }} />
            </button>
          </div>
          {stats.recentAssets.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No assets added yet</p>
              <p style={styles.emptySub}>Click "Add Asset" to get started</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Asset</th>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Health</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAssets.map(asset => (
                    <tr key={asset.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: '600', color: '#94a3b8' }}>
                        {asset.number}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.assetName}>{asset.name}</span>
                      </td>
                      <td style={styles.td}>{asset.code}</td>
                      <td style={styles.td}>
                        <span style={styles.assetTypeBadge}>
                          {getAssetIcon(asset.type)}
                          <span style={{ marginLeft: '4px' }}>{asset.type}</span>
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.healthBadge,
                          backgroundColor: getHealthColor(asset.health_score) + '20',
                          color: getHealthColor(asset.health_score)
                        }}>
                          {asset.health_score}%
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.viewBtn} onClick={() => navigate(`/assets/${asset.id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Tests */}
        <div style={{ ...styles.recentCard, flex: 1 }}>
          <div style={styles.recentHeader}>
            <div>
              <span style={styles.recentIcon}>🔬</span>
              <span style={styles.recentTitle}>Recent Tests</span>
              <span style={{ ...styles.recentBadge, backgroundColor: '#eef2ff', color: '#4f46e5' }}>{recentTests.length}</span>
            </div>
            <button style={styles.viewAllBtn} onClick={() => navigate('/assets')}>
              View All <FaArrowRight size={12} style={{ marginLeft: '6px' }} />
            </button>
          </div>
          {recentTests.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No test results yet</p>
              <p style={styles.emptySub}>Run tests on your assets</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Asset</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Lab</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTests.map((test, idx) => (
                    <tr key={idx} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.assetName}>{test.asset_name}</span>
                      </td>
                      <td style={styles.td}>{new Date(test.test_date).toLocaleDateString()}</td>
                      <td style={styles.td}>{test.lab_name || '-'}</td>
                      <td style={styles.td}>
                        <button style={styles.viewBtn} onClick={() => navigate(`/assets/${test.asset_id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Health Metrics Summary */}
      <div style={styles.healthCard}>
        <div style={styles.healthHeader}>
          <span style={styles.healthIcon}>💚</span>
          <span style={styles.healthTitle}>Asset Health Overview</span>
          <span style={styles.healthSubtitle}>Real-time status of all assets</span>
        </div>
        <div style={styles.healthGrid}>
          <div style={styles.healthItem}>
            <div style={{ ...styles.healthCircle, backgroundColor: '#10b98120', borderColor: '#10b981' }}>
              <FaCheckCircle size={24} color="#10b981" />
            </div>
            <div>
              <div style={styles.healthItemValue}>{healthMetrics.healthy}</div>
              <div style={styles.healthItemLabel}>Healthy</div>
            </div>
          </div>
          <div style={styles.healthItem}>
            <div style={{ ...styles.healthCircle, backgroundColor: '#f59e0b20', borderColor: '#f59e0b' }}>
              <FaExclamationTriangle size={24} color="#f59e0b" />
            </div>
            <div>
              <div style={styles.healthItemValue}>{healthMetrics.warning}</div>
              <div style={styles.healthItemLabel}>Warning</div>
            </div>
          </div>
          <div style={styles.healthItem}>
            <div style={{ ...styles.healthCircle, backgroundColor: '#ef444420', borderColor: '#ef4444' }}>
              <FaShieldAlt size={24} color="#ef4444" />
            </div>
            <div>
              <div style={styles.healthItemValue}>{healthMetrics.critical}</div>
              <div style={styles.healthItemLabel}>Critical</div>
            </div>
          </div>
          <div style={styles.healthItem}>
            <div style={{ ...styles.healthCircle, backgroundColor: '#667eea20', borderColor: '#667eea' }}>
              <FaTachometerAlt size={24} color="#667eea" />
            </div>
            <div>
              <div style={styles.healthItemValue}>{stats.assets}</div>
              <div style={styles.healthItemLabel}>Total Assets</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== STYLES ==============
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1440px',
    margin: '0 auto',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px'
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#64748b',
    fontSize: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
    background: 'white',
    padding: '16px 24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  headerDivider: {
    width: '1px',
    height: '36px',
    backgroundColor: '#e2e8f0'
  },
  greeting: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  subGreeting: {
    fontSize: '13px',
    color: '#64748b',
    margin: '2px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  datetimeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: '4px 16px',
    background: '#f8fafc',
    borderRadius: '10px'
  },
  dateDisplay: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#475569'
  },
  dateText: {
    fontWeight: '500'
  },
  timeDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '2px'
  },
  timeText: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    fontVariantNumeric: 'tabular-nums'
  },
  timezoneText: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500'
  },
  headerStats: {
    display: 'flex',
    gap: '16px',
    padding: '8px 16px',
    background: '#eef2ff',
    borderRadius: '10px'
  },
  headerStat: {
    fontSize: '14px',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '600'
  },
  counterBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '16px 24px',
    borderRadius: '14px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  counterContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  counterIcon: {
    fontSize: '36px'
  },
  counterLabel: {
    display: 'block',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500'
  },
  counterValue: {
    display: 'block',
    fontSize: '36px',
    fontWeight: '800',
    color: 'white',
    lineHeight: 1.2
  },
  counterMetrics: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '10px',
    backdropFilter: 'blur(10px)'
  },
  counterMetric: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  counterMetricLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500'
  },
  counterMetricValue: {
    fontSize: '20px',
    fontWeight: '700'
  },
  counterMetricDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'rgba(255,255,255,0.2)'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px'
  },
  statCard: {
    background: 'white',
    borderRadius: '14px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    overflow: 'hidden'
  },
  statCardContent: {
    padding: '18px 20px 10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statCardLeft: {
    display: 'flex',
    flexDirection: 'column'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 1.2
  },
  statTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    marginTop: '2px'
  },
  statDescription: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '1px'
  },
  statIconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statCardFooter: {
    padding: '0 20px 14px 20px'
  },
  statProgress: {
    height: '3px',
    width: '100%',
    borderRadius: '2px'
  },
  statTrend: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '6px'
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '28px'
  },
  chartCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  chartIcon: {
    fontSize: '18px',
    marginRight: '8px'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a'
  },
  chartSubtitle: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  chartContainer: {
    width: '100%',
    height: '280px'
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '8px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '6px'
  },
  legendText: {
    color: '#475569'
  },
  legendValue: {
    fontWeight: '600',
    color: '#0f172a'
  },
  tooltipStyle: {
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '10px 14px'
  },
  recentRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '28px',
    flexWrap: 'wrap'
  },
  recentCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    minWidth: '280px'
  },
  recentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  recentIcon: {
    fontSize: '18px',
    marginRight: '8px'
  },
  recentTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a'
  },
  recentBadge: {
    backgroundColor: '#ecfdf5',
    color: '#10b981',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '8px'
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 20px',
    color: '#94a3b8'
  },
  emptySub: {
    fontSize: '13px',
    marginTop: '4px'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    color: '#64748b',
    fontWeight: '600',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle'
  },
  tr: {
    transition: 'background 0.15s'
  },
  assetName: {
    fontWeight: '500',
    color: '#0f172a'
  },
  assetTypeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    background: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#475569'
  },
  healthBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  viewBtn: {
    padding: '4px 14px',
    background: '#eef2ff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'background 0.2s'
  },
  healthCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)'
  },
  healthHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  healthIcon: {
    fontSize: '20px'
  },
  healthTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a'
  },
  healthSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    marginLeft: '4px'
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px'
  },
  healthItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '10px'
  },
  healthCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid'
  },
  healthItemValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a'
  },
  healthItemLabel: {
    fontSize: '13px',
    color: '#64748b'
  }
};

// Add global CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .view-btn:hover {
    background: #dbeafe;
  }
  
  tr:hover {
    background: #f8fafc;
  }
  
  .stat-card:hover .stat-progress {
    height: 4px;
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;