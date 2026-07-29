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

// Icons (using simple emojis or inline SVG – you can replace with react-icons)
const iconMap = {
  transformer: '⚡',
  age: '📅',
  fal: '🧪',
  co2: '💨',
  roi: '📈',
  decision: '🎯',
  warning: '⚠️',
  info: 'ℹ️',
  check: '✅',
  close: '❌',
  refresh: '🔄',
  specs: '📋',
};

const IEC62874 = ({ asset, assetId }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showSpecs, setShowSpecs] = useState(true);

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

  const getStatusGradient = (status) => {
    switch (status) {
      case 'LOW': return 'linear-gradient(135deg, #10b981, #34d399)';
      case 'TYPICAL': return 'linear-gradient(135deg, #f59e0b, #fbbf24)';
      case 'HIGH': return 'linear-gradient(135deg, #ef4444, #f87171)';
      default: return 'linear-gradient(135deg, #94a3b8, #cbd5e1)';
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
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.text,
        letterSpacing: '0.3px'
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
        padding: '4px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
        background: style.bg,
        color: style.text,
        letterSpacing: '0.3px'
      }}>
        {style.label}
      </span>
    );
  };

  const displayValue = (value) => (value !== null && value !== undefined && value !== '') ? value : 'N/A';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>Calculating IEC 62874 assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '20px',
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>❌</span>
          <div>
            <div style={{ fontWeight: '600' }}>Error</div>
            <div style={{ fontSize: '14px' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <p style={{ color: '#64748b', fontSize: '16px' }}>No data available. Run the assessment to see results.</p>
        <button
          onClick={calculateIECStatus}
          style={{
            marginTop: '16px',
            padding: '10px 32px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
          }}
        >
          🔄 Calculate
        </button>
      </div>
    );
  }

  const transformerDetails = asset?.transformer || {};
  const assetDetails = asset || {};
  const ref2FAL = result.reference_2FAL || {};
  const refCO2 = result.reference_CO2 || {};
  const co2Data = result.test_history ? result.test_history.filter(d => d.co2 !== null) : [];
  const falData = result.test_history ? result.test_history.filter(d => d.fal !== null) : [];

  // Score mapping for final decision
  const scoreMap = { LOW: 85, TYPICAL: 50, HIGH: 20 };
  const score = scoreMap[result.final_decision] || 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header with gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: '600' }}>
            IEC TR 62874:2015 Assessment
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '14px' }}>
            {result.transformer} • {result.age_years} years ({result.age_category})
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={calculateIECStatus}
            style={{
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {iconMap.refresh} Refresh
          </button>
          {getValidationStatusBadge(result.validation?.status)}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>Total Tests</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{result.test_summary?.total_tests || 0}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>Valid Tests</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#10b981' }}>{result.test_summary?.valid_tests || 0}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>Invalid Tests</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#ef4444' }}>{result.test_summary?.invalid_tests || 0}</div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>Last Valid Test</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
            {result.test_summary?.valid_test_dates?.slice(-1)[0] || 'N/A'}
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Final Decision with Gauge */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: getStatusGradient(result.final_decision)
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748b' }}>Final Decision</h3>
            <span style={{ fontSize: '24px' }}>{iconMap.decision}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: getStatusColor(result.final_decision) }}>
            {result.final_decision}
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{
              height: '6px',
              background: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${score}%`,
                height: '100%',
                background: getStatusGradient(result.final_decision),
                borderRadius: '4px',
                transition: 'width 0.6s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Conservative per Clause 6.2</p>
        </div>

        {/* 2-FAL Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748b' }}>2-FAL (Furan)</h3>
            <span style={{ fontSize: '24px' }}>{iconMap.fal}</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
            {result['latest_2FAL_mg/kg'] !== null ? `${result['latest_2FAL_mg/kg']} mg/kg` : 'N/A'}
          </div>
          <div style={{ marginTop: '6px' }}>{getStatusBadge(result['2FAL_status'])}</div>
          {ref2FAL.C90 !== undefined && (
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              C90: {ref2FAL.C90} • C98: {ref2FAL.C98}
              {ref2FAL.R90 && ` • R90: ${ref2FAL.R90}`}
              {ref2FAL.R98 && ` • R98: ${ref2FAL.R98}`}
            </div>
          )}
        </div>

        {/* CO2 Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748b' }}>CO₂ (DGA)</h3>
            <span style={{ fontSize: '24px' }}>{iconMap.co2}</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
            {result['latest_CO2_μl/l'] !== null ? `${result['latest_CO2_μl/l']} μl/l` : 'N/A'}
          </div>
          <div style={{ marginTop: '6px' }}>{getStatusBadge(result['CO2_status'])}</div>
          {refCO2.C90 !== undefined && (
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              C90: {refCO2.C90} • C98: {refCO2.C98}
            </div>
          )}
        </div>

        {/* RoI Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', color: '#64748b' }}>Rate of Increase</h3>
            <span style={{ fontSize: '24px' }}>{iconMap.roi}</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
            {result['RoI_mg/kg_year'] !== null ? `${result['RoI_mg/kg_year']} mg/kg/yr` : 'N/A'}
          </div>
          <div style={{ marginTop: '6px' }}>{getStatusBadge(result['RoI_status'])}</div>
          {result.notes && (
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>{result.notes}</div>
          )}
        </div>
      </div>

      {/* Specifications (Collapsible) */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setShowSpecs(!showSpecs)}
        >
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {iconMap.specs} Transformer Specifications
          </h3>
          <span style={{ fontSize: '20px', color: '#94a3b8' }}>{showSpecs ? '▲' : '▼'}</span>
        </div>
        {showSpecs && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px 24px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0'
          }}>
            {Object.entries({
              'Asset Name': assetDetails.asset_name,
              'Asset Code': assetDetails.asset_code,
              'Manufacturer': assetDetails.manufacturer,
              'Model': assetDetails.model,
              'Serial Number': assetDetails.serial_number,
              'Commissioning Date': assetDetails.commissioning_date,
              'Transformer Type': transformerDetails.transformer_type,
              'Breathing': transformerDetails.breathing,
              'Oil Inhibition': transformerDetails.oil_inhibition,
              'Paper Type': transformerDetails.paper_type,
              'Power Rating (MVA)': transformerDetails.power_rating_mva,
              'HV Voltage (kV)': transformerDetails.hv_voltage_kv,
              'LV Voltage (kV)': transformerDetails.lv_voltage_kv,
              'Cooling Type': transformerDetails.cooling_type,
              'Vector Group': transformerDetails.vector_group,
              'Frequency (Hz)': transformerDetails.frequency_hz
            }).map(([label, value]) => (
              <div key={label}>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>{label}</div>
                <div style={{ fontWeight: '500', color: '#0f172a' }}>{displayValue(value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Summary */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#0f172a' }}>📋 Test Summary</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Total</span><br /><strong style={{ fontSize: '20px' }}>{result.test_summary?.total_tests || 0}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Valid</span><br /><strong style={{ fontSize: '20px', color: '#10b981' }}>{result.test_summary?.valid_tests || 0}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Invalid</span><br /><strong style={{ fontSize: '20px', color: '#ef4444' }}>{result.test_summary?.invalid_tests || 0}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>First Valid</span><br /><strong>{result.test_summary?.valid_test_dates?.[0] || 'N/A'}</strong></div>
          <div><span style={{ color: '#64748b', fontSize: '13px' }}>Last Valid</span><br /><strong>{result.test_summary?.valid_test_dates?.slice(-1)[0] || 'N/A'}</strong></div>
        </div>
        {result.test_summary?.invalid_test_dates?.length > 0 && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>
            <strong>Invalid tests:</strong> {result.test_summary.invalid_test_dates.join(', ')}
            <br />
            <span style={{ fontSize: '12px' }}>{result.test_summary.invalid_test_reasons?.[0]}</span>
          </div>
        )}
      </div>

      {/* Charts */}
      {result.test_history && result.test_history.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#0f172a' }}>Trend Analysis with Reference Limits</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b' }}>CO₂ Trend</h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={co2Data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis label={{ value: 'μl/l', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 12 } }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="co2" stroke="#667eea" strokeWidth={2} dot={{ r: 4, fill: '#667eea' }} />
                  {refCO2.C90 !== undefined && (
                    <ReferenceLine y={refCO2.C90} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `C90 (${refCO2.C90})`, fill: '#f59e0b', fontSize: 11, position: 'right' }} />
                  )}
                  {refCO2.C98 !== undefined && (
                    <ReferenceLine y={refCO2.C98} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `C98 (${refCO2.C98})`, fill: '#ef4444', fontSize: 11, position: 'right' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                <span style={{ color: '#f59e0b' }}>--- C90</span> • <span style={{ color: '#ef4444' }}>--- C98</span>
              </div>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b' }}>2-FAL Trend</h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={falData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis label={{ value: 'mg/kg', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 12 } }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="fal" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
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
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
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
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>{iconMap.warning}</span>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#92400e' }}>Warnings</h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f', fontSize: '13px' }}>
            {result.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default IEC62874;