// frontend/src/pages/Assets.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaArrowRight, 
  FaTimes, FaBolt, FaPlug, FaCogs, FaMicrochip,
  FaIndustry, FaBuilding, FaDatabase, FaFilter,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
  FaServer, FaWrench, FaInfoCircle
} from 'react-icons/fa';
import { MdOutlineElectricalServices, MdTransform, MdSettings } from 'react-icons/md';

function Assets() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const plantIdFromUrl = queryParams.get('plant_id');
  const assetTypeFromUrl = queryParams.get('asset_type');
  
  const [assets, setAssets] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(plantIdFromUrl || '');
  const [selectedAssetType, setSelectedAssetType] = useState(assetTypeFromUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    plant_id: '',
    asset_type: 'generator',
    asset_name: '',
    asset_code: '',
    manufacturer: '',
    model: ''
  });
  const [editingAsset, setEditingAsset] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [selectedPlantId, selectedAssetType, searchTerm]);

  const loadPlants = async () => {
    try {
      const res = await API.get('/sites');
      setPlants(res.data.items || []);
    } catch (error) {
      console.error('Error loading plants:', error);
      toast.error('Failed to load plants');
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      let url = '/assets/';
      const params = new URLSearchParams();
      
      if (selectedPlantId) {
        params.append('plant_id', selectedPlantId);
      }
      if (selectedAssetType) {
        params.append('asset_type', selectedAssetType);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await API.get(url);
      let assetsData = res.data.items || [];
      
      if (searchTerm) {
        assetsData = assetsData.filter(asset => 
          asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (asset.manufacturer && asset.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setAssets(assetsData);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await API.put(`/assets/${editingAsset.id}`, {
          asset_name: formData.asset_name,
          asset_code: formData.asset_code,
          manufacturer: formData.manufacturer,
          model: formData.model
        });
        toast.success('Asset updated successfully!');
      } else {
        await API.post('/assets/', {
          plant_id: parseInt(formData.plant_id),
          asset_type: formData.asset_type,
          asset_name: formData.asset_name,
          asset_code: formData.asset_code,
          manufacturer: formData.manufacturer,
          model: formData.model
        });
        toast.success('Asset created successfully!');
      }
      setShowForm(false);
      setEditingAsset(null);
      setFormData({
        plant_id: '',
        asset_type: 'generator',
        asset_name: '',
        asset_code: '',
        manufacturer: '',
        model: ''
      });
      loadAssets();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      plant_id: asset.plant_id,
      asset_type: asset.asset_type,
      asset_name: asset.asset_name,
      asset_code: asset.asset_code,
      manufacturer: asset.manufacturer || '',
      model: asset.model || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await API.delete(`/assets/${id}`);
        toast.success('Asset deleted successfully!');
        loadAssets();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Delete failed');
      }
    }
  };

  const handleEnter = (assetId) => {
    navigate(`/assets/${assetId}`);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleClearFilters = () => {
    setSelectedPlantId('');
    setSelectedAssetType('');
    setSearchTerm('');
    navigate('/assets', { replace: true });
  };

  const viewAssetDetails = (asset) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
  };

  const getPlantName = (plantId) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.name : '-';
  };

  const getAssetIcon = (type) => {
    switch(type) {
      case 'generator': return <FaBolt size={18} color="#f59e0b" />;
      case 'transformer': return <MdTransform size={18} color="#8b5cf6" />;
      case 'motor': return <FaCogs size={18} color="#06b6d4" />;
      default: return <FaMicrochip size={18} color="#6b7280" />;
    }
  };

  const getAssetTypeLabel = (type) => {
    switch(type) {
      case 'generator': return 'Generator';
      case 'transformer': return 'Transformer';
      case 'motor': return 'Motor';
      default: return type || 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active':
      case 'operational':
        return '#10b981';
      case 'maintenance':
      case 'warning':
        return '#f59e0b';
      case 'inactive':
      case 'offline':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case 'active':
      case 'operational':
        return 'Active';
      case 'maintenance':
        case 'warning':
        return 'Maintenance';
      case 'inactive':
      case 'offline':
        return 'Inactive';
      default:
        return status || 'Unknown';
    }
  };

  const columns = ['#', 'Asset', 'Code', 'Type', 'Plant', 'Manufacturer', 'Status', 'Actions'];

  const tableData = assets.map((asset, index) => ({
    id: asset.id,
    '#': (
      <span style={styles.rowNumber}>{index + 1}</span>
    ),
    asset: (
      <div style={styles.assetCell}>
        <div style={{ ...styles.assetAvatar, background: `${getStatusColor(asset.operational_status)}20` }}>
          {getAssetIcon(asset.asset_type)}
        </div>
        <div style={styles.assetInfo}>
          <span style={styles.assetName}>{asset.asset_name}</span>
          <span style={styles.assetCode}>{asset.asset_code}</span>
        </div>
      </div>
    ),
    code: (
      <span style={styles.codeBadge}>{asset.asset_code}</span>
    ),
    type: (
      <span style={styles.typeBadge}>
        {getAssetIcon(asset.asset_type)}
        <span style={{ marginLeft: '6px' }}>{getAssetTypeLabel(asset.asset_type)}</span>
      </span>
    ),
    plant: (
      <span style={styles.plantBadge}>
        <FaBuilding size={12} color="#64748b" style={{ marginRight: '4px' }} />
        {getPlantName(asset.plant_id)}
      </span>
    ),
    manufacturer: asset.manufacturer || '-',
    status: (
      <span style={{
        ...styles.statusBadge,
        backgroundColor: `${getStatusColor(asset.operational_status)}20`,
        color: getStatusColor(asset.operational_status)
      }}>
        {getStatusLabel(asset.operational_status)}
      </span>
    ),
    actions: (
      <div style={styles.actionButtons}>
        <button 
          style={styles.actionBtn} 
          onClick={() => viewAssetDetails(asset)}
          title="View Details"
        >
          <FaInfoCircle size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnEdit }} 
          onClick={() => handleEdit(asset)}
          title="Edit"
        >
          <FaEdit size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnDelete }} 
          onClick={() => handleDelete(asset.id)}
          title="Delete"
        >
          <FaTrash size={14} />
        </button>
        <button 
          style={{ ...styles.actionBtn, ...styles.actionBtnEnter }} 
          onClick={() => handleEnter(asset.id)}
          title="Enter Asset"
        >
          <FaArrowRight size={14} />
        </button>
      </div>
    )
  }));

  const getTitle = () => {
    if (selectedAssetType === 'generator') return 'Generators';
    if (selectedAssetType === 'transformer') return 'Transformers';
    if (selectedAssetType === 'motor') return 'Motors';
    return 'All Assets';
  };

  const getTitleIcon = () => {
    if (selectedAssetType === 'generator') return <FaBolt size={24} color="#f59e0b" />;
    if (selectedAssetType === 'transformer') return <MdTransform size={24} color="#8b5cf6" />;
    if (selectedAssetType === 'motor') return <FaCogs size={24} color="#06b6d4" />;
    return <FaServer size={24} color="#3b82f6" />;
  };

  const getHeaderIconBg = () => {
    if (selectedAssetType === 'generator') return '#fffbeb';
    if (selectedAssetType === 'transformer') return '#f5f3ff';
    if (selectedAssetType === 'motor') return '#ecfeff';
    return '#eff6ff';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{ ...styles.headerIcon, background: getHeaderIconBg() }}>
            {getTitleIcon()}
          </div>
          <div>
            <h1 style={styles.title}>{getTitle()}</h1>
            <p style={styles.subtitle}>Manage all {getTitle().toLowerCase()} in your organization</p>
          </div>
        </div>
        <button 
          style={styles.addBtn}
          onClick={() => { 
            setEditingAsset(null); 
            setFormData({ 
              plant_id: selectedPlantId || '', 
              asset_type: selectedAssetType || 'generator', 
              asset_name: '', 
              asset_code: '', 
              manufacturer: '', 
              model: '' 
            }); 
            setShowForm(true); 
          }}
        >
          <FaPlus size={16} /> Add {getTitle().slice(0, -1)}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaServer color="#3b82f6" /></div>
          <div>
            <span style={styles.statValue}>{assets.length}</span>
            <span style={styles.statLabel}>Total {getTitle()}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaCheckCircle color="#10b981" /></div>
          <div>
            <span style={styles.statValue}>
              {assets.filter(a => a.operational_status?.toLowerCase() === 'active' || a.operational_status?.toLowerCase() === 'operational').length}
            </span>
            <span style={styles.statLabel}>Active</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaExclamationTriangle color="#f59e0b" /></div>
          <div>
            <span style={styles.statValue}>
              {assets.filter(a => a.operational_status?.toLowerCase() === 'maintenance' || a.operational_status?.toLowerCase() === 'warning').length}
            </span>
            <span style={styles.statLabel}>Maintenance</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaBuilding color="#667eea" /></div>
          <div>
            <span style={styles.statValue}>
              {new Set(assets.map(a => a.plant_id)).size}
            </span>
            <span style={styles.statLabel}>Plants</span>
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
            placeholder="Search by name, code, or manufacturer..."
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
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Types</option>
            <option value="generator">⚡ Generators</option>
            <option value="transformer">🔌 Transformers</option>
            <option value="motor">⚙️ Motors</option>
          </select>
        </div>
        
        <div style={styles.filterWrapper}>
          <FaIndustry size={16} color="#94a3b8" style={styles.filterIcon} />
          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Plants</option>
            {plants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        
        {(selectedPlantId || selectedAssetType || searchTerm) && (
          <button style={styles.clearFiltersBtn} onClick={handleClearFilters}>
            <FaTimes size={14} /> Clear
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {(selectedPlantId || selectedAssetType || searchTerm) && (
        <div style={styles.filterBadges}>
          {selectedAssetType && (
            <span style={styles.filterBadge}>
              {getAssetIcon(selectedAssetType)}
              {getAssetTypeLabel(selectedAssetType)}
              <button style={styles.filterBadgeRemove} onClick={() => setSelectedAssetType('')}>
                <FaTimes size={12} />
              </button>
            </span>
          )}
          {selectedPlantId && (
            <span style={styles.filterBadge}>
              <FaBuilding size={12} color="#64748b" />
              {getPlantName(parseInt(selectedPlantId))}
              <button style={styles.filterBadgeRemove} onClick={() => setSelectedPlantId('')}>
                <FaTimes size={12} />
              </button>
            </span>
          )}
          {searchTerm && (
            <span style={styles.filterBadge}>
              <FaSearch size={12} color="#64748b" />
              "{searchTerm}"
              <button style={styles.filterBadgeRemove} onClick={clearSearch}>
                <FaTimes size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Assets Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <span style={styles.tableTitle}>
            <FaDatabase size={16} color="#64748b" style={{ marginRight: '8px' }} />
            {getTitle()} <span style={styles.tableCount}>({assets.length})</span>
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
                  {editingAsset ? <FaEdit size={20} /> : <FaPlus size={20} />}
                </span>
                <h2 style={styles.modalTitle}>
                  {editingAsset ? `Edit ${getTitle().slice(0, -1)}` : `Add New ${getTitle().slice(0, -1)}`}
                </h2>
              </div>
              <button style={styles.modalClose} onClick={() => setShowForm(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formGrid}>
                {!editingAsset && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        <FaIndustry size={14} style={styles.labelIcon} /> Plant <span style={styles.required}>*</span>
                      </label>
                      <select
                        value={formData.plant_id}
                        onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                        required
                        style={styles.formSelect}
                      >
                        <option value="">Select Plant</option>
                        {plants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>
                        <FaMicrochip size={14} style={styles.labelIcon} /> Asset Type <span style={styles.required}>*</span>
                      </label>
                      <select
                        value={formData.asset_type}
                        onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                        required
                        disabled={editingAsset}
                        style={styles.formSelect}
                      >
                        <option value="generator">⚡ Generator</option>
                        <option value="transformer">🔌 Transformer</option>
                        <option value="motor">⚙️ Motor</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Asset Name <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.asset_name}
                    onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                    required
                    style={styles.formInput}
                    placeholder="Enter asset name"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    Asset Code <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.asset_code}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                    required
                    style={styles.formInput}
                    placeholder="Enter unique code"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaWrench size={14} style={styles.labelIcon} /> Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    style={styles.formInput}
                    placeholder="Manufacturer name"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaMicrochip size={14} style={styles.labelIcon} /> Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    style={styles.formInput}
                    placeholder="Model number"
                  />
                </div>
              </div>
              
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {editingAsset ? 'Update Asset' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {showDetailModal && selectedAsset && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={{ ...styles.detailAvatar, background: `${getStatusColor(selectedAsset.operational_status)}20` }}>
                  {getAssetIcon(selectedAsset.asset_type)}
                </div>
                <div>
                  <h2 style={styles.modalTitle}>{selectedAsset.asset_name}</h2>
                  <span style={styles.detailCode}>{selectedAsset.asset_code}</span>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setShowDetailModal(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            
            <div style={styles.detailContent}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaBuilding size={14} color="#94a3b8" /> Plant</span>
                  <span style={styles.detailValue}>{getPlantName(selectedAsset.plant_id)}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaMicrochip size={14} color="#94a3b8" /> Type</span>
                  <span style={styles.detailValue}>{getAssetTypeLabel(selectedAsset.asset_type)}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaWrench size={14} color="#94a3b8" /> Manufacturer</span>
                  <span style={styles.detailValue}>{selectedAsset.manufacturer || 'Not provided'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaMicrochip size={14} color="#94a3b8" /> Model</span>
                  <span style={styles.detailValue}>{selectedAsset.model || 'Not provided'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaInfoCircle size={14} color="#94a3b8" /> Status</span>
                  <span style={{
                    ...styles.detailStatus,
                    backgroundColor: `${getStatusColor(selectedAsset.operational_status)}20`,
                    color: getStatusColor(selectedAsset.operational_status)
                  }}>
                    {getStatusLabel(selectedAsset.operational_status)}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaDatabase size={14} color="#94a3b8" /> ID</span>
                  <span style={styles.detailValue}>#{selectedAsset.id}</span>
                </div>
              </div>
              
              <div style={styles.detailActions}>
                <button style={styles.detailActionBtn} onClick={() => handleEnter(selectedAsset.id)}>
                  <FaArrowRight size={16} /> View Asset Details
                </button>
                <button style={styles.detailActionBtn} onClick={() => { 
                  setShowDetailModal(false); 
                  handleEdit(selectedAsset); 
                }}>
                  <FaEdit size={16} /> Edit Asset
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
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  searchWrapper: {
    flex: 2,
    minWidth: '200px',
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
    minWidth: '150px',
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
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
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
  assetCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  assetAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  assetInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  assetName: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '14px'
  },
  assetCode: {
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
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    background: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#475569'
  },
  plantBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#475569'
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
    zIndex: 1000,
    animation: 'fadeIn 0.2s'
  },
  modalContent: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    width: '580px',
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
    background: '#eff6ff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3b82f6'
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
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
  detailStatus: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'inline-block',
    width: 'fit-content'
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
  .add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59,130,246,0.4);
  }
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59,130,246,0.4);
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
    border-color: #3b82f6;
    outline: none;
  }
  .form-input:focus, .form-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
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

export default Assets;