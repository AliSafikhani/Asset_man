import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer 
} from 'recharts';

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load companies
      const companiesRes = await API.get('/companies');
      const companies = companiesRes.data.items || [];
      
      // Load plants
      const plantsRes = await API.get('/sites');
      const plants = plantsRes.data.items || [];
      
      // Load assets
      const assetsRes = await API.get('/assets/');
      const assets = assetsRes.data.items || [];
      
      // Calculate stats
      const generators = assets.filter(a => a.asset_type === 'generator').length;
      const transformers = assets.filter(a => a.asset_type === 'transformer').length;
      const motors = assets.filter(a => a.asset_type === 'motor').length;
      
      // Asset type distribution for pie chart
      const assetTypeData = [
        { name: 'Generators', value: generators, color: '#f59e0b', icon: '' },
        { name: 'Transformers', value: transformers, color: '#8b5cf6', icon: '' },
        { name: 'Motors', value: motors, color: '#06b6d4', icon: '' }
      ];
      
      // Recent assets (last 5)
      const recentAssets = assets.slice(0, 5).map(a => ({
        id: a.id,
        name: a.asset_name,
        type: a.asset_type,
        code: a.asset_code,
        created_at: a.created_at
      }));
      
      // Get recent test results
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
      
      // Company-Plant distribution for bar chart
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

  const statCards = [
    { title: 'Companies', value: stats.companies, icon: '', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', path: '/companies' },
    { title: 'Plants / Sites', value: stats.plants, icon: '', color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', path: '/plants' },
    { title: 'Total Assets', value: stats.assets, icon: '', color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', path: '/assets' },
    { title: 'Generators', value: stats.generators, icon: '', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', path: '/assets?asset_type=generator' },
    { title: 'Transformers', value: stats.transformers, icon: '', color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', path: '/assets?asset_type=transformer' },
    { title: 'Motors', value: stats.motors, icon: '', color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', path: '/assets?asset_type=motor' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="pulse">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: '#6b7280' }}>Welcome to your Asset Management System overview</p>
      </div>
      
      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.path)}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>{card.title}</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{card.value}</p>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: card.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {/* Asset Type Distribution - Pie Chart */}
        <Card title="Asset Type Distribution" icon="">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.assetTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.assetTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Company vs Plants/Assets - Bar Chart */}
        <Card title="Company Statistics" icon="">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.companyPlantData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="plants" fill="#10b981" name="Plants" />
              <Bar dataKey="assets" fill="#3b82f6" name="Assets" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Recent Assets Table */}
      <Card title="Recent Assets" icon="📋" actions={
        <Button size="sm" onClick={() => navigate('/assets')}>View All</Button>
      }>
        {stats.recentAssets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No assets added yet. Click "Add Asset" to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Code</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAssets.map(asset => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}><strong>{asset.name}</strong></td>
                    <td style={{ padding: '12px' }}>{asset.code}</td>
                    <td style={{ padding: '12px' }}>
                      {asset.type === 'generator' ? ' Generator' : asset.type === 'transformer' ? ' Transformer' : '⚙️ Motor'}
                    </td>
                    <td style={{ padding: '12px' }}>{asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <Button size="sm" onClick={() => navigate(`/assets/${asset.id}`)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Recent Test Results */}
      <Card title="Recent Test Results" icon="🔬" actions={
        <Button size="sm" onClick={() => navigate('/assets')}>View All Assets</Button>
      } style={{ marginTop: '20px' }}>
        {recentTests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            No test results yet. Go to an asset and add test results.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Asset</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Test Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Lab</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTests.map((test, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}><strong>{test.asset_name}</strong></td>
                    <td style={{ padding: '12px' }}>
                      {test.asset_type === 'generator' ? '' : test.asset_type === 'transformer' ? '' : ''}
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(test.test_date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{test.lab_name || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <Button size="sm" onClick={() => navigate(`/assets/${test.asset_id}`)}>View Asset</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Quick Actions */}
      <Card title="Quick Actions" icon="" style={{ marginTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          <Button onClick={() => navigate('/companies')}> Manage Companies</Button>
          <Button onClick={() => navigate('/plants')}> Manage Plants</Button>
          <Button onClick={() => navigate('/assets')}> Manage Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/assets?asset_type=generator')}> View Generators</Button>
          <Button variant="secondary" onClick={() => navigate('/assets?asset_type=transformer')}> View Transformers</Button>
          <Button variant="secondary" onClick={() => navigate('/assets?asset_type=motor')}> View Motors</Button>
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
