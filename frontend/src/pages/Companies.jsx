// frontend/src/pages/Companies.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';
import { 
  FaBuilding, FaSearch, FaPlus, FaEdit, FaTrash, FaArrowRight, 
  FaTimes, FaIndustry, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaUsers, FaDatabase, FaChevronRight, FaHome
} from 'react-icons/fa';
import { MdOutlineBusinessCenter } from 'react-icons/md';

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

  const columns = ['#', 'Company', 'Code', 'Contact', 'Actions'];

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
    code: (
      <span style={styles.codeBadge}>{company.code}</span>
    ),
    contact: (
      <div style={styles.contactInfo}>
        {company.email && <span style={styles.contactItem}><FaEnvelope size={12} color="#94a3b8" /> {company.email}</span>}
        {company.phone && <span style={styles.contactItem}><FaPhone size={12} color="#94a3b8" /> {company.phone}</span>}
      </div>
    ),
    actions: (
      <div style={styles.actionButtons}>
        <button 
          style={styles.actionBtn} 
          onClick={() => viewCompanyDetails(company)}
          title="View Details"
        >
          <FaBuilding size={14} />
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
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaBuilding size={24} color="#667eea" />
          </div>
          <div>
            <h1 style={styles.title}>Companies</h1>
            <p style={styles.subtitle}>Manage all companies and organizations in your ecosystem</p>
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
          <div style={styles.statIcon}><FaBuilding color="#667eea" /></div>
          <div>
            <span style={styles.statValue}>{companies.length}</span>
            <span style={styles.statLabel}>Total Companies</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaUsers color="#10b981" /></div>
          <div>
            <span style={styles.statValue}>
              {companies.filter(c => c.email).length}
            </span>
            <span style={styles.statLabel}>With Contact</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaDatabase color="#3b82f6" /></div>
          <div>
            <span style={styles.statValue}>
              {companies.reduce((acc, c) => acc + (c.plants_count || 0), 0)}
            </span>
            <span style={styles.statLabel}>Total Plants</span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={styles.searchContainer}>
        <div style={styles.searchWrapper}>
          <FaSearch size={18} color="#94a3b8" style={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by company name, code, or email..."
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
                <span style={styles.modalIcon}>
                  {editingCompany ? <FaEdit size={20} /> : <FaPlus size={20} />}
                </span>
                <h2 style={styles.modalTitle}>
                  {editingCompany ? 'Edit Company' : 'Add New Company'}
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
                
                <div style={styles.formGroup}>
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
                  <span style={styles.detailLabel}><FaDatabase size={14} color="#94a3b8" /> Plants</span>
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
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    background: '#eef2ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0 0'
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  statIcon: {
    width: '44px',
    height: '44px',
    background: '#f1f5f9',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
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
  codeBadge: {
    padding: '4px 12px',
    background: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#475569',
    fontWeight: '500'
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
    zIndex: 1000,
    animation: 'fadeIn 0.2s'
  },
  modalContent: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '560px',
    maxWidth: '95%',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'slideUp 0.3s'
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
    justifyContent: 'center',
    transition: 'background 0.2s'
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
    fontWeight: '500',
    transition: 'background 0.2s'
  },
  submitBtn: {
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s'
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
    color: '#475569',
    transition: 'all 0.2s'
  }
};

// Add to global CSS or use CSS-in-JS
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
  .stat-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
  .action-btn:hover {
    transform: scale(1.1);
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
`;
document.head.appendChild(styleSheet);

export default Companies;