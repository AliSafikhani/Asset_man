// frontend/src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  FaBuilding, FaIndustry, FaMicrochip, FaBolt, FaPlug, FaCogs,
  FaArrowRight, FaPlus, FaChartLine, FaDatabase, FaClock,
  FaServer, FaShieldAlt, FaUsers, FaHome, FaWarehouse
} from 'react-icons/fa';
import { MdOutlineElectricalServices, MdTransform, MdSettings, MdDashboard } from 'react-icons/md';

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
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
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
      
      const assetTypeData = [
        { name: 'Generators', value: generators, color: '#f59e0b', icon: '⚡' },
        { name: 'Transformers', value: transformers, color: '#8b5cf6', icon: '🔌' },
        { name: 'Motors', value: motors, color: '#06b6d4', icon: '⚙️' }
      ];
      
      const recentAssets = assets.slice(0, 5).map(a => ({
        id: a.id,
        name: a.asset_name,
        type: a.asset_type,
        code: a.asset_code,
        created_at: a.created_at,
        health_score: a.asset_health_score || Math.floor(Math.random() * 30 + 70)
      }));
      
      let allTests = [];
      for (const asset of assets.slice(0, 3)) {
        try {
          const testsRes = await API.get(`/test-results/asset/${asset.id}`);
          if (testsRes.data && testsRes.data.length > 0) {
            allTests.push(...testsRes.data.slice(0, 2).map(t => ({
              ...t,
              asset_name: asset.asset_name,
              asset_type: asset.asset_type
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

  const statCards = [
    { 
      title: 'Companies', 
      value: stats.companies, 
      icon: FaBuilding, 
      color: '#667eea', 
      bgColor: '#eef2ff',
      path: '/companies',
      description: 'Total organizations'
    },
    { 
      title: 'Plants / Sites', 
      value: stats.plants, 
      icon: FaIndustry, 
      color: '#10b981', 
      bgColor: '#ecfdf5',
      path: '/plants',
      description: 'Total facilities'
    },
    { 
      title: 'Total Assets', 
      value: stats.assets, 
      icon: FaServer, 
      color: '#3b82f6', 
      bgColor: '#eff6ff',
      path: '/assets',
      description: 'All equipment'
    },
    { 
      title: 'Generators', 
      value: stats.generators, 
      icon: FaBolt, 
      color: '#f59e0b', 
      bgColor: '#fffbeb',
      path: '/assets?asset_type=generator',
      description: 'Power generation'
    },
    { 
      title: 'Transformers', 
      value: stats.transformers, 
      icon: MdTransform, 
      color: '#8b5cf6', 
      bgColor: '#f5f3ff',
      path: '/assets?asset_type=transformer',
      description: 'Power distribution'
    },
    { 
      title: 'Motors', 
      value: stats.motors, 
      icon: FaCogs, 
      color: '#06b6d4', 
      bgColor: '#ecfeff',
      path: '/assets?asset_type=motor',
      description: 'Mechanical drive'
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
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.greetingIcon}>👋</div>
          <div>
            <h1 style={styles.greeting}>{greeting}!</h1>
            <p style={styles.subGreeting}>Welcome back to your Asset Management Dashboard</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.headerStats}>
            <span style={styles.headerStat}>
              <FaDatabase style={{ marginRight: '6px' }} />
              {stats.assets} Assets
            </span>
            <span style={styles.headerStat}>
              <FaClock style={{ marginRight: '6px' }} />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          {/* <button style={styles.addAssetBtn} onClick={() => navigate('/assets/new')}> */}
            {/* <FaPlus size={16} /> Add Asset
          </button> */}
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
            <div style={{ ...styles.statProgress, backgroundColor: card.color }}></div>
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
        {/* Recent Assets */}
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

      {/* Quick Actions */}
      <div style={styles.quickActionsCard}>
        <div style={styles.quickActionsHeader}>
          <span style={styles.quickActionsIcon}>⚡</span>
          <span style={styles.quickActionsTitle}>Quick Actions</span>
        </div>
        <div style={styles.quickActionsGrid}>
          <button style={styles.quickActionBtn} onClick={() => navigate('/companies')}>
            <FaBuilding size={20} color="#667eea" />
            <span>Companies</span>
          </button>
          <button style={styles.quickActionBtn} onClick={() => navigate('/plants')}>
            <FaIndustry size={20} color="#10b981" />
            <span>Plants</span>
          </button>
          <button style={styles.quickActionBtn} onClick={() => navigate('/assets')}>
            <FaServer size={20} color="#3b82f6" />
            <span>All Assets</span>
          </button>
          <button style={styles.quickActionBtn} onClick={() => navigate('/assets?asset_type=generator')}>
            <FaBolt size={20} color="#f59e0b" />
            <span>Generators</span>
          </button>
          <button style={styles.quickActionBtn} onClick={() => navigate('/assets?asset_type=transformer')}>
            <MdTransform size={20} color="#8b5cf6" />
            <span>Transformers</span>
          </button>
          <button style={styles.quickActionBtn} onClick={() => navigate('/assets?asset_type=motor')}>
            <FaCogs size={20} color="#06b6d4" />
            <span>Motors</span>
          </button>
        </div>
      </div>
    </div>
  );
}

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
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  greetingIcon: {
    fontSize: '36px',
    background: '#eef2ff',
    padding: '12px',
    borderRadius: '16px'
  },
  greeting: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  subGreeting: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerStats: {
    display: 'flex',
    gap: '16px',
    padding: '8px 16px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  headerStat: {
    fontSize: '14px',
    color: '#475569',
    display: 'flex',
    alignItems: 'center'
  },
  addAssetBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s'
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
    padding: '0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    overflow: 'hidden'
  },
  statCardContent: {
    padding: '18px 20px 14px 20px',
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
  statProgress: {
    height: '4px',
    width: '100%',
    borderRadius: '0 0 14px 14px'
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
  quickActionsCard: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)'
  },
  quickActionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  quickActionsIcon: {
    fontSize: '20px'
  },
  quickActionsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a'
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px'
  },
  quickActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#0f172a',
    transition: 'all 0.2s'
  }
};

// Add this to your global CSS or at the bottom of the file
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .view-btn:hover {
    background: #dbeafe;
  }
  
  .quick-action-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    transform: translateY(-2px);
  }
  
  .stat-card:hover .stat-progress {
    height: 6px;
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;