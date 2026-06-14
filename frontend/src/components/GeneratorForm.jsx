import { useState } from 'react'

function GeneratorForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    plant_id: 1,
    asset_type: 'generator',
    asset_name: '',
    asset_code: '',
    manufacturer: '',
    model: '',
    criticality_level: 'medium'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use relative URL - the proxy will forward to backend
      const response = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: parseInt(formData.plant_id),
          asset_type: formData.asset_type,
          asset_name: formData.asset_name,
          asset_code: formData.asset_code,
          manufacturer: formData.manufacturer,
          model: formData.model,
          criticality_level: formData.criticality_level
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create asset')
      }

      const asset = await response.json()
      alert(`Generator "${asset.asset_name}" created successfully!`)
      
      if (onSuccess) onSuccess()
      
    } catch (err) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '10px',
      padding: '30px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    }}>
      <h2>➕ Register New Generator</h2>
      
      {error && (
        <div style={{
          padding: '10px',
          background: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Asset Name *</label>
          <input
            name="asset_name"
            value={formData.asset_name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Asset Code *</label>
          <input
            name="asset_code"
            value={formData.asset_code}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Manufacturer</label>
          <input
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Model</label>
          <input
            name="model"
            value={formData.model}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={onCancel} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Creating...' : 'Create Generator'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GeneratorForm
