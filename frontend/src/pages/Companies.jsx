// frontend/src/pages/Companies.jsx
// Refactored - Professional Companies Page with Map Integration

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';
import { 
  FaBuilding, FaSearch, FaPlus, FaEdit, FaTrash, FaArrowRight, 
  FaTimes, FaIndustry, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaUsers, FaDatabase, FaGlobe, FaLocationArrow, FaLink,
  FaChartPie, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaInfoCircle, FaEye
} from 'react-icons/fa';
import { MdOutlineBusinessCenter, MdLocationOn } from 'react-icons/md';

// ============== MAPNA DIGITAL LOGO COMPONENT ==============
const MapnaLogo = ({ size = 32 }) => (
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
    <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="800" fill="url(#mapnaGradient)">
      MAPNA
    </text>
    <text x="90" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="300" fill="#64748b">
      Digital
    </text>
    <rect x="0" y="38" width="180" height="2" rx="1" fill="url(#mapnaGradient)" />
  </svg>
);

// ============== SIMPLE MAP COMPONENT ==============
const CompanyMap = ({ companies }) => {
  const [hoveredCompany, setHoveredCompany] = useState(null);

  // Generate random positions for demo (in real app, use actual coordinates)
  const getCompanyPosition = (index, total) => {
    // Spread companies across a virtual map
    const angle = (index / total) * 2 * Math.PI;
    const radius = 60 + (index % 3) * 20;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius
    };
  };

  return (
    <div style={mapStyles.container}>
      <div style={mapStyles.header}>
        <span style={mapStyles.title}>
          <FaGlobe size={16} style={{ marginRight: '8px' }} />
          Company Locations
        </span>
        <span style={mapStyles.count}>{companies.length} companies</span>
      </div>
      <div style={mapStyles.mapWrapper}>
        <svg viewBox="0 0 400 300" style={mapStyles.svg}>
          {/* Background Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="glow">
              <stop offset="0%" stopColor="#667eea" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#667eea" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          <rect width="400" height="300" fill="url(#grid)" />
          
          {/* Connection Lines */}
          {companies.length > 1 && companies.map((company, idx) => {
            const pos = getCompanyPosition(idx, companies.length);
            return companies.map((_, idx2) => {
              if (idx2 <= idx) return null;
              const pos2 = getCompanyPosition(idx2, companies.length);
              return (
                <line
                  key={`${idx}-${idx2}`}
                  x1={pos.x}
                  y1={pos.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="#667eea20"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              );
            });
          })}

          {/* Company Markers */}
          {companies.map((company, index) => {
            const pos = getCompanyPosition(index, companies.length);
            const isHovered = hoveredCompany === company.id;
            const hasPlants = (company.plants_count || 0) > 0;

            return (
              <g key={company.id}>
                {/* Glow Effect */}
                {isHovered && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="25"
                    fill="url(#glow)"
                  />
                )}
                
                {/* Connection Dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="6"
                  fill={hasPlants ? '#667eea' : '#94a3b8'}
                  stroke="white"
                  strokeWidth="2"
                  style={mapStyles.marker}
                  onMouseEnter={() => setHoveredCompany(company.id)}
                  onMouseLeave={() => setHoveredCompany(null)}
                />
                
                {/* Inner Dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="2"
                  fill="white"
                  opacity={hasPlants ? 0.8 : 0.4}
                />

                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y - 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isHovered ? '#667eea' : '#64748b'}
                  fontWeight={isHovered ? '600' : '400'}
                  style={mapStyles.label}
                >
                  {company.name.length > 10 ? company.name.substring(0, 8) + '…' : company.name}
                </text>

                {/* Tooltip */}
                {isHovered && (
                  <g transform={`translate(${pos.x + 15}, ${pos.y - 20})`}>
                    <rect
                      x="0"
                      y="0"
                      width="140"
                      height="50"
                      rx="6"
                      fill="white"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      filter="url(#shadow)"
                    />
                    <text x="10" y="18" fontSize="11" fontWeight="600" fill="#0f172a">
                      {company.name}
                    </text>
                    <text x="10" y="34" fontSize="10" fill="#64748b">
                      {company.plants_count || 0} Plants • {company.assets_count || 0} Assets
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={mapStyles.legend}>
        <span style={mapStyles.legendItem}>
          <span style={{ ...mapStyles.legendDot, backgroundColor: '#667eea' }} />
          Active
        </span>
        <span style={mapStyles.legendItem}>
          <span style={{ ...mapStyles.legendDot, backgroundColor: '#94a3b8' }} />
          No Plants
        </span>
        <span style={mapStyles.legendItem}>
          <FaLink size={12} color="#667eea" style={{ marginRight: '4px' }} />
          Connections
        </span>
      </div>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    address: '', 
    phone: '', 
    email: '' 
  });
  const [editingCompany, setEditingCompany] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await API.get('/companies');
      let companiesData = res.data.items || [];
      
      if (searchTerm) {
        companiesData = companiesData.filter(company => 
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (company.email && company.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [searchTerm]);

  const stats = useMemo(() => ({
    total: companies.length,
    withContact: companies.filter(c => c.email || c.phone).length,
    totalPlants: companies.reduce((acc, c) => acc + (c.plants_count || 0), 0),
    active: companies.filter(c => (c.plants_count || 0) > 0).length
  }), [companies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await API.put(`/companies/${editingCompany.id}`, {
          name: formData.name,
          code: formData.code,
          address: formData.address,
          phone: formData.phone,
          email: formData.email
        });
        toast.success('Company updated successfully!');
      } else {
        await API.post('/companies', {
          name: formData.name,
          code: formData.code,
          address: formData.address,
          phone: formData.phone,
          email: formData.email
        });
        toast.success('Company created successfully!');
      }
      setShowForm(false);
      setEditingCompany(null);
      setFormData({ name: '', code: '', address: '', phone: '', email: '' });
      loadCompanies();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      code: company.code,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company? This will also delete all its plants and assets!')) {
      try {
        await API.delete(`/companies/${id}`);
        toast.success('Company deleted successfully!');
        loadCompanies();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Delete failed');
      }
    }
  };

  const handleEnter = (companyId) => {
    navigate(`/plants?company_id=${companyId}`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const viewCompanyDetails = (company) => {
    setSelectedCompany(company);
    setShowDetailModal(true);
  };

  const columns = ['#', 'Company', 'Contact', 'Plants', 'Status', 'Actions'];

  const tableData = companies.map((company, index) => ({
    id: company.id,
    '#': (
      <span style={styles.rowNumber}>{index + 1}</span>
    ),
    company: (
      <div style={styles.companyCell}>
        <div style={styles.companyAvatar}>
          <FaBuilding size={18} color="#667eea" />
        </div>
        <div style={styles.companyInfo}>
          <span style={styles.companyName}>{company.name}</span>
          <span style={styles.companyCode}>{company.code}</span>
        </div>
      </div>
    ),
    contact: (
      <div style={styles.contactInfo}>
        {company.email && <span style={styles.contactItem}><FaEnvelope size={12} color="#94a3b8" /> {company.email}</span>}
        {company.phone && <span style={styles.contactItem}><FaPhone size={12} color="#94a3b8" /> {company.phone}</span>}
        {!company.email && !company.phone && <span style={styles.noContact}>No contact</span>}
      </div>
    ),
    plants: (
      <div style={styles.plantsInfo}>
        <span style={styles.plantsCount}>{company.plants_count || 0}</span>
        <span style={styles.plantsLabel}>plants</span>
      </div>
    ),
    status: (
      <span style={{
        ...styles.statusBadge,
        backgroundColor: (company.plants_count || 0) > 0 ? '#ecfdf5' : '#f1f5f9',
        color: (company.plants_count || 0) > 0 ? '#10b981' : '#94a3b8'
      }}>
        {(company.plants_count || 0) > 0 ? 'Active' : 'Inactive'}
      </span>
    ),
    actions: (
      <div style={styles.actionButtons}>
        <button 
          style={styles.actionBtn} 
          onClick={() => viewCompanyDetails(company)}
          title="View Details"
        >
          <FaEye size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnEdit }} 
          onClick={() => handleEdit(company)}
          title="Edit"
        >
          <FaEdit size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnDelete }} 
          onClick={() => handleDelete(company.id)}
          title="Delete"
        >
          <FaTrash size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnEnter }} 
          onClick={() => handleEnter(company.id)}
          title="View Plants"
        >
          <FaArrowRight size={14} />
        </button>
      </div>
    )
  }));

  return (
    <div style={styles.container}>
      {/* Header with Mapna Digital Logo */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoWrapper}>
            <MapnaLogo size={36} />
          </div>
          <div style={styles.headerDivider}></div>
          <div>
            <h1 style={styles.title}>Companies</h1>
            <p style={styles.subtitle}>Manage organizations in your ecosystem</p>
          </div>
        </div>
        <button 
          style={styles.addBtn}
          onClick={() => { 
            setEditingCompany(null); 
            setFormData({ name: '', code: '', address: '', phone: '', email: '' }); 
            setShowForm(true); 
          }}
        >
          <FaPlus size={16} /> Add Company
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#eef2ff' }}>
            <FaBuilding color="#667eea" size={20} />
          </div>
          <div>
            <span style={styles.statValue}>{stats.total}</span>
            <span style={styles.statLabel}>Total Companies</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#ecfdf5' }}>
            <FaUsers color="#10b981" size={20} />
          </div>
          <div>
            <span style={styles.statValue}>{stats.withContact}</span>
            <span style={styles.statLabel}>With Contact Info</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#eff6ff' }}>
            <FaIndustry color="#3b82f6" size={20} />
          </div>
          <div>
            <span style={styles.statValue}>{stats.totalPlants}</span>
            <span style={styles.statLabel}>Total Plants</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#fef3c7' }}>
            <FaCheckCircle color="#f59e0b" size={20} />
          </div>
          <div>
            <span style={styles.statValue}>{stats.active}</span>
            <span style={styles.statLabel}>Active Companies</span>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div style={styles.mapSection}>
        <CompanyMap companies={companies} />
      </div>

      {/* Search & View Toggle */}
      <div style={styles.searchContainer}>
        <div style={styles.searchWrapper}>
          <FaSearch size={18} color="#94a3b8" style={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search companies by name, code, or email..."
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearSearchBtn} onClick={clearSearch}>
              <FaTimes size={16} color="#94a3b8" />
            </button>
          )}
        </div>
        <div style={styles.resultsCount}>
          {searchTerm ? (
            <span>Found <strong>{companies.length}</strong> matching companies</span>
          ) : (
            <span><strong>{companies.length}</strong> companies total</span>
          )}
        </div>
      </div>

      {/* Companies Table */}
      <div style={styles.tableContainer}>
        <Table columns={columns} data={tableData} loading={loading} />
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={styles.modalIcon}>
                  {editingCompany ? <FaEdit size={20} /> : <FaPlus size={20} />}
                </div>
                <h2 style={styles.modalTitle}>
                  {editingCompany ? 'Edit Company ' : 'Add New Company'}
                </h2>
              </div>
              <button style={styles.modalClose} onClick={() => setShowForm(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Company Name <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={styles.formInput}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Company Code <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    style={styles.formInput}
                    placeholder="Enter unique code"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaMapMarkerAlt size={14} style={styles.labelIcon} /> Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={styles.formInput}
                    placeholder="Company address"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaPhone size={14} style={styles.labelIcon} /> Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={styles.formInput}
                    placeholder="Contact phone"
                  />
                </div>
                
                <div style={styles.formGroup} className="full-width">
                  <label style={styles.formLabel}>
                    <FaEnvelope size={14} style={styles.labelIcon} /> Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.formInput}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {editingCompany ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {showDetailModal && selectedCompany && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={styles.detailAvatar}>
                  <FaBuilding size={28} color="#667eea" />
                </div>
                <div>
                  <h2 style={styles.modalTitle}>{selectedCompany.name}</h2>
                  <span style={styles.detailCode}>{selectedCompany.code}</span>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setShowDetailModal(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            
            <div style={styles.detailContent}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaMapMarkerAlt size={14} color="#94a3b8" /> Address</span>
                  <span style={styles.detailValue}>{selectedCompany.address || 'Not provided'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaPhone size={14} color="#94a3b8" /> Phone</span>
                  <span style={styles.detailValue}>{selectedCompany.phone || 'Not provided'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaEnvelope size={14} color="#94a3b8" /> Email</span>
                  <span style={styles.detailValue}>{selectedCompany.email || 'Not provided'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaIndustry size={14} color="#94a3b8" /> Plants</span>
                  <span style={styles.detailValue}>{selectedCompany.plants_count || 0}</span>
                </div>
              </div>
              
              <div style={styles.detailActions}>
                <button style={styles.detailActionBtn} onClick={() => handleEnter(selectedCompany.id)}>
                  <FaIndustry size={16} /> View Plants
                </button>
                <button style={styles.detailActionBtn} onClick={() => { 
                  setShowDetailModal(false); 
                  handleEdit(selectedCompany); 
                }}>
                  <FaEdit size={16} /> Edit Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== MAP STYLES ==============
const mapStyles = {
  container: {
    background: 'white',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center'
  },
  count: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  mapWrapper: {
    width: '100%',
    background: '#fafbfc',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  svg: {
    width: '100%',
    height: 'auto',
    maxHeight: '300px'
  },
  marker: {
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  label: {
    fontSize: '9px',
    fontFamily: 'Arial, sans-serif',
    transition: 'all 0.2s',
    pointerEvents: 'none'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#64748b',
    gap: '6px'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block'
  }
};

// ============== MAIN STYLES ==============
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    background: '#f8fafc',
    minHeight: '100vh'
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center'
  },
  headerDivider: {
    width: '1px',
    height: '36px',
    backgroundColor: '#e2e8f0'
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '2px 0 0 0'
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'all 0.3s'
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    display: 'block'
  },
  statLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    display: 'block'
  },
  mapSection: {
    marginBottom: '24px'
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  searchWrapper: {
    flex: 1,
    minWidth: '250px',
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    borderRadius: '10px',
    padding: '0 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  searchIcon: {
    marginRight: '12px'
  },
  searchInput: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    background: 'transparent'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px'
  },
  resultsCount: {
    fontSize: '14px',
    color: '#64748b',
    whiteSpace: 'nowrap'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  },
  rowNumber: {
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: '13px'
  },
  companyCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  companyAvatar: {
    width: '40px',
    height: '40px',
    background: '#eef2ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  companyInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  companyName: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '14px'
  },
  companyCode: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  contactItem: {
    fontSize: '12px',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  noContact: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  plantsInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  plantsCount: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '14px'
  },
  plantsLabel: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  actionButtons: {
    display: 'flex',
    gap: '6px'
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: 'none',
    background: '#f1f5f9',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  actionBtnEdit: {
    background: '#fffbeb',
    color: '#f59e0b'
  },
  actionBtnDelete: {
    background: '#fef2f2',
    color: '#ef4444'
  },
  actionBtnEnter: {
    background: '#eef2ff',
    color: '#667eea'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '560px',
    maxWidth: '95%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  modalIcon: {
    width: '40px',
    height: '40px',
    background: '#eef2ff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#667eea'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  modalClose: {
    width: '36px',
    height: '36px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  labelIcon: {
    color: '#94a3b8'
  },
  required: {
    color: '#ef4444'
  },
  formInput: {
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9'
  },
  cancelBtn: {
    padding: '10px 24px',
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  submitBtn: {
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  detailAvatar: {
    width: '48px',
    height: '48px',
    background: '#eef2ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  detailCode: {
    padding: '2px 10px',
    background: '#f1f5f9',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#64748b'
  },
  detailContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 16px',
    background: '#f8fafc',
    borderRadius: '8px'
  },
  detailLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  detailValue: {
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '500'
  },
  detailActions: {
    display: 'flex',
    gap: '12px'
  },
  detailActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569'
  }
};

// Add to global CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .full-width {
    grid-column: 1 / -1 !important;
  }
  .stat-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .action-btn:hover {
    transform: scale(1.1);
  }
  .action-btn-enter:hover {
    background: #dbeafe;
    color: #4f46e5;
  }
  .action-btn-edit:hover {
    background: #fef3c7;
    color: #d97706;
  }
  .action-btn-delete:hover {
    background: #fecaca;
    color: #dc2626;
  }
  .form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
    outline: none;
  }
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102,126,234,0.4);
  }
  .cancel-btn:hover {
    background: #e2e8f0;
  }
  .modal-close:hover {
    background: #f1f5f9;
  }
  .detail-action-btn:hover {
    background: #e2e8f0;
  }
  .add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102,126,234,0.4);
  }
`;
document.head.appendChild(styleSheet);

export default Companies;