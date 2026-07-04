import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await API.get('/companies');
      let companiesData = res.data.items || [];
      
      // Filter by search term
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

  const columns = ['ID', 'Name', 'Code', 'Address', 'Phone', 'Email', 'Actions'];

  const tableData = companies.map(company => ({
    id: company.id,
    name: company.name,
    code: company.code,
    address: company.address || '-',
    phone: company.phone || '-',
    email: company.email || '-',
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button size="sm" variant="warning" onClick={() => handleEdit(company)}>Edit</Button>
        <Button size="sm" variant="danger" onClick={() => handleDelete(company.id)}>Delete</Button>
        <Button size="sm" onClick={() => handleEnter(company.id)}>Enter</Button>
      </div>
    )
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Companies</h1>
          <p style={{ color: '#6b7280' }}>Manage all companies and organizations</p>
        </div>
        <Button onClick={() => { setEditingCompany(null); setFormData({ name: '', code: '', address: '', phone: '', email: '' }); setShowForm(true); }}>
          + Add Company
        </Button>
      </div>

      {/* Filter Section */}
      <Card title="Filters" icon="🔍">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name, code, or email..."
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          {searchTerm && (
            <div style={{ marginBottom: '4px' }}>
              <Button variant="secondary" size="sm" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Companies Table */}
      <Card title={`Companies List (${companies.length})`} icon="">
        <Table columns={columns} data={tableData} loading={loading} />
      </Card>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={{ marginBottom: '20px' }}>{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={styles.input}
                  placeholder="Enter company name"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Company Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  style={styles.input}
                  placeholder="Enter unique company code"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={styles.input}
                  placeholder="Company address"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={styles.input}
                  placeholder="Contact phone"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                  placeholder="contact@company.com"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">{editingCompany ? 'Update' : 'Create'}</Button>
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

export default Companies;
