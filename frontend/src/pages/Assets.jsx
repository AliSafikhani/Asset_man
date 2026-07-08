

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
  FaServer, FaWrench, FaInfoCircle, FaCalendar,
  FaThermometerHalf, FaFlask, FaOilCan, FaTachometerAlt,
  FaClock, FaWeight, FaRulerCombined
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
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Asset Info
    plant_id: '',
    asset_type: 'generator',
    asset_name: '',
    asset_code: '',
    asset_tag: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    manufacturing_year: '',
    installation_date: '',
    commissioning_date: '',
    operational_status: 'active',
    criticality_level: 'medium',
    location_within_plant: '',
    technical_documentation_url: '',
    photo_url: '',
    // Generator Specific
    generator: {},
    // Transformer Specific
    transformer: {},
    // Motor Specific
    motor: {}
  });
  const [editingAsset, setEditingAsset] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const assetTypes = [
    { value: 'generator', label: '⚡ Generator' },
    { value: 'transformer', label: '🔌 Transformer' },
    { value: 'motor', label: '⚙️ Motor' }
  ];

  const operationalStatuses = [
    { value: 'active', label: '🟢 Active' },
    { value: 'maintenance', label: '🟡 Maintenance' },
    { value: 'inactive', label: '🔴 Inactive' },
    { value: 'commissioning', label: '🔵 Commissioning' },
    { value: 'decommissioned', label: '⚫ Decommissioned' }
  ];

  const criticalityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const generatorTypes = ['Synchronous', 'Induction', 'Asynchronous'];
  const primeMoverTypes = ['Steam Turbine', 'Gas Turbine', 'Hydro Turbine', 'Wind Turbine', 'Diesel Engine', 'Gas Engine'];
  const fuelTypes = ['Natural Gas', 'Diesel', 'Heavy Fuel Oil', 'Crude Oil', 'Biogas', 'Hydro', 'Wind', 'Nuclear'];
  const statorConnections = ['Star', 'Delta', 'Star-Delta'];
  const rotorConnections = ['Star', 'Delta'];
  const coolingMethods = ['Air Cooled', 'Hydrogen Cooled', 'Water Cooled', 'Air-Water Cooled'];
  const insulationClasses = ['A', 'B', 'F', 'H', 'N', 'R', 'S', 'Y'];
  const bearingTypes = ['Sleeve', 'Roller', 'Ball', 'Magnetic', 'Hydrodynamic'];

  const motorTypes = ['Induction', 'Synchronous', 'DC', 'Universal', 'Stepper'];
  const mountingTypes = ['Horizontal', 'Vertical', 'Flange', 'Foot', 'Flange-Foot'];
  const dutyTypes = ['S1 - Continuous', 'S2 - Short Time', 'S3 - Intermittent', 'S4 - Intermittent with Starting', 'S5 - Intermittent with Electric Braking'];
  const enclosureTypes = ['Open Drip-Proof', 'Totally Enclosed Fan-Cooled', 'Totally Enclosed Air-Over', 'Explosion Proof', 'Weather Protected'];
  const nemaDesigns = ['A', 'B', 'C', 'D', 'E'];
  const efficiencyClasses = ['IE1', 'IE2', 'IE3', 'IE4', 'IE5'];
  const ipRatings = ['IP20', 'IP23', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66', 'IP67'];

  const transformerTypes = ['Power Transformer', 'Distribution Transformer', 'Auto Transformer', 'Instrument Transformer', 'Step-Up', 'Step-Down'];
  const coolingTypes = ['ONAN', 'ONAF', 'OFAF', 'ODAF', 'OFWF', 'ODWF', 'AN', 'AF'];
  const insulationTypes = ['Oil Immersed', 'Dry Type', 'Gas Filled', 'Silicone', 'Nomex'];
  const vectorGroups = ['Dyn11', 'Dyn1', 'Yyn0', 'Yd11', 'Yd1', 'Dd0', 'Dd6', 'Yz5', 'Yz11'];
  const oilTypes = ['Mineral Oil', 'Synthetic Ester', 'Natural Ester', 'Silicone', 'Gas'];

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
      
      if (selectedPlantId) params.append('plant_id', selectedPlantId);
      if (selectedAssetType) params.append('asset_type', selectedAssetType);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
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

  const calculateAge = (commissioningDate) => {
    if (!commissioningDate) return 'N/A';
    const now = new Date();
    const commDate = new Date(commissioningDate);
    const diffYears = now.getFullYear() - commDate.getFullYear();
    const diffMonths = now.getMonth() - commDate.getMonth();
    const diffDays = now.getDate() - commDate.getDate();
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        plant_id: parseInt(formData.plant_id),
        asset_type: formData.asset_type,
        asset_name: formData.asset_name,
        asset_code: formData.asset_code,
        asset_tag: formData.asset_tag || null,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        manufacturing_year: formData.manufacturing_year ? parseInt(formData.manufacturing_year) : null,
        installation_date: formData.installation_date || null,
        commissioning_date: formData.commissioning_date || null,
        operational_status: formData.operational_status,
        criticality_level: formData.criticality_level,
        location_within_plant: formData.location_within_plant || null,
        technical_documentation_url: formData.technical_documentation_url || null,
        photo_url: formData.photo_url || null
      };

      if (formData.asset_type === 'generator') payload.generator = formData.generator;
      else if (formData.asset_type === 'transformer') payload.transformer = formData.transformer;
      else if (formData.asset_type === 'motor') payload.motor = formData.motor;

      if (editingAsset) {
        await API.put(`/assets/${editingAsset.id}`, payload);
        toast.success('Asset updated successfully!');
      } else {
        await API.post('/assets/', payload);
        toast.success('Asset created successfully!');
      }
      setShowForm(false);
      setEditingAsset(null);
      resetForm();
      loadAssets();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = async (asset) => {
    try {
      const res = await API.get(`/assets/${asset.id}`);
      const fullAsset = res.data;
      
      setEditingAsset(fullAsset);
      
      setFormData({
        plant_id: fullAsset.plant_id || '',
        asset_type: fullAsset.asset_type || 'generator',
        asset_name: fullAsset.asset_name || '',
        asset_code: fullAsset.asset_code || '',
        asset_tag: fullAsset.asset_tag || '',
        manufacturer: fullAsset.manufacturer || '',
        model: fullAsset.model || '',
        serial_number: fullAsset.serial_number || '',
        manufacturing_year: fullAsset.manufacturing_year || '',
        installation_date: fullAsset.installation_date || '',
        commissioning_date: fullAsset.commissioning_date || '',
        operational_status: fullAsset.operational_status || 'active',
        criticality_level: fullAsset.criticality_level || 'medium',
        location_within_plant: fullAsset.location_within_plant || '',
        technical_documentation_url: fullAsset.technical_documentation_url || '',
        photo_url: fullAsset.photo_url || '',
        generator: fullAsset.generator || {},
        transformer: fullAsset.transformer || {},
        motor: fullAsset.motor || {}
      });
      
      setFormStep(1);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading asset details:', error);
      toast.error('Failed to load asset details');
    }
  };

  const resetForm = () => {
    setFormData({
      plant_id: '',
      asset_type: 'generator',
      asset_name: '',
      asset_code: '',
      asset_tag: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      manufacturing_year: '',
      installation_date: '',
      commissioning_date: '',
      operational_status: 'active',
      criticality_level: 'medium',
      location_within_plant: '',
      technical_documentation_url: '',
      photo_url: '',
      generator: {},
      transformer: {},
      motor: {}
    });
    setFormStep(1);
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

  const viewAssetDetails = async (asset) => {
    try {
      const res = await API.get(`/assets/${asset.id}`);
      setSelectedAsset(res.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading asset details:', error);
      toast.error('Failed to load asset details');
    }
  };

  const handleFieldChange = (section, field, value) => {
    if (section === 'basic') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    }
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
      case 'active': return '#10b981';
      case 'maintenance': return '#f59e0b';
      case 'inactive': return '#ef4444';
      case 'commissioning': return '#3b82f6';
      case 'decommissioned': return '#6b7280';
      default: return '#94a3b8';
    }
  };

  const getStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return '🟢 Active';
      case 'maintenance': return '🟡 Maintenance';
      case 'inactive': return '🔴 Inactive';
      case 'commissioning': return '🔵 Commissioning';
      case 'decommissioned': return '⚫ Decommissioned';
      default: return status || 'Unknown';
    }
  };

  const columns = ['#', 'Asset', 'Code', 'Type', 'Plant', 'Manufacturer', 'Age', 'Status', 'Actions'];

  const tableData = assets.map((asset, index) => ({
    id: asset.id,
    '#': <span style={styles.rowNumber}>{index + 1}</span>,
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
    code: <span style={styles.codeBadge}>{asset.asset_code}</span>,
    type: (
      <span style={styles.typeBadge}>
        {getAssetIcon(asset.asset_type)}
        <span style={{ marginLeft: '6px' }}>{getAssetTypeLabel(asset.asset_type)}</span>
      </span>
    ),
    plant: (
      <span style={styles.plantBadge}>
        <FaBuilding size={12} color="#64748b" style={{ marginRight: '4px' }} />
        {plants.find(p => p.id === asset.plant_id)?.name || '-'}
      </span>
    ),
    manufacturer: asset.manufacturer || '-',
    age: (
      <span style={{
        ...styles.ageBadge,
        color: asset.commissioning_date ? (
          parseInt(calculateAge(asset.commissioning_date)) > 20 ? '#ef4444' :
          parseInt(calculateAge(asset.commissioning_date)) > 10 ? '#f59e0b' : '#10b981'
        ) : '#94a3b8'
      }}>
        <FaClock size={12} style={{ marginRight: '4px' }} />
        {calculateAge(asset.commissioning_date)}
      </span>
    ),
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
        <button style={styles.actionBtn} onClick={() => viewAssetDetails(asset)} title="View Details">
          <FaInfoCircle size={14} />
        </button>
        <button style={{ ...styles.actionBtn, ...styles.actionBtnEdit }} onClick={() => handleEdit(asset)} title="Edit">
          <FaEdit size={14} />
        </button>
        <button style={{ ...styles.actionBtn, ...styles.actionBtnDelete }} onClick={() => handleDelete(asset.id)} title="Delete">
          <FaTrash size={14} />
        </button>
        <button style={{ ...styles.actionBtn, ...styles.actionBtnEnter }} onClick={() => handleEnter(asset.id)} title="Enter Asset">
          <FaArrowRight size={14} />
        </button>
      </div>
    )
  }));

  const renderAssetSpecificFields = () => {
    const type = formData.asset_type;

    if (type === 'generator') {
      return (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <FaBolt size={18} color="#f59e0b" />
            <h3 style={styles.sectionTitle}>Generator Specifications</h3>
          </div>
          
          <h4 style={styles.subSectionTitle}>Basic Specifications</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Generator Type</label>
              <select
                value={formData.generator.generator_type || ''}
                onChange={(e) => handleFieldChange('generator', 'generator_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {generatorTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Prime Mover Type</label>
              <select
                value={formData.generator.prime_mover_type || ''}
                onChange={(e) => handleFieldChange('generator', 'prime_mover_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {primeMoverTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Fuel Type</label>
              <select
                value={formData.generator.fuel_type || ''}
                onChange={(e) => handleFieldChange('generator', 'fuel_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {fuelTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Power Rating (MW)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.power_rating_mw || ''}
                onChange={(e) => handleFieldChange('generator', 'power_rating_mw', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 100"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Power Rating (MVA)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.power_rating_mva || ''}
                onChange={(e) => handleFieldChange('generator', 'power_rating_mva', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 125"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Power Factor</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.power_factor || ''}
                onChange={(e) => handleFieldChange('generator', 'power_factor', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.85"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Efficiency (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.efficiency_percent || ''}
                onChange={(e) => handleFieldChange('generator', 'efficiency_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 98.5"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Electrical Parameters</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Voltage (kV)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.voltage_kv || ''}
                onChange={(e) => handleFieldChange('generator', 'voltage_kv', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 11"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Current (A)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.current_a || ''}
                onChange={(e) => handleFieldChange('generator', 'current_a', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 5248"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Frequency (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={formData.generator.frequency_hz || ''}
                onChange={(e) => handleFieldChange('generator', 'frequency_hz', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 50"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Number of Phases</label>
              <input
                type="number"
                value={formData.generator.number_of_phases || 3}
                onChange={(e) => handleFieldChange('generator', 'number_of_phases', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 3"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Stator Connection</label>
              <select
                value={formData.generator.stator_connection || ''}
                onChange={(e) => handleFieldChange('generator', 'stator_connection', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {statorConnections.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Rotor Connection</label>
              <select
                value={formData.generator.rotor_connection || ''}
                onChange={(e) => handleFieldChange('generator', 'rotor_connection', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {rotorConnections.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Synchronous Generator Parameters</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Synchronous Reactance (Xd)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.synchronous_reactance_xd || ''}
                onChange={(e) => handleFieldChange('generator', 'synchronous_reactance_xd', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 1.8"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Transient Reactance (Xd')</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.transient_reactance_xd || ''}
                onChange={(e) => handleFieldChange('generator', 'transient_reactance_xd', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.3"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Subtransient Reactance (Xd'')</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.subtransient_reactance_xd || ''}
                onChange={(e) => handleFieldChange('generator', 'subtransient_reactance_xd', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.15"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Inertia Constant (H)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.inertia_constant_h || ''}
                onChange={(e) => handleFieldChange('generator', 'inertia_constant_h', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 4.5"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Short Circuit Ratio</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.short_circuit_ratio || ''}
                onChange={(e) => handleFieldChange('generator', 'short_circuit_ratio', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.6"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Induction Generator Parameters</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Rotor Resistance (R2)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.generator.rotor_resistance_r2 || ''}
                onChange={(e) => handleFieldChange('generator', 'rotor_resistance_r2', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.02"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Stator Resistance (R1)</label>
              <input
                type="number"
                step="0.0001"
                value={formData.generator.stator_resistance_r1 || ''}
                onChange={(e) => handleFieldChange('generator', 'stator_resistance_r1', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.01"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Slip at Rated Load (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.slip_at_rated_load || ''}
                onChange={(e) => handleFieldChange('generator', 'slip_at_rated_load', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Physical Characteristics</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Cooling Method</label>
              <select
                value={formData.generator.cooling_method || ''}
                onChange={(e) => handleFieldChange('generator', 'cooling_method', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {coolingMethods.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Insulation Class</label>
              <select
                value={formData.generator.insulation_class || ''}
                onChange={(e) => handleFieldChange('generator', 'insulation_class', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {insulationClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Bearing Type</label>
              <select
                value={formData.generator.bearing_type || ''}
                onChange={(e) => handleFieldChange('generator', 'bearing_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {bearingTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Rotor Speed (RPM)</label>
              <input
                type="number"
                value={formData.generator.rotor_speed_rpm || ''}
                onChange={(e) => handleFieldChange('generator', 'rotor_speed_rpm', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 1500"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.weight_kg || ''}
                onChange={(e) => handleFieldChange('generator', 'weight_kg', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 45000"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Operational Limits</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Max Continuous Power (MW)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.max_continuous_power_mw || ''}
                onChange={(e) => handleFieldChange('generator', 'max_continuous_power_mw', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 110"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Minimum Load (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.generator.min_load_percent || ''}
                onChange={(e) => handleFieldChange('generator', 'min_load_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 30"
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'transformer') {
      return (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <MdTransform size={18} color="#8b5cf6" />
            <h3 style={styles.sectionTitle}>Transformer Specifications</h3>
          </div>
          
          <h4 style={styles.subSectionTitle}>Basic Specifications</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Transformer Type</label>
              <select
                value={formData.transformer.transformer_type || ''}
                onChange={(e) => handleFieldChange('transformer', 'transformer_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {transformerTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Cooling Type</label>
              <select
                value={formData.transformer.cooling_type || ''}
                onChange={(e) => handleFieldChange('transformer', 'cooling_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {coolingTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Number of Windings</label>
              <input
                type="number"
                value={formData.transformer.number_of_windings || 2}
                onChange={(e) => handleFieldChange('transformer', 'number_of_windings', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 2"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Power Ratings</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Power Rating (MVA)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.power_rating_mva || ''}
                onChange={(e) => handleFieldChange('transformer', 'power_rating_mva', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 50"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Power Rating (MVA) - Forced</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.power_rating_mva_forced || ''}
                onChange={(e) => handleFieldChange('transformer', 'power_rating_mva_forced', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 60"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Voltage Ratings</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>HV Voltage (kV)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.hv_voltage_kv || ''}
                onChange={(e) => handleFieldChange('transformer', 'hv_voltage_kv', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 132"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>LV Voltage (kV)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.lv_voltage_kv || ''}
                onChange={(e) => handleFieldChange('transformer', 'lv_voltage_kv', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 33"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Tertiary Voltage (kV)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.tertiary_voltage_kv || ''}
                onChange={(e) => handleFieldChange('transformer', 'tertiary_voltage_kv', e.target.value)}
                style={styles.formInput}
                placeholder="Optional"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>HV Tap Range (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.hv_tap_range_percent || ''}
                onChange={(e) => handleFieldChange('transformer', 'hv_tap_range_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., ±10"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Number of Taps</label>
              <input
                type="number"
                value={formData.transformer.number_of_taps || ''}
                onChange={(e) => handleFieldChange('transformer', 'number_of_taps', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 17"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Impedance & Resistance</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Impedance (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.impedance_percent || ''}
                onChange={(e) => handleFieldChange('transformer', 'impedance_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 12.5"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>HV Resistance (Ω)</label>
              <input
                type="number"
                step="0.001"
                value={formData.transformer.hv_resistance_ohms || ''}
                onChange={(e) => handleFieldChange('transformer', 'hv_resistance_ohms', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.5"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>LV Resistance (Ω)</label>
              <input
                type="number"
                step="0.001"
                value={formData.transformer.lv_resistance_ohms || ''}
                onChange={(e) => handleFieldChange('transformer', 'lv_resistance_ohms', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 0.05"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Magnetizing Current (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.magnetizing_current_percent || ''}
                onChange={(e) => handleFieldChange('transformer', 'magnetizing_current_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 1.5"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Insulation</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Insulation Type</label>
              <select
                value={formData.transformer.insulation_type || ''}
                onChange={(e) => handleFieldChange('transformer', 'insulation_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {insulationTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Insulation Class</label>
              <select
                value={formData.transformer.insulation_class || ''}
                onChange={(e) => handleFieldChange('transformer', 'insulation_class', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {insulationClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Insulation Level HV (kV)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.insulation_level_hv_kv || ''}
                onChange={(e) => handleFieldChange('transformer', 'insulation_level_hv_kv', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 550"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Insulation Level LV (kV)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.insulation_level_lv_kv || ''}
                onChange={(e) => handleFieldChange('transformer', 'insulation_level_lv_kv', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 170"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Physical & Operational</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Vector Group</label>
              <select
                value={formData.transformer.vector_group || ''}
                onChange={(e) => handleFieldChange('transformer', 'vector_group', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {vectorGroups.map(group => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Frequency (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={formData.transformer.frequency_hz || ''}
                onChange={(e) => handleFieldChange('transformer', 'frequency_hz', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 50"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Oil Type</label>
              <select
                value={formData.transformer.oil_type || ''}
                onChange={(e) => handleFieldChange('transformer', 'oil_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {oilTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Oil Volume (Liters)</label>
              <input
                type="number"
                step="1"
                value={formData.transformer.oil_volume_liters || ''}
                onChange={(e) => handleFieldChange('transformer', 'oil_volume_liters', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 25000"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.weight_kg || ''}
                onChange={(e) => handleFieldChange('transformer', 'weight_kg', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 120000"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>No Load Loss (W)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.no_load_loss_w || ''}
                onChange={(e) => handleFieldChange('transformer', 'no_load_loss_w', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 45000"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Load Loss (W)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.load_loss_w || ''}
                onChange={(e) => handleFieldChange('transformer', 'load_loss_w', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 250000"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Efficiency (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.efficiency_percent || ''}
                onChange={(e) => handleFieldChange('transformer', 'efficiency_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 99.5"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Temperature Rise - Oil (°C)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.temperature_rise_oil_c || ''}
                onChange={(e) => handleFieldChange('transformer', 'temperature_rise_oil_c', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 55"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Temperature Rise - Winding (°C)</label>
              <input
                type="number"
                step="0.01"
                value={formData.transformer.temperature_rise_winding_c || ''}
                onChange={(e) => handleFieldChange('transformer', 'temperature_rise_winding_c', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 65"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Accessories</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Has On-Load Tap Changer?</label>
              <select
                value={formData.transformer.has_on_load_tap_changer ? 'true' : 'false'}
                onChange={(e) => handleFieldChange('transformer', 'has_on_load_tap_changer', e.target.value === 'true')}
                style={styles.formSelect}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Has Buchholz Relay?</label>
              <select
                value={formData.transformer.has_buchholz_relay ? 'true' : 'false'}
                onChange={(e) => handleFieldChange('transformer', 'has_buchholz_relay', e.target.value === 'true')}
                style={styles.formSelect}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Has Pressure Relief?</label>
              <select
                value={formData.transformer.has_pressure_relief ? 'true' : 'false'}
                onChange={(e) => handleFieldChange('transformer', 'has_pressure_relief', e.target.value === 'true')}
                style={styles.formSelect}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'motor') {
      return (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <FaCogs size={18} color="#06b6d4" />
            <h3 style={styles.sectionTitle}>Motor Specifications</h3>
          </div>
          
          <h4 style={styles.subSectionTitle}>Basic Specifications</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Motor Type</label>
              <select
                value={formData.motor.motor_type || ''}
                onChange={(e) => handleFieldChange('motor', 'motor_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {motorTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Frame Size</label>
              <input
                type="text"
                value={formData.motor.frame_size || ''}
                onChange={(e) => handleFieldChange('motor', 'frame_size', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 315L"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Mounting Type</label>
              <select
                value={formData.motor.mounting_type || ''}
                onChange={(e) => handleFieldChange('motor', 'mounting_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {mountingTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Duty Type</label>
              <select
                value={formData.motor.duty_type || ''}
                onChange={(e) => handleFieldChange('motor', 'duty_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {dutyTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Enclosure Type</label>
              <select
                value={formData.motor.enclosure_type || ''}
                onChange={(e) => handleFieldChange('motor', 'enclosure_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {enclosureTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Power Ratings</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Power (HP)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.power_hp || ''}
                onChange={(e) => handleFieldChange('motor', 'power_hp', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 500"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Power (kW)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.power_kw || ''}
                onChange={(e) => handleFieldChange('motor', 'power_kw', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 375"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Service Factor</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.service_factor || ''}
                onChange={(e) => handleFieldChange('motor', 'service_factor', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 1.15"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Electrical Parameters</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Voltage (V)</label>
              <input
                type="number"
                step="1"
                value={formData.motor.voltage_v || ''}
                onChange={(e) => handleFieldChange('motor', 'voltage_v', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 6600"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Current (A)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.current_a || ''}
                onChange={(e) => handleFieldChange('motor', 'current_a', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 52"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Starting Current (A)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.starting_current_a || ''}
                onChange={(e) => handleFieldChange('motor', 'starting_current_a', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 312"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Frequency (Hz)</label>
              <input
                type="number"
                step="0.1"
                value={formData.motor.frequency_hz || ''}
                onChange={(e) => handleFieldChange('motor', 'frequency_hz', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 50"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Number of Phases</label>
              <input
                type="number"
                value={formData.motor.number_of_phases || 3}
                onChange={(e) => handleFieldChange('motor', 'number_of_phases', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 3"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Induction Motor Parameters</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Synchronous Speed (RPM)</label>
              <input
                type="number"
                value={formData.motor.synchronous_speed_rpm || ''}
                onChange={(e) => handleFieldChange('motor', 'synchronous_speed_rpm', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 1500"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Full Load Speed (RPM)</label>
              <input
                type="number"
                value={formData.motor.full_load_speed_rpm || ''}
                onChange={(e) => handleFieldChange('motor', 'full_load_speed_rpm', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 1485"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Slip (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.slip_percent || ''}
                onChange={(e) => handleFieldChange('motor', 'slip_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 1.0"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>NEMA Design</label>
              <select
                value={formData.motor.nema_design || ''}
                onChange={(e) => handleFieldChange('motor', 'nema_design', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {nemaDesigns.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Efficiency</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Efficiency Class</label>
              <select
                value={formData.motor.efficiency_class || ''}
                onChange={(e) => handleFieldChange('motor', 'efficiency_class', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {efficiencyClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Efficiency @ 100% Load (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.efficiency_100_percent || ''}
                onChange={(e) => handleFieldChange('motor', 'efficiency_100_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 96.5"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Efficiency @ 75% Load (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.efficiency_75_percent || ''}
                onChange={(e) => handleFieldChange('motor', 'efficiency_75_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 96.8"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Efficiency @ 50% Load (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.efficiency_50_percent || ''}
                onChange={(e) => handleFieldChange('motor', 'efficiency_50_percent', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 96.2"
              />
            </div>
          </div>

          <h4 style={styles.subSectionTitle}>Physical & Environmental</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Bearing Type</label>
              <select
                value={formData.motor.bearing_type || ''}
                onChange={(e) => handleFieldChange('motor', 'bearing_type', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {bearingTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Shaft Diameter (mm)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.shaft_diameter_mm || ''}
                onChange={(e) => handleFieldChange('motor', 'shaft_diameter_mm', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 80"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.weight_kg || ''}
                onChange={(e) => handleFieldChange('motor', 'weight_kg', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 2000"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Inertia (kg·m²)</label>
              <input
                type="number"
                step="0.001"
                value={formData.motor.inertia_kg_m2 || ''}
                onChange={(e) => handleFieldChange('motor', 'inertia_kg_m2', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 5.2"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Insulation Class</label>
              <select
                value={formData.motor.insulation_class || ''}
                onChange={(e) => handleFieldChange('motor', 'insulation_class', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {insulationClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Temperature Rise (°C)</label>
              <input
                type="number"
                step="0.01"
                value={formData.motor.temperature_rise_c || ''}
                onChange={(e) => handleFieldChange('motor', 'temperature_rise_c', e.target.value)}
                style={styles.formInput}
                placeholder="e.g., 80"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>IP Rating</label>
              <select
                value={formData.motor.ip_rating || ''}
                onChange={(e) => handleFieldChange('motor', 'ip_rating', e.target.value)}
                style={styles.formSelect}
              >
                <option value="">Select...</option>
                {ipRatings.map(ip => <option key={ip} value={ip}>{ip}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>VFD Compatible?</label>
              <select
                value={formData.motor.vfd_compatible ? 'true' : 'false'}
                onChange={(e) => handleFieldChange('motor', 'vfd_compatible', e.target.value === 'true')}
                style={styles.formSelect}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}><FaServer size={24} color="#3b82f6" /></div>
          <div>
            <h1 style={styles.title}>Assets</h1>
            <p style={styles.subtitle}>Manage all assets in your organization</p>
          </div>
        </div>
        <button style={styles.addBtn} onClick={() => { setEditingAsset(null); resetForm(); setShowForm(true); }}>
          <FaPlus size={16} /> Add Asset
        </button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaServer color="#3b82f6" /></div>
          <div>
            <span style={styles.statValue}>{assets.length}</span>
            <span style={styles.statLabel}>Total Assets</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaCheckCircle color="#10b981" /></div>
          <div>
            <span style={styles.statValue}>
              {assets.filter(a => a.operational_status?.toLowerCase() === 'active').length}
            </span>
            <span style={styles.statLabel}>Active</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaExclamationTriangle color="#f59e0b" /></div>
          <div>
            <span style={styles.statValue}>
              {assets.filter(a => a.operational_status?.toLowerCase() === 'maintenance').length}
            </span>
            <span style={styles.statLabel}>Maintenance</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaBuilding color="#667eea" /></div>
          <div>
            <span style={styles.statValue}>{new Set(assets.map(a => a.plant_id)).size}</span>
            <span style={styles.statLabel}>Plants</span>
          </div>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <div style={styles.searchWrapper}>
          <FaSearch size={18} color="#94a3b8" style={styles.searchIcon} />
          <input type="text" value={searchTerm} onChange={handleSearch} placeholder="Search by name, code, or manufacturer..." style={styles.searchInput} />
          {searchTerm && <button style={styles.clearSearchBtn} onClick={clearSearch}><FaTimes size={16} color="#94a3b8" /></button>}
        </div>
        <div style={styles.filterWrapper}>
          <FaFilter size={16} color="#94a3b8" style={styles.filterIcon} />
          <select value={selectedAssetType} onChange={(e) => setSelectedAssetType(e.target.value)} style={styles.filterSelect}>
            <option value="">All Types</option>
            <option value="generator">⚡ Generators</option>
            <option value="transformer">🔌 Transformers</option>
            <option value="motor">⚙️ Motors</option>
          </select>
        </div>
        <div style={styles.filterWrapper}>
          <FaIndustry size={16} color="#94a3b8" style={styles.filterIcon} />
          <select value={selectedPlantId} onChange={(e) => setSelectedPlantId(e.target.value)} style={styles.filterSelect}>
            <option value="">All Plants</option>
            {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {(selectedPlantId || selectedAssetType || searchTerm) && (
          <button style={styles.clearFiltersBtn} onClick={handleClearFilters}><FaTimes size={14} /> Clear</button>
        )}
      </div>

      {(selectedPlantId || selectedAssetType || searchTerm) && (
        <div style={styles.filterBadges}>
          {selectedAssetType && (
            <span style={styles.filterBadge}>
              {getAssetIcon(selectedAssetType)} {getAssetTypeLabel(selectedAssetType)}
              <button style={styles.filterBadgeRemove} onClick={() => setSelectedAssetType('')}><FaTimes size={12} /></button>
            </span>
          )}
          {selectedPlantId && (
            <span style={styles.filterBadge}>
              <FaBuilding size={12} color="#64748b" /> {plants.find(p => p.id === parseInt(selectedPlantId))?.name || 'Unknown'}
              <button style={styles.filterBadgeRemove} onClick={() => setSelectedPlantId('')}><FaTimes size={12} /></button>
            </span>
          )}
          {searchTerm && (
            <span style={styles.filterBadge}>
              <FaSearch size={12} color="#64748b" /> "{searchTerm}"
              <button style={styles.filterBadgeRemove} onClick={clearSearch}><FaTimes size={12} /></button>
            </span>
          )}
        </div>
      )}

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <span style={styles.tableTitle}><FaDatabase size={16} color="#64748b" style={{ marginRight: '8px' }} /> Assets <span style={styles.tableCount}>({assets.length})</span></span>
        </div>
        <Table columns={columns} data={tableData} loading={loading} />
      </div>

      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <span style={styles.modalIcon}>{editingAsset ? <FaEdit size={20} /> : <FaPlus size={20} />}</span>
                <h2 style={styles.modalTitle}>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
              </div>
              <button style={styles.modalClose} onClick={() => setShowForm(false)}><FaTimes size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.stepIndicator}>
                <div style={{ ...styles.step, ...(formStep === 1 ? styles.stepActive : {}), ...(formStep > 1 ? styles.stepCompleted : {}) }}>
                  <span style={styles.stepNumber}>1</span>
                  <span style={styles.stepLabel}>Basic Info</span>
                </div>
                <div style={styles.stepLine}></div>
                <div style={{ ...styles.step, ...(formStep === 2 ? styles.stepActive : {}), ...(formStep > 2 ? styles.stepCompleted : {}) }}>
                  <span style={styles.stepNumber}>2</span>
                  <span style={styles.stepLabel}>Asset Details</span>
                </div>
              </div>

              {formStep === 1 && (
                <div style={styles.formContent}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}><FaIndustry size={14} style={styles.labelIcon} /> Plant <span style={styles.required}>*</span></label>
                      <select value={formData.plant_id} onChange={(e) => handleFieldChange('basic', 'plant_id', e.target.value)} required style={styles.formSelect}>
                        <option value="">Select Plant</option>
                        {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}><FaMicrochip size={14} style={styles.labelIcon} /> Asset Type <span style={styles.required}>*</span></label>
                      <select value={formData.asset_type} onChange={(e) => { handleFieldChange('basic', 'asset_type', e.target.value); setFormStep(1); }} required style={styles.formSelect}>
                        {assetTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Asset Name <span style={styles.required}>*</span></label>
                      <input type="text" value={formData.asset_name} onChange={(e) => handleFieldChange('basic', 'asset_name', e.target.value)} required style={styles.formInput} placeholder="Enter asset name" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Asset Code <span style={styles.required}>*</span></label>
                      <input type="text" value={formData.asset_code} onChange={(e) => handleFieldChange('basic', 'asset_code', e.target.value)} required style={styles.formInput} placeholder="Enter unique code" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Asset Tag</label>
                      <input type="text" value={formData.asset_tag} onChange={(e) => handleFieldChange('basic', 'asset_tag', e.target.value)} style={styles.formInput} placeholder="Asset tag or barcode" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}><FaWrench size={14} style={styles.labelIcon} /> Manufacturer</label>
                      <input type="text" value={formData.manufacturer} onChange={(e) => handleFieldChange('basic', 'manufacturer', e.target.value)} style={styles.formInput} placeholder="Manufacturer name" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Model</label>
                      <input type="text" value={formData.model} onChange={(e) => handleFieldChange('basic', 'model', e.target.value)} style={styles.formInput} placeholder="Model number" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Serial Number</label>
                      <input type="text" value={formData.serial_number} onChange={(e) => handleFieldChange('basic', 'serial_number', e.target.value)} style={styles.formInput} placeholder="Manufacturer serial number" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Manufacturing Year</label>
                      <input type="number" value={formData.manufacturing_year} onChange={(e) => handleFieldChange('basic', 'manufacturing_year', e.target.value)} style={styles.formInput} placeholder="e.g., 2020" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Installation Date</label>
                      <input type="date" value={formData.installation_date} onChange={(e) => handleFieldChange('basic', 'installation_date', e.target.value)} style={styles.formInput} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}><FaCalendar size={14} style={styles.labelIcon} /> Commissioning Date</label>
                      <input type="date" value={formData.commissioning_date} onChange={(e) => handleFieldChange('basic', 'commissioning_date', e.target.value)} style={styles.formInput} />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Operational Status</label>
                      <select value={formData.operational_status} onChange={(e) => handleFieldChange('basic', 'operational_status', e.target.value)} style={styles.formSelect}>
                        {operationalStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Criticality Level</label>
                      <select value={formData.criticality_level} onChange={(e) => handleFieldChange('basic', 'criticality_level', e.target.value)} style={styles.formSelect}>
                        {criticalityLevels.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Location Within Plant</label>
                      <input type="text" value={formData.location_within_plant} onChange={(e) => handleFieldChange('basic', 'location_within_plant', e.target.value)} style={styles.formInput} placeholder="Building, floor, area" />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Technical Documentation URL</label>
                      <input type="url" value={formData.technical_documentation_url} onChange={(e) => handleFieldChange('basic', 'technical_documentation_url', e.target.value)} style={styles.formInput} placeholder="https://..." />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Photo URL</label>
                      <input type="url" value={formData.photo_url} onChange={(e) => handleFieldChange('basic', 'photo_url', e.target.value)} style={styles.formInput} placeholder="https://..." />
                    </div>
                  </div>
                  <div style={styles.formActions}>
                    <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="button" style={styles.nextBtn} onClick={() => setFormStep(2)}>Next: Asset Details →</button>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div style={styles.formContent}>
                  {renderAssetSpecificFields()}
                  <div style={styles.formActions}>
                    <button type="button" style={styles.backBtn} onClick={() => setFormStep(1)}>← Back</button>
                    <button type="submit" style={styles.submitBtn}>{editingAsset ? 'Update Asset' : 'Create Asset'}</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedAsset && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderLeft}>
                <div style={styles.detailAvatar}>{getAssetIcon(selectedAsset.asset_type)}</div>
                <div>
                  <h2 style={styles.modalTitle}>{selectedAsset.asset_name}</h2>
                  <span style={styles.detailCode}>{selectedAsset.asset_code}</span>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setShowDetailModal(false)}><FaTimes size={20} /></button>
            </div>
            <div style={styles.detailContent}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaBuilding size={14} color="#94a3b8" /> Plant</span>
                  <span style={styles.detailValue}>{plants.find(p => p.id === selectedAsset.plant_id)?.name || '-'}</span>
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
                  <span style={styles.detailLabel}><FaCalendar size={14} color="#94a3b8" /> Commissioning Date</span>
                  <span style={styles.detailValue}>
                    {selectedAsset.commissioning_date ? new Date(selectedAsset.commissioning_date).toLocaleDateString() : 'Not provided'}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaClock size={14} color="#94a3b8" /> Age</span>
                  <span style={styles.detailValue}>{calculateAge(selectedAsset.commissioning_date)}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}><FaInfoCircle size={14} color="#94a3b8" /> Status</span>
                  <span style={{ ...styles.detailStatus, backgroundColor: `${getStatusColor(selectedAsset.operational_status)}20`, color: getStatusColor(selectedAsset.operational_status) }}>
                    {getStatusLabel(selectedAsset.operational_status)}
                  </span>
                </div>
              </div>
              <div style={styles.detailActions}>
                <button style={styles.detailActionBtn} onClick={() => handleEnter(selectedAsset.id)}><FaArrowRight size={16} /> View Asset Details</button>
                <button style={styles.detailActionBtn} onClick={() => { setShowDetailModal(false); handleEdit(selectedAsset); }}><FaEdit size={16} /> Edit Asset</button>
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
    ageBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    background: '#f1f5f9',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    background: '#eff6ff',
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
    width: '820px',
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
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    gap: '0'
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    background: '#f1f5f9',
    color: '#94a3b8'
  },
  stepActive: {
    background: '#4f46e5',
    color: 'white'
  },
  stepCompleted: {
    background: '#10b981',
    color: 'white'
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.2)',
    fontWeight: '700',
    fontSize: '12px'
  },
  stepLabel: {
    fontSize: '13px',
    fontWeight: '500'
  },
  stepLine: {
    width: '40px',
    height: '2px',
    background: '#e2e8f0'
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
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
  textarea: {
    padding: '10px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
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
  backBtn: {
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
  nextBtn: {
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s'
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
    flexShrink: 0,
    background: '#f1f5f9'
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
  },
  section: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    background: '#fafafa'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0
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
  .next-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79,70,229,0.4);
  }
  .cancel-btn:hover, .back-btn:hover {
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
  .filter-select:focus, .form-input:focus, .form-select:focus, .textarea:focus {
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