// frontend/src/pages/Plants.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';
import { 
  FaIndustry, FaSearch, FaPlus, FaEdit, FaTrash, FaArrowRight, 
  FaTimes, FaBuilding, FaMapMarkerAlt, FaWarehouse, FaDatabase,
  FaChevronRight, FaFilter, FaHome, FaCity
} from 'react-icons/fa';
import { MdOutlineFactory } from 'react-icons/md';

function Plants() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const companyIdFromUrl = queryParams.get('company_id');
  
  const [plants, setPlants] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyIdFromUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', company_id: '' });
  const [editingPlant, setEditingPlant] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [companyNames, setCompanyNames] = useState({});

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadPlants();
  }, [selectedCompanyId, searchTerm]);

  const loadCompanies = async () => {
    try {
      const res = await API.get('/companies');
      const companiesData = res.data.items || [];
      setCompanies(companiesData);
      // Create lookup map
      const nameMap = {};
      companiesData.forEach(c => { nameMap[c.id] = c.name; });
      setCompanyNames(nameMap);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const loadPlants = async () => {
    setLoading(true);
    try {
      let url = '/sites';
      if (selectedCompanyId) {
        url = `/sites?company_id=${selectedCompanyId}`;
      }
      const res = await API.get(url);
      let plantsData = res.data.items || [];
      
      if (searchTerm) {
        plantsData = plantsData.filter(plant => 
          plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (companyNames[plant.company_id] && companyNames[plant.company_id].toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setPlants(plantsData);
    } catch (error) {
      console.error('Error loading plants:', error);
      toast.error('Failed to load plants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlant) {
        await API.put(`/sites/${editingPlant.id}`, {
          name: formData.name,
          code: formData.code
        });
        toast.success('Plant updated successfully!');
      } else {
        await API.post('/sites', {
          company_id: parseInt(formData.company_id),
          name: formData.name,
          code: formData.code
        });
        toast.success('Plant created successfully!');
      }
      setShowForm(false);
      setEditingPlant(null);
      setFormData({ name: '', code: '', company_id: '' });
      loadPlants();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (plant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name,
      code: plant.code,
      company_id: plant.company_id
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plant? This will also delete all its assets!')) {
      try {
        await API.delete(`/sites/${id}`);
        toast.success('Plant deleted successfully!');
        loadPlants();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Delete failed');
      }
    }
  };

  const handleEnter = (plantId) => {
    navigate(`/assets?plant_id=${plantId}`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const viewPlantDetails = (plant) => {
    setSelectedPlant(plant);
    setShowDetailModal(true);
  };

  const getCompanyName = (companyId) => {
    return companyNames[companyId] || '-';
  };

  const getCompanyColor = (companyId) => {
    const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6'];
    const index = companyId ? companyId % colors.length : 0;
    return colors[index];
  };

  const columns = ['#', 'Plant', 'Code', 'Company', 'Actions'];

  const tableData = plants.map((plant, index) => ({
    id: plant.id,
    '#': (
      <span style={styles.rowNumber}>{index + 1}</span>
    ),
    plant: (
      <div style={styles.plantCell}>
        <div style={{ ...styles.plantAvatar, background: `${getCompanyColor(plant.company_id)}20` }}>
          <FaIndustry size={18} color={getCompanyColor(plant.company_id)} />
        </div>
        <div style={styles.plantInfo}>
          <span style={styles.plantName}>{plant.name}</span>
          <span style={styles.plantCode}>{plant.code}</span>
        </div>
      </div>
    ),
    code: (
      <span style={styles.codeBadge}>{plant.code}</span>
    ),
    company: (
      <span style={styles.companyBadge}>
        <FaBuilding size={12} color={getCompanyColor(plant.company_id)} style={styles.companyIcon} />
        {getCompanyName(plant.company_id)}
      </span>
    ),
    actions: (
      <div style={styles.actionButtons}>
        <button 
          style={styles.actionBtn} 
          onClick={() => viewPlantDetails(plant)}
          title="View Details"
        >
          <FaIndustry size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnEdit }} 
          onClick={() => handleEdit(plant)}
          title="Edit"
        >
          <FaEdit size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnDelete }} 
          onClick={() => handleDelete(plant.id)}
          title="Delete"
        >
          <FaTrash size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnEnter }} 
          onClick={() => handleEnter(plant.id)}
          title="View Assets"
        >
          <FaArrowRight size={14} />
        </button>
      </div>
    )
  }));

  const selectedCompanyName = selectedCompanyId ? companyNames[parseInt(selectedCompanyId)] : null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaIndustry size={24} color="#10b981" />
          </div>
          <div>
            <h1 style={styles.title}>Plants / Sites</h1>
            <p style={styles.subtitle}>Manage all plant locations across your organization</p>
          </div>
        </div>
        <button 
          style={styles.addBtn}
          onClick={() => { 
            setEditingPlant(null); 
            setFormData({ name: '', code: '', company_id: selectedCompanyId || '' }); 
            setShowForm(true); 
          }}
        >
          <FaPlus size={16} /> Add Plant
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaIndustry color="#10b981" /></div>
          <div>
            <span style={styles.statValue}>{plants.length}</span>
            <span style={styles.statLabel}>Total Plants</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaBuilding color="#667eea" /></div>
          <div>
            <span style={styles.statValue}>{companies.length}</span>
            <span style={styles.statLabel}>Companies</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaDatabase color="#3b82f6" /></div>
          <div>
            <span style={styles.statValue}>
              {companies.reduce((acc, c) => acc + (c.plants_count || 0), 0)}
            </span>
            <span style={styles.statLabel}>Avg Plants/Company</span>
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
            placeholder="Search plants by name, code, or company..."
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.clearSearchBtn} onClick={clearSearch}>
              <FaTimes size={16} color="#94a3b8" />
            </button>
          )}
        </div>
        
        <div style={styles.filterWrapper}>
          <FaFilter size={16} color="#94a3b8" style={styles.filterIcon} />
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {(selectedCompanyId || searchTerm) && (
            <button style={styles.clearFiltersBtn} onClick={() => {
              setSelectedCompanyId('');
              setSearchTerm('');
            }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges */}
      {selectedCompanyId && (
        <div style={styles.filterBadges}>
          <span style={styles.filterBadge}>
            <FaBuilding size={12} color="#667eea" />
            {selectedCompanyName || 'Unknown Company'}
            <button style={styles.filterBadgeRemove} onClick={() => setSelectedCompanyId('')}>
              <FaTimes size={12} />
            </button>
          </span>
          {searchTerm && (
            <span style={styles.filterBadge}>
              <FaSearch size={12} color="#667eea" />
              "{searchTerm}"
              <button style={styles.filterBadgeRemove} onClick={clearSearch}>
                <FaTimes size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Plants Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <span style={styles.tableTitle}>
            <FaWarehouse size={16} color="#64748b" style={{ marginRight: '8px' }} />
            Plants List <span style={styles.tableCount}>({plants.length})</span>
          </span>
        </div>
        <Table columns={columns} data={tableData} loading={loading} />
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <span style={styles.modalIcon}>
                  {editingPlant ? <FaEdit size={20} /> : <FaPlus size={20} />}
                </span>
                <h2 style={styles.modalTitle}>
                  {editingPlant ? 'Edit Plant' : 'Add New Plant'}
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
                    <FaBuilding size={14} style={styles.labelIcon} /> Company <span style={styles.required}>*</span>
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    required
                    disabled={editingPlant}
                    style={styles.formSelect}
                  >
                    <option value="">Select Company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaIndustry size={14} style={styles.labelIcon} /> Plant Name <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={styles.formInput}
                    placeholder="Enter plant name"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaMapMarkerAlt size={14} style={styles.labelIcon} /> Plant Code <span style={styles.required}>*</span>
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
              </div>
              
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {editingPlant ? 'Update Plant' : 'Create Plant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plant Detail Modal */}
      {showDetailModal && selectedPlant && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={{ ...styles.detailAvatar, background: `${getCompanyColor(selectedPlant.company_id)}20` }}>
                  <FaIndustry size={28} color={getCompanyColor(selectedPlant.company_id)} />
                </div>
                <div>
                  <h2 style={styles.modalTitle}>{selectedPlant.name}</h2>
                  <span style={styles.detailCode}>{selectedPlant.code}</span>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setShowDetailModal(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            
            <div style={styles.detailContent}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaBuilding size={14} color="#94a3b8" /> Company</span>
                  <span style={styles.detailValue}>{getCompanyName(selectedPlant.company_id)}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaMapMarkerAlt size={14} color="#94a3b8" /> Code</span>
                  <span style={styles.detailValue}>{selectedPlant.code}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaWarehouse size={14} color="#94a3b8" /> ID</span>
                  <span style={styles.detailValue}>#{selectedPlant.id}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaDatabase size={14} color="#94a3b8" /> Assets</span>
                  <span style={styles.detailValue}>{selectedPlant.assets_count || 0}</span>
                </div>
              </div>
              
              <div style={styles.detailActions}>
                <button style={styles.detailActionBtn} onClick={() => handleEnter(selectedPlant.id)}>
                  <FaArrowRight size={16} /> View Assets
                </button>
                <button style={styles.detailActionBtn} onClick={() => { 
                  setShowDetailModal(false); 
                  handleEdit(selectedPlant); 
                }}>
                  <FaEdit size={16} /> Edit Plant
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
    background: '#ecfdf5',
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
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  searchWrapper: {
    flex: 2,
    minWidth: '250px',
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    borderRadius: '10px',
    padding: '0 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  searchIcon: {
    marginRight: '12px',
    color: '#94a3b8'
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
  filterWrapper: {
    flex: 1,
    minWidth: '200px',
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    borderRadius: '10px',
    padding: '0 8px 0 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    gap: '8px'
  },
  filterIcon: {
    color: '#94a3b8'
  },
  filterSelect: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    background: 'transparent',
    cursor: 'pointer'
  },
  clearFiltersBtn: {
    padding: '6px 12px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#64748b'
  },
  filterBadges: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  filterBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px 4px 12px',
    background: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#475569'
  },
  filterBadgeRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tableTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center'
  },
  tableCount: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#94a3b8',
    marginLeft: '4px'
  },
  rowNumber: {
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: '13px'
  },
  plantCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  plantAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  plantInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  plantName: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '14px'
  },
  plantCode: {
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
  companyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: '#eef2ff',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#4f46e5',
    fontWeight: '500'
  },
  companyIcon: {
    marginRight: '4px'
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
    background: '#ecfdf5',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#10b981'
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
  formSelect: {
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    background: 'white',
    cursor: 'pointer'
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
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
  .add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16,185,129,0.4);
  }
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16,185,129,0.4);
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
  .filter-select:focus {
    border-color: #10b981;
    outline: none;
  }
  .form-input:focus, .form-select:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
    outline: none;
  }
  .clear-filters-btn:hover {
    background: #e2e8f0;
  }
  .filter-badge-remove:hover {
    color: #475569;
  }
  .stat-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
`;
document.head.appendChild(styleSheet);

export default Plants;