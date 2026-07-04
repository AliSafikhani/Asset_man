import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';

function Setr() {
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

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    loadPlants();
  }, [selectedCompanyId, searchTerm]);

  const loadCompanies = async () => {
    try {
      const res = await API.get('/companies');
      setCompanies(res.data.items || []);
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
          plant.code.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (window.confirm('Are you sure you want to delete this plant?')) {
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

  const columns = ['ID', 'Name', 'Code', 'Company', 'Actions'];

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '-';
  };

  const tableData = plants.map(plant => ({
    id: plant.id,
    name: plant.name,
    code: plant.code,
    company: getCompanyName(plant.company_id),
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button size="sm" variant="warning" onClick={() => handleEdit(plant)}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(plant.id)}>Delete</Button>
        <Button size="sm" onClick={() => handleEnter(plant.id)}>Enter</Button>
      </div>
    )
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Plants / Sites</h1>
          <p style={{ color: '#6b7280' }}>Manage all plant locations</p>
        </div>
        <Button onClick={() => { setEditingPlant(null); setFormData({ name: '', code: '', company_id: selectedCompanyId || '' }); setShowForm(true); }}>
          + Add Plant
        </Button>
      </div>

      {/* Filter Section */}
      <Card title="Filters" icon="🔍">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Company</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name or code..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          {(selectedCompanyId || searchTerm) && (
            <div style={{ marginBottom: '4px' }}>
              <Button variant="secondary" size="sm" onClick={() => {
                setSelectedCompanyId('');
                setSearchTerm('');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Plants Table */}
      <Card title={`Plants List (${plants.length})`} icon="">
        <Table columns={columns} data={tableData} loading={loading} />
      </Card>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={{ marginBottom: '20px' }}>{editingPlant ? 'Edit Plant' : 'Add New Plant'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Company *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                  required
                  disabled={editingPlant}
                  style={styles.input}
                >
                  <option value="">Select Company</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Plant Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={styles.input}
                  placeholder="Enter plant name"
                />
              </div>
              <div style={styles.formGroup}>
                <label>Plant Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  style={styles.input}
                  placeholder="Enter unique code"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">{editingPlant ? 'Update' : 'Create'}</Button>
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
    maxWidth: '90%'
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

export default Setr;
