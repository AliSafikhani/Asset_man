// frontend\src\components\AssetDetail\tabs\AssetHealthTab\subTabs\IEC62874.jsx
import React, { useState, useEffect } from 'react';
import API from '../../../../../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const IEC62874 = ({ asset, assetId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (assetId) {
      calculateIECStatus();
    }
  }, [assetId]);

  const calculateIECStatus = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await API.get(`/diagnostics/transformer/${assetId}/iec62874`);
      if (response.data.status === 'success') {
        setResult(response.data.data);
      } else {
        setError('Unexpected response format');
      }
    } catch (err) {
      console.error('Error calculating IEC status:', err);
      setError(err.response?.data?.detail || 'Failed to calculate IEC status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'LOW': return '#10b981';
      case 'TYPICAL': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      case 'N.A.': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      LOW: { bg: '#d1fae5', text: '#065f46' },
      TYPICAL: { bg: '#fef3c7', text: '#92400e' },
      HIGH: { bg: '#fee2e2', text: '#991b1b' },
      'N.A.': { bg: '#f1f5f9', text: '#475569' }
    };
    const style = colors[status] || colors['N.A.'];
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.text
      }}>
        {status}
      </span>
    );
  };

  const getValidationStatusBadge = (status) => {
    const colors = {
      VALID: { bg: '#d1fae5', text: '#065f46', label: '✅ VALID' },
      INSUFFICIENT_TESTS: { bg: '#fee2e2', text: '#991b1b', label: '❌ Insufficient Tests' },
      INSUFFICIENT_TIME_GAP: { bg: '#fef3c7', text: '#92400e', label: '⚠️ Insufficient Time Gap' },
      NO_VALID_TESTS_AFTER_MAINTENANCE: { bg: '#fee2e2', text: '#991b1b', label: '❌ No Valid Tests After Maintenance' }
    };
    const style = colors[status] || { bg: '#f1f5f9', text: '#475569', label: status };
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 14px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        background: style.bg,
        color: style.text
      }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Calculating IEC 62874 assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          color: '#991b1b'
        }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>No data available. Click "Calculate" to run the assessment.</p>
        <button
          onClick={calculateIECStatus}
          style={{
            marginTop: '12px',
            padding: '8px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Calculate IEC 62874
        </button>
      </div>
    );
  }

  // Extract transformer details from asset prop
  const transformerDetails = asset?.transformer || {};
  const assetDetails = asset || {};

  // Reference values
  const ref2FAL = result.reference_2FAL || {};
  const refCO2 = result.reference_CO2 || {};

  // Filter test data for charts
  const co2Data = result.test_history ? result.test_history.filter(d => d.co2 !== null) : [];
  const falData = result.test_history ? result.test_history.filter(d => d.fal !== null) : [];

  // Helper to display value or 'N/A'
  const displayValue = (value) => (value !== null && value !== undefined && value !== '') ? value : 'N/A';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
            IEC TR 62874:2015 – Paper Thermal Degradation Assessment
          </h2>
          <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
            {result.transformer} • {result.age_years} years ({result.age_category})
          </p>
        </div>
        <div>
          {getValidationStatusBadge(result.validation?.status)}
        </div>
      </div>

      {/* ======== TRANSFORMER SPECIFICATIONS SECTION ======== */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Transformer Specifications</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px 24px'
        }}>
          {/* General Info */}
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Asset Name</span><br /><strong>{displayValue(assetDetails.asset_name)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Asset Code</span><br /><strong>{displayValue(assetDetails.asset_code)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Manufacturer</span><br /><strong>{displayValue(assetDetails.manufacturer)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Model</span><br /><strong>{displayValue(assetDetails.model)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Serial Number</span><br /><strong>{displayValue(assetDetails.serial_number)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Commissioning Date</span><br /><strong>{displayValue(assetDetails.commissioning_date)}</strong></div>
          
          {/* Algorithm-specific */}
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Transformer Type (Family)</span><br /><strong style={{ color: '#667eea' }}>{displayValue(transformerDetails.transformer_type)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Breathing</span><br /><strong style={{ color: '#667eea' }}>{displayValue(transformerDetails.breathing)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Oil Type (Inhibition)</span><br /><strong style={{ color: '#667eea' }}>{displayValue(transformerDetails.oil_inhibition)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Paper Type (Insulation)</span><br /><strong style={{ color: '#667eea' }}>{displayValue(transformerDetails.paper_type)}</strong></div>
          
          {/* Additional technical specs */}
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Power Rating (MVA)</span><br /><strong>{displayValue(transformerDetails.power_rating_mva)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>HV Voltage (kV)</span><br /><strong>{displayValue(transformerDetails.hv_voltage_kv)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>LV Voltage (kV)</span><br /><strong>{displayValue(transformerDetails.lv_voltage_kv)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Cooling Type</span><br /><strong>{displayValue(transformerDetails.cooling_type)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Vector Group</span><br /><strong>{displayValue(transformerDetails.vector_group)}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Frequency (Hz)</span><br /><strong>{displayValue(transformerDetails.frequency_hz)}</strong></div>
        </div>
        {(!transformerDetails || Object.keys(transformerDetails).length === 0) && (
          <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>
            ⚠️ Transformer details not found for this asset.
          </div>
        )}
      </div>

      {/* Main Analysis Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Final Decision Card */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: `4px solid ${getStatusColor(result.final_decision)}`
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Final Decision</h3>
          <div style={{ fontSize: '28px', fontWeight: '700', color: getStatusColor(result.final_decision) }}>
            {result.final_decision}
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Conservative assessment per Clause 6.2</p>
        </div>

        {/* 2-FAL Card */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>2-FAL (Furan)</h3>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a' }}>
            {result['latest_2FAL_mg/kg'] !== null ? `${result['latest_2FAL_mg/kg']} mg/kg` : 'N/A'}
          </div>
          <div style={{ marginTop: '4px' }}>
            {getStatusBadge(result['2FAL_status'])}
          </div>
          {ref2FAL.C90 !== undefined && (
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              C90: {ref2FAL.C90} • C98: {ref2FAL.C98}
              {ref2FAL.R90 !== undefined && ` • R90: ${ref2FAL.R90}`}
              {ref2FAL.R98 !== undefined && ` • R98: ${ref2FAL.R98}`}
            </div>
          )}
        </div>

        {/* CO2 Card */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>CO₂ (DGA)</h3>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a' }}>
            {result['latest_CO2_μl/l'] !== null ? `${result['latest_CO2_μl/l']} μl/l` : 'N/A'}
          </div>
          <div style={{ marginTop: '4px' }}>
            {getStatusBadge(result['CO2_status'])}
          </div>
          {refCO2.C90 !== undefined && (
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              C90: {refCO2.C90} • C98: {refCO2.C98}
            </div>
          )}
        </div>

        {/* Rate of Increase Card */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Rate of Increase (RoI)</h3>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a' }}>
            {result['RoI_mg/kg_year'] !== null ? `${result['RoI_mg/kg_year']} mg/kg/yr` : 'N/A'}
          </div>
          <div style={{ marginTop: '4px' }}>
            {getStatusBadge(result['RoI_status'])}
          </div>
          {result.notes && (
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              {result.notes}
            </div>
          )}
        </div>
      </div>

      {/* Test Summary */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0f172a' }}>Test Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Total Tests</span>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>{result.test_summary?.total_tests || 0}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Valid Tests</span>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>{result.test_summary?.valid_tests || 0}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Invalid Tests</span>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>{result.test_summary?.invalid_tests || 0}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px' }}>First Valid Test</span>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
              {result.test_summary?.valid_test_dates?.[0] || 'N/A'}
            </div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Last Valid Test</span>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a' }}>
              {result.test_summary?.valid_test_dates?.slice(-1)[0] || 'N/A'}
            </div>
          </div>
        </div>
        {result.test_summary?.invalid_test_dates?.length > 0 && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '4px', fontSize: '13px', color: '#991b1b' }}>
            <strong>Invalid tests:</strong> {result.test_summary.invalid_test_dates.join(', ')}
            <br />
            <span style={{ fontSize: '12px' }}>{result.test_summary.invalid_test_reasons?.[0]}</span>
          </div>
        )}
      </div>

      {/* Trend Charts with Reference Lines */}
      {result.test_history && result.test_history.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#0f172a' }}>Trend Analysis with Reference Limits</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* CO₂ Chart */}
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>CO₂ Trend</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={co2Data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis label={{ value: 'μl/l', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="co2" stroke="#667eea" strokeWidth={2} dot={{ r: 4 }} />
                  {refCO2.C90 !== undefined && (
                    <ReferenceLine y={refCO2.C90} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `C90 (${refCO2.C90})`, fill: '#f59e0b', fontSize: 11, position: 'right' }} />
                  )}
                  {refCO2.C98 !== undefined && (
                    <ReferenceLine y={refCO2.C98} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `C98 (${refCO2.C98})`, fill: '#ef4444', fontSize: 11, position: 'right' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                <span style={{ color: '#f59e0b' }}>--- C90</span> • <span style={{ color: '#ef4444' }}>--- C98</span>
              </div>
            </div>

            {/* 2-FAL Chart */}
            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>2-FAL Trend</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={falData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis label={{ value: 'mg/kg', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="fal" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  {ref2FAL.C90 !== undefined && (
                    <ReferenceLine y={ref2FAL.C90} stroke="#10b981" strokeDasharray="5 5" label={{ value: `C90 (${ref2FAL.C90})`, fill: '#10b981', fontSize: 11, position: 'right' }} />
                  )}
                  {ref2FAL.C98 !== undefined && (
                    <ReferenceLine y={ref2FAL.C98} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `C98 (${ref2FAL.C98})`, fill: '#f59e0b', fontSize: 11, position: 'right' }} />
                  )}
                  {ref2FAL.R90 !== undefined && (
                    <ReferenceLine y={ref2FAL.R90} stroke="#3b82f6" strokeDasharray="2 2" label={{ value: `R90 (${ref2FAL.R90})`, fill: '#3b82f6', fontSize: 11, position: 'right' }} />
                  )}
                  {ref2FAL.R98 !== undefined && (
                    <ReferenceLine y={ref2FAL.R98} stroke="#ef4444" strokeDasharray="2 2" label={{ value: `R98 (${ref2FAL.R98})`, fill: '#ef4444', fontSize: 11, position: 'right' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                <span style={{ color: '#10b981' }}>--- C90</span> • <span style={{ color: '#f59e0b' }}>--- C98</span> • <span style={{ color: '#3b82f6' }}>--- R90</span> • <span style={{ color: '#ef4444' }}>--- R98</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#92400e' }}>⚠️ Warnings</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f', fontSize: '13px' }}>
            {result.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Details */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        fontSize: '13px',
        color: '#475569'
      }}>
        <strong>Validation Details:</strong> {result.validation?.message}
        {result.validation?.details && (
          <pre style={{
            marginTop: '8px',
            padding: '8px',
            background: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            overflowX: 'auto',
            color: '#1e293b'
          }}>
            {JSON.stringify(result.validation.details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default IEC62874;