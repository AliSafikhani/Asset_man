import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';

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

  const handleClearFilters = () => {
    setSelectedPlantId('');
    setSelectedAssetType('');
    setSearchTerm('');
    // Update URL without reloading
    navigate('/assets', { replace: true });
  };

  const columns = ['ID', 'Name', 'Code', 'Type', 'Plant', 'Manufacturer', 'Model', 'Status', 'Actions'];

  const getPlantName = (plantId) => {
    const plant = plants.find(p => p.id === plantId);
    return plant ? plant.name : '-';
  };

  const tableData = assets.map(asset => ({
    id: asset.id,
    name: asset.asset_name,
    code: asset.asset_code,
    type: asset.asset_type === 'generator' ? ' Generator' : asset.asset_type === 'transformer' ? ' Transformer' : ' Motor',
    plant: getPlantName(asset.plant_id),
    manufacturer: asset.manufacturer || '-',
    model: asset.model || '-',
    status: asset.operational_status || 'active',
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button size="sm" variant="warning" onClick={() => handleEdit(asset)}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(asset.id)}>Delete</Button>
        <Button size="sm" onClick={() => handleEnter(asset.id)}>Enter</Button>
      </div>
    )
  }));

  // Get title based on filter
  const getTitle = () => {
    if (selectedAssetType === 'generator') return 'Generators';
    if (selectedAssetType === 'transformer') return 'Transformers';
    if (selectedAssetType === 'motor') return 'Motors';
    return 'All Assets';
  };

  const getIcon = () => {
    if (selectedAssetType === 'generator') return '';
    if (selectedAssetType === 'transformer') return '';
    if (selectedAssetType === 'motor') return '';
    return '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>{getIcon()} {getTitle()}</h1>
          <p style={{ color: '#6b7280' }}>Manage all {getTitle().toLowerCase()}</p>
        </div>
        <Button onClick={() => { setEditingAsset(null); setFormData({ plant_id: selectedPlantId || '', asset_type: selectedAssetType || 'generator', asset_name: '', asset_code: '', manufacturer: '', model: '' }); setShowForm(true); }}>
          + Add {getTitle().slice(0, -1)}
        </Button>
      </div>

      {/* Filter Section */}
      <Card title="Filters" icon="🔍">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Plant</label>
            <select
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Plants</option>
              {plants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Asset Type</label>
            <select
              value={selectedAssetType}
              onChange={(e) => setSelectedAssetType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Types</option>
              <option value="generator"> Generators</option>
              <option value="transformer"> Transformers</option>
              <option value="motor"> Motors</option>
            </select>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name, code, or manufacturer..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          {(selectedPlantId || selectedAssetType || searchTerm) && (
            <div style={{ marginBottom: '4px' }}>
              <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Assets Table */}
      <Card title={`${getTitle()} List (${assets.length})`} icon={getIcon()}>
        <Table columns={columns} data={tableData} loading={loading} />
      </Card>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={{ marginBottom: '20px' }}>{editingAsset ? `Edit ${getTitle().slice(0, -1)}` : `Add New ${getTitle().slice(0, -1)}`}</h2>
            <form onSubmit={handleSubmit}>
              {!editingAsset && (
                <div style={styles.formGroup}>
                  <label>Plant *</label>
                  <select
                    value={formData.plant_id}
                    onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="">Select Plant</option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div style={styles.formGroup}>
                <label>Asset Type *</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  required
                  disabled={editingAsset}
                  style={styles.input}
                >
                  <option value="generator"> Generator</option>
                  <option value="transformer"> Transformer</option>
                  <option value="motor"> Motor</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label>Asset Name *</label>
                <input
                  type="text"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  required
                  style={styles.input}
                  placeholder="Enter asset name"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Asset Code *</label>
                <input
                  type="text"
                  value={formData.asset_code}
                  onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                  required
                  style={styles.input}
                  placeholder="Enter unique code"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  style={styles.input}
                  placeholder="Manufacturer name"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  style={styles.input}
                  placeholder="Model number"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">{editingAsset ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  formGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    marginTop: '4px',
    boxSizing: 'border-box'
  }
};

export default Assets;
