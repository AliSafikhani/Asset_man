import { useEffect, useState } from 'react'

function GeneratorList({ onViewGenerator }) {
  const [generators, setGenerators] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    generator_type: '',
    prime_mover_type: '',
    min_power_mw: '',
    max_power_mw: '',
    status: ''
  })

  useEffect(() => {
    fetchGenerators()
  }, [filters])

  const fetchGenerators = async () => {
    setLoading(true)
    try {
      const assetResponse = await fetch('http://localhost:8000/api/v1/assets?asset_type=generator')
      const assets = await assetResponse.json()
      
      const assetList = assets.items || assets || []
      
      const generatorDetails = await Promise.all(
        assetList.map(async (asset) => {
          try {
            const genResponse = await fetch(`http://localhost:8000/api/v1/generators/${asset.id}`)
            if (genResponse.ok) {
              const details = await genResponse.json()
              return { ...asset, ...details }
            }
            return asset
          } catch {
            return asset
          }
        })
      )
      
      let filtered = generatorDetails
      
      if (filters.search) {
        filtered = filtered.filter(g => 
          g.asset_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          g.asset_code?.toLowerCase().includes(filters.search.toLowerCase()) ||
          g.manufacturer?.toLowerCase().includes(filters.search.toLowerCase())
        )
      }
      
      if (filters.generator_type) {
        filtered = filtered.filter(g => g.generator_type === filters.generator_type)
      }
      
      if (filters.prime_mover_type) {
        filtered = filtered.filter(g => g.prime_mover_type === filters.prime_mover_type)
      }
      
      if (filters.min_power_mw) {
        filtered = filtered.filter(g => (g.power_rating_mw || 0) >= parseFloat(filters.min_power_mw))
      }
      
      if (filters.max_power_mw) {
        filtered = filtered.filter(g => (g.power_rating_mw || 0) <= parseFloat(filters.max_power_mw))
      }
      
      if (filters.status) {
        filtered = filtered.filter(g => g.operational_status === filters.status)
      }
      
      setGenerators(filtered)
    } catch (error) {
      console.error('Error fetching generators:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    })
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      generator_type: '',
      prime_mover_type: '',
      min_power_mw: '',
      max_power_mw: '',
      status: ''
    })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#4CAF50'
      case 'maintenance': return '#FF9800'
      case 'failed': return '#f44336'
      case 'standby': return '#2196F3'
      default: return '#9E9E9E'
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}> Generators</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Total: {generators.length} units
        </div>
      </div>

      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <input
            name="search"
            placeholder="🔍 Search by name/code..."
            value={filters.search}
            onChange={handleFilterChange}
            style={inputStyle}
          />
          
          <select name="generator_type" value={filters.generator_type} onChange={handleFilterChange} style={inputStyle}>
            <option value="">All Types</option>
            <option value="synchronous">Synchronous</option>
            <option value="induction">Induction</option>
            <option value="permanent_magnet">Permanent Magnet</option>
          </select>
          
          <select name="prime_mover_type" value={filters.prime_mover_type} onChange={handleFilterChange} style={inputStyle}>
            <option value="">All Prime Movers</option>
            <option value="diesel">Diesel</option>
            <option value="gas_turbine">Gas Turbine</option>
            <option value="steam_turbine">Steam Turbine</option>
            <option value="hydro_turbine">Hydro</option>
            <option value="wind_turbine">Wind</option>
          </select>
          
          <input
            name="min_power_mw"
            type="number"
            step="0.1"
            placeholder="Min Power (MW)"
            value={filters.min_power_mw}
            onChange={handleFilterChange}
            style={inputStyle}
          />
          
          <input
            name="max_power_mw"
            type="number"
            step="0.1"
            placeholder="Max Power (MW)"
            value={filters.max_power_mw}
            onChange={handleFilterChange}
            style={inputStyle}
          />
          
          <select name="status" value={filters.status} onChange={handleFilterChange} style={inputStyle}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="standby">Standby</option>
            <option value="failed">Failed</option>
          </select>
          
          <button onClick={clearFilters} style={{ ...buttonStyle, backgroundColor: '#6c757d' }}>
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading generators...</div>
      ) : generators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '10px' }}>
          <p>No generators found. Click "Add Generator" to create one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {generators.map((gen) => (
            <div key={gen.id} style={{
              background: 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onClick={() => onViewGenerator && onViewGenerator(gen.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#333' }}>{gen.asset_name}</h3>
                  <code style={{ fontSize: '12px', color: '#666' }}>{gen.asset_code}</code>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  backgroundColor: getStatusColor(gen.operational_status),
                  color: 'white'
                }}>
                  {gen.operational_status || 'unknown'}
                </span>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Type:</span>
                  <strong>{gen.generator_type || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Prime Mover:</span>
                  <strong>{gen.prime_mover_type || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Power Rating:</span>
                  <strong>{gen.power_rating_mw || 0} MW / {gen.power_rating_mva || 0} MVA</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Manufacturer:</span>
                  <strong>{gen.manufacturer || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Year:</span>
                  <strong>{gen.manufacturing_year || '-'}</strong>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewGenerator && onViewGenerator(gen.id) }}
                  style={{ ...smallButtonStyle, backgroundColor: '#2196F3' }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box'
}

const buttonStyle = {
  padding: '10px 20px',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px'
}

const smallButtonStyle = {
  padding: '6px 12px',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '12px',
  flex: 1
}

export default GeneratorList
