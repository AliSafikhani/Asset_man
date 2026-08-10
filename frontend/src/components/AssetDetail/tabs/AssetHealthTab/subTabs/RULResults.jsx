import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { getRUL } from '../../../../../api/rul';

// Cap points sent to Recharts; hourly history can be hundreds of thousands.
const MAX_CHART_POINTS = 600;

// Evenly downsample parallel time-series arrays into chart-row objects.
const buildChartData = (ts) => {
  if (!ts || !ts.timestamps || !ts.timestamps.length) return [];
  const n = ts.timestamps.length;
  const step = Math.max(1, Math.ceil(n / MAX_CHART_POINTS));
  const rows = [];
  for (let i = 0; i < n; i += step) {
    rows.push({
      t: ts.timestamps[i],
      hot_spot: ts.hot_spot_temperature?.[i] ?? null,
      top_oil: ts.top_oil_temperature?.[i] ?? null,
      ambient: ts.ambient_temperature?.[i] ?? null,
      faa: ts.faa?.[i] ?? null,
      load_factor: ts.load_factor?.[i] ?? null,
    });
  }
  return rows;
};

const fmtDate = (iso) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString();
};

const num = (v, digits = 1) =>
  v === null || v === undefined || isNaN(v) ? 'N/A' : Number(v).toFixed(digits);

// Green → amber → red by remaining-life fraction of design life.
const lifeColor = (remaining, design) => {
  if (!design) return '#10b981';
  const frac = remaining / design;
  if (frac >= 0.33) return '#10b981';
  if (frac >= 0.15) return '#f59e0b';
  return '#ef4444';
};

// ---- Small presentational building blocks ----
const Card = ({ children, style }) => (
  <div
    style={{
      background: 'white',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      ...style,
    }}
  >
    {children}
  </div>
);

const StatCard = ({ label, value, sub, valueColor = '#0f172a', icon }) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 14, color: '#64748b' }}>{label}</h3>
      {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: valueColor }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{sub}</div>}
  </Card>
);

// Reusable trend figure: one card, a titled line chart, N series and an
// optional horizontal reference line (nominal / limit).
const TrendChart = ({ title, data, series, height = 260, refLine }) => (
  <Card>
    <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b' }}>{title}</h4>
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={fmtDate} minTickGap={40} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['auto', 'auto']} />
        <Tooltip labelFormatter={fmtDate} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
        <Legend verticalAlign="top" height={36} />
        {refLine && (
          <ReferenceLine
            y={refLine.y}
            stroke={refLine.color}
            strokeDasharray="5 5"
            label={{ value: refLine.label, fill: refLine.color, fontSize: 11, position: 'right' }}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={s.width || 2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </Card>
);

const RULResults = ({ asset, assetId, refreshKey, onConfigure }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [needsConfig, setNeedsConfig] = useState(false);

  const run = useCallback(async () => {
    if (!assetId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setNeedsConfig(false);
    try {
      const res = await getRUL(assetId);
      if (res.status === 'not_configured') {
        setNeedsConfig(true);
      } else if (res.status === 'success') {
        setResult(res.data);
      } else {
        setError('Unexpected response format');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to run RUL assessment');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    // run is stable per assetId; refreshKey bumps on save to force a re-run.
    run();
  }, [run, refreshKey]);

  // ---- Loading ----
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Running IEC 60076-7 thermal-life assessment…</p>
        </div>
      </div>
    );
  }

  // ---- Signals not configured ----
  if (needsConfig) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
        <p style={{ color: '#0f172a', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
          Signals not configured
        </p>
        <p style={{ color: '#64748b', fontSize: 14, maxWidth: 440, margin: '0 auto 20px' }}>
          Map the Top Oil and Ambient temperature signals (and optionally Load Current) in the
          Settings tab before running the assessment.
        </p>
        <button
          onClick={onConfigure}
          style={{
            padding: '10px 28px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 6px rgba(16,185,129,0.3)',
          }}
        >
          ⚙️ Go to Settings
        </button>
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 20,
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>❌</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Error</div>
            <div style={{ fontSize: 14 }}>{error}</div>
          </div>
          <button
            onClick={run}
            style={{
              padding: '8px 18px',
              background: 'white',
              border: '1px solid #fecaca',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#991b1b',
              fontWeight: 600,
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // ---- Empty ----
  if (!result) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p style={{ color: '#64748b', fontSize: 16 }}>No data available. Run the assessment.</p>
        <button
          onClick={run}
          style={{
            marginTop: 16,
            padding: '10px 32px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          🔄 Run Assessment
        </button>
      </div>
    );
  }

  // ---- Populated ----
  const info = result.transformer_info || {};
  const overall = result.overall_remaining_life || {};
  const thermal = result.current_thermal_state || {};
  const dyn = result.life_estimation?.dynamic_gradient || {};
  const load = result.life_estimation?.load_current || {};
  const comparison = result.comparison || {};
  const recommendations = result.recommendations || [];
  const alerts = result.alerts || {};
  const summary = result.data_summary || {};
  const chartData = buildChartData(result.time_series);
  // Load-factor series is only present when a current signal is mapped and
  // the transformer has rated MVA/kV (so rated current can be derived).
  const hasLoadFactor = chartData.some((r) => r.load_factor != null);

  const remaining = overall.remaining_life_years;
  const design = overall.design_life_years;
  const usedPct = Math.min(100, Math.max(0, overall.life_used_percent || 0));
  const remColor = lifeColor(remaining, design);

  const loadSkipped = !!load.skipped;

  const activeAlerts = Object.entries(alerts).filter(([, v]) => v);

  const alertLabels = {
    hot_spot_exceeded_120: 'Hot-spot exceeded 120°C',
    faa_exceeded_10: 'Ageing rate FAA exceeded 10',
    remaining_life_less_than_5: 'Remaining life below 5 years',
    load_factor_exceeded_1_3: 'Load factor exceeded 1.3 pu',
    top_oil_exceeded_95: 'Top oil exceeded 95°C',
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: 16,
          padding: '24px 32px',
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: 24, fontWeight: 600 }}>
            IEC 60076-7 Thermal Life (RUL)
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>
            {info.transformer_id || asset?.asset_name} • {num(info.age_years)} yrs •{' '}
            {info.cooling_type || 'N/A'} • {info.insulation_type}
          </p>
        </div>
        <button
          onClick={run}
          style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Active alerts banner */}
      {activeAlerts.length > 0 && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <h3 style={{ margin: 0, fontSize: 15, color: '#991b1b' }}>Active Alerts</h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: 22, color: '#991b1b', fontSize: 13 }}>
            {activeAlerts.map(([k]) => (
              <li key={k}>{alertLabels[k] || k}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Overall life row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Remaining life with bar */}
        <Card style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: remColor,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, color: '#64748b' }}>Remaining Life</h3>
            <span style={{ fontSize: 22 }}>⏳</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: remColor }}>
            {num(remaining)} <span style={{ fontSize: 16, color: '#94a3b8' }}>yrs</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${usedPct}%`,
                  height: '100%',
                  background: remColor,
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              <span>{num(usedPct, 0)}% used</span>
              <span>of {num(design, 0)} yr design</span>
            </div>
          </div>
        </Card>

        <StatCard
          label="Life Consumed"
          value={`${num(overall.total_elapsed_life_years)} yrs`}
          sub={`${num(usedPct, 1)}% of design life`}
          icon="📉"
        />
        <StatCard
          label="Current Hot-Spot"
          value={`${num(thermal.hot_spot_current)} °C`}
          sub={`Top oil ${num(thermal.top_oil_current)} °C • Ambient ${num(thermal.ambient_current)} °C`}
          valueColor={thermal.hot_spot_current > 110 ? '#ef4444' : '#0f172a'}
          icon="🌡️"
        />
        <StatCard
          label="Current Ageing (FAA)"
          value={num(thermal.faa_current, 2)}
          sub={
            thermal.load_factor_current != null
              ? `Load factor ${num(thermal.load_factor_current, 2)} pu`
              : 'Load factor N/A'
          }
          valueColor={thermal.faa_current > 5 ? '#ef4444' : '#0f172a'}
          icon="🔥"
        />
      </div>

      {/* Method comparison */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Method 1 */}
        <Card>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#0f172a' }}>
            🧮 Method 1 — Dynamic Gradient
          </h3>
          <div style={{ fontSize: 13, color: '#475569', display: 'grid', gap: 8 }}>
            <Row label="Consumed life" value={`${num(dyn.consumed_life_years, 2)} yrs`} />
            <Row label="Remaining life" value={`${num(dyn.remaining_life_years, 2)} yrs`} />
            <Row label="Average FAA" value={num(dyn.average_faa, 3)} />
            <Row label="Max hot-spot" value={`${num(dyn.max_hotspot_temp)} °C`} />
            <Row label="Max top-oil" value={`${num(dyn.max_top_oil_temp)} °C`} />
            {dyn.max_load_factor != null && (
              <Row label="Max load factor" value={`${num(dyn.max_load_factor, 2)} pu`} />
            )}
          </div>
        </Card>

        {/* Method 2 */}
        <Card>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#0f172a' }}>
            ⚡ Method 2 — Load Current
          </h3>
          {loadSkipped ? (
            <div style={{ fontSize: 13, color: '#94a3b8', paddingTop: 8 }}>
              {load.skipped}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#475569', display: 'grid', gap: 8 }}>
              <Row label="Consumed life" value={`${num(load.consumed_life_years, 2)} yrs`} />
              <Row label="Remaining life" value={`${num(load.remaining_life_years, 2)} yrs`} />
              <Row label="Average FAA" value={num(load.average_faa, 3)} />
              <Row label="Max hot-spot" value={`${num(load.max_hotspot_temp)} °C`} />
              <Row label="Loss ratio R" value={num(load.loss_ratio_R_used, 2)} />
            </div>
          )}
        </Card>

        {/* Agreement */}
        <Card>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#0f172a' }}>🎯 Agreement</h3>
          {comparison.status ? (
            <>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: comparison.status.startsWith('Excellent')
                    ? '#10b981'
                    : comparison.status.startsWith('Warning')
                    ? '#f59e0b'
                    : '#ef4444',
                }}
              >
                {num(comparison.difference_percent, 1)}%
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{comparison.status}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                Δ {num(comparison.difference_years, 2)} yrs between methods
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#94a3b8', paddingTop: 8 }}>
              Comparison unavailable (Method 2 requires a load-current signal and rated data).
            </div>
          )}
        </Card>
      </div>

      {/* Trend charts */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 18, color: '#0f172a' }}>Thermal Trends</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
            {/* 1 — Raw signals: Top Oil & Ambient */}
            <TrendChart
              title="Raw Signals — Top Oil & Ambient (°C)"
              data={chartData}
              height={280}
              series={[
                { key: 'top_oil', name: 'Top Oil', color: '#f59e0b' },
                { key: 'ambient', name: 'Ambient', color: '#3b82f6', width: 1.5 },
              ]}
            />

            {/* 2 — FAA vs nominal (1.0) */}
            <TrendChart
              title="Ageing Acceleration Factor (FAA)"
              data={chartData}
              height={280}
              refLine={{ y: 1, color: '#94a3b8', label: 'FAA nominal (1.0)' }}
              series={[{ key: 'faa', name: 'FAA', color: '#8b5cf6' }]}
            />

            {/* 3 — Load factor */}
            {hasLoadFactor ? (
              <TrendChart
                title="Load Factor (pu)"
                data={chartData}
                height={280}
                refLine={{ y: 1, color: '#94a3b8', label: 'Rated (1.0)' }}
                series={[{ key: 'load_factor', name: 'Load Factor', color: '#10b981' }]}
              />
            ) : (
              <Card>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#64748b' }}>Load Factor (pu)</h4>
                <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '0 24px' }}>
                  No load-factor trend — map a Load Current signal in Settings and ensure the
                  transformer has rated MVA/kV on its nameplate.
                </div>
              </Card>
            )}

            {/* 4 — Hot-spot vs limit (110°C) */}
            <TrendChart
              title="Hot-Spot Temperature (°C)"
              data={chartData}
              height={280}
              refLine={{ y: 110, color: '#ef4444', label: 'HS limit 110°C' }}
              series={[{ key: 'hot_spot', name: 'Hot-spot', color: '#ef4444' }]}
            />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            {summary.hours_used ? `${summary.hours_used.toLocaleString()} hourly samples` : ''}
            {summary.start ? ` • ${fmtDate(summary.start)} → ${fmtDate(summary.end)}` : ''}
            {chartData.length < (result.time_series?.timestamps?.length || 0)
              ? ` • downsampled to ${chartData.length} points`
              : ''}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>📋 Recommendations</h3>
          <ul style={{ margin: 0, paddingLeft: 22, color: '#334155', fontSize: 14, lineHeight: 1.7 }}>
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

// Inline label/value row helper for the method cards.
const Row = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: '#94a3b8' }}>{label}</span>
    <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
  </div>
);

export default RULResults;
