import { useEffect, useState } from 'react'

function GeneratorDetail({ generatorId, onBack }) {
  const [generator, setGenerator] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchGeneratorDetails()
  }, [generatorId])

  const fetchGeneratorDetails = async () => {
    setLoading(true)
    try {
      // Fetch asset data
      const assetResponse = await fetch(`http://localhost:8000/api/v1/assets/${generatorId}`)
      const asset = await assetResponse.json()
      
      // Fetch generator specific data
      const genResponse = await fetch(`http://localhost:8000/api/v1/generators/${generatorId}`)
      let generatorData = {}
      if (genResponse.ok) {
        generatorData = await genResponse.json()
      }
      
      setGenerator({ ...asset, ...generatorData })
    } catch (error) {
      console.error('Error fetching generator details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        Loading generator details...
      </div>
    )
  }

  if (!generator) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Generator not found</p>
        <button onClick={onBack} style={buttonStyle}>Go Back</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button onClick={onBack} style={{ ...buttonStyle, backgroundColor: '#6c757d', marginRight: '15px' }}>
            ← Back to List
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...buttonStyle, backgroundColor: '#FF9800' }}>✏️ Edit</button>
          <button style={{ ...buttonStyle, backgroundColor: '#f44336' }}>🗑️ Delete</button>
        </div>
      </div>

      {/* Title Card */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, color: '#333' }}> {generator.asset_name}</h1>
            <code style={{ fontSize: '14px', color: '#666' }}>{generator.asset_code}</code>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              backgroundColor: generator.operational_status === 'active' ? '#4CAF50' : '#FF9800',
              color: 'white'
            }}>
              {generator.operational_status?.toUpperCase() || 'UNKNOWN'}
            </span>
            <span style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              backgroundColor: '#e3f2fd',
              color: '#1976d2'
            }}>
              {generator.generator_type || 'Generator'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '5px',
        marginBottom: '20px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '10px'
      }}>
        {['overview', 'electrical', 'mechanical', 'tests', 'real-time', 'documents'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab ? '#667eea' : 'transparent',
              color: activeTab === tab ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>📋 Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <InfoRow label="Asset Name" value={generator.asset_name} />
            <InfoRow label="Asset Code" value={generator.asset_code} />
            <InfoRow label="Manufacturer" value={generator.manufacturer} />
            <InfoRow label="Model" value={generator.model} />
            <InfoRow label="Serial Number" value={generator.serial_number} />
            <InfoRow label="Year" value={generator.manufacturing_year} />
            <InfoRow label="Installation Date" value={generator.installation_date?.split('T')[0]} />
            <InfoRow label="Criticality Level" value={generator.criticality_level} badge />
          </div>

          <h3>⚙️ Generator Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
            <InfoRow label="Generator Type" value={generator.generator_type} />
            <InfoRow label="Prime Mover" value={generator.prime_mover_type} />
            <InfoRow label="Fuel Type" value={generator.fuel_type} />
            <InfoRow label="Power Rating" value={generator.power_rating_mw ? `${generator.power_rating_mw} MW / ${generator.power_rating_mva} MVA` : '-'} />
            <InfoRow label="Power Factor" value={generator.power_factor} />
            <InfoRow label="Efficiency" value={generator.efficiency_percent ? `${generator.efficiency_percent}%` : '-'} />
            <InfoRow label="Cooling Method" value={generator.cooling_method} />
            <InfoRow label="Insulation Class" value={generator.insulation_class} />
            <InfoRow label="Rotor Speed" value={generator.rotor_speed_rpm ? `${generator.rotor_speed_rpm} RPM` : '-'} />
            <InfoRow label="Weight" value={generator.weight_kg ? `${generator.weight_kg} kg` : '-'} />
          </div>
        </div>
      )}

      {/* Electrical Tab */}
      {activeTab === 'electrical' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3> Electrical Parameters</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            <InfoRow label="Voltage" value={generator.voltage_kv ? `${generator.voltage_kv} kV` : '-'} />
            <InfoRow label="Current" value={generator.current_a ? `${generator.current_a} A` : '-'} />
            <InfoRow label="Frequency" value={generator.frequency_hz ? `${generator.frequency_hz} Hz` : '-'} />
            <InfoRow label="Number of Phases" value="3" />
          </div>

          {generator.generator_type === 'synchronous' && (
            <>
              <h3>🔄 Synchronous Generator Parameters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
                <InfoRow label="Synchronous Reactance (Xd)" value={generator.synchronous_reactance_xd} />
                <InfoRow label="Inertia Constant (H)" value={generator.inertia_constant_h ? `${generator.inertia_constant_h} seconds` : '-'} />
                <InfoRow label="Short Circuit Ratio" value={generator.short_circuit_ratio} />
              </div>
            </>
          )}

          {generator.generator_type === 'induction' && (
            <>
              <h3>🔄 Induction Generator Parameters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
                <InfoRow label="Slip at Rated Load" value={generator.slip_at_rated_load ? `${generator.slip_at_rated_load}%` : '-'} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Mechanical Tab */}
      {activeTab === 'mechanical' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>🔧 Mechanical Characteristics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
            <InfoRow label="Cooling Method" value={generator.cooling_method} />
            <InfoRow label="Bearing Type" value={generator.bearing_type || '-'} />
            <InfoRow label="Mounting Type" value={generator.mounting_type || 'Horizontal'} />
            <InfoRow label="Dimensions" value={generator.dimensions || '-'} />
            <InfoRow label="Weight" value={generator.weight_kg ? `${generator.weight_kg} kg` : '-'} />
          </div>
        </div>
      )}

      {/* Placeholders for other tabs */}
      {activeTab === 'tests' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '50px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>📊 Test Results</h3>
          <p>Coming soon! Test history for this generator will appear here.</p>
        </div>
      )}

      {activeTab === 'real-time' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '50px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>📡 Real-Time Monitoring</h3>
          <p>Coming soon! Live DCS data for this generator will appear here.</p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '50px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3>📄 Documents</h3>
          <p>Coming soon! Technical documents and manuals will appear here.</p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, badge }) {
  if (!value && value !== 0) return null
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', padding: '10px 0' }}>
      <span style={{ color: '#666', fontWeight: '500' }}>{label}:</span>
      {badge ? (
        <span style={{
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          backgroundColor: value === 'critical' ? '#ffebee' : '#e8f5e9',
          color: value === 'critical' ? '#c62828' : '#2e7d32'
        }}>
          {value}
        </span>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  )
}

const buttonStyle = {
  padding: '10px 20px',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px'
}

export default GeneratorDetail
