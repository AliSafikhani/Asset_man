// frontend/src/components/OilQualityTrend.jsx
//
// IEC 60422:2024 trend-analysis modal for a transformer's Oil Quality test
// series. Fed by GET /oil-quality/transformer/{id}/trend. Exports two reusable
// sub-components (TrendChart, DangerousTrendsTable) that the analyze dashboard
// (OilQualityResults) embeds, plus the default full-screen modal.

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { RISK_COLORS, trendArrow } from '../constants/oilQualityConstants';

// Build recharts rows: measured value + the allowed trajectory (first value
// drifting at the annual limit rate). If the measured line is steeper than the
// allowed line, the parameter is flagged dangerous by the backend.
function buildChartData(param) {
  const series = param.series || [];
  if (!series.length) return [];
  const limitPerYear = Number(param.limit_per_year);
  const hasLimit = Number.isFinite(limitPerYear);

  const parsed = series.map((pt) => {
    const t = Date.parse(pt.date);
    return { raw: pt.date, t: Number.isNaN(t) ? null : t, value: Number(pt.value) };
  });
  const t0 = parsed.find((p) => p.t != null)?.t ?? null;
  const v0 = parsed[0].value;

  return parsed.map((p, i) => {
    let years = i; // fall back to index if dates unusable
    if (t0 != null && p.t != null) years = (p.t - t0) / (365.25 * 24 * 3600 * 1000);
    const row = {
      label: p.raw ? new Date(p.raw).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : `#${i + 1}`,
      measured: p.value,
    };
    if (hasLimit) row.allowed = Number((v0 + limitPerYear * years).toFixed(4));
    return row;
  });
}

export const TrendChart = ({ parameters }) => {
  const [sel, setSel] = useState(0);
  const params = parameters || [];
  const active = params.length ? params[Math.min(sel, params.length - 1)] : null;
  const data = useMemo(() => (active ? buildChartData(active) : []), [active]);

  if (!params.length) {
    return <div style={{ padding: '20px', color: '#64748b', fontSize: '13px' }}>No parameter has enough points (min 2) for a trend.</div>;
  }
  const hasLimit = data.some((d) => 'allowed' in d);

  const tabStyle = (on) => ({
    padding: '5px 12px', borderRadius: '999px', border: '1px solid #e2e8f0',
    background: on ? '#2563eb' : '#f1f5f9', color: on ? '#fff' : '#475569',
    cursor: 'pointer', fontSize: '12px', fontWeight: on ? 600 : 500, whiteSpace: 'nowrap',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {params.map((p, i) => (
          <button key={p.parameter} style={tabStyle(i === sel)} onClick={() => setSel(i)}>
            {p.display}{p.dangerous ? ' ⚠️' : ''}
          </button>
        ))}
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#475569' }} />
            <YAxis tick={{ fontSize: 12, fill: '#475569' }}
              label={{ value: active.unit || '', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="measured" name="Measured Value" stroke="#2563eb"
              strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            {hasLimit && (
              <Line type="monotone" dataKey="allowed"
                name={`Allowed limit (${Number(active.limit_per_year) >= 0 ? '+' : ''}${active.limit_per_year} ${active.unit || ''}/yr)`}
                stroke="#dc2626" strokeWidth={2} strokeDasharray="6 4" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
        {active.description}
        {active.reference ? <span style={{ marginLeft: '6px', color: '#94a3b8' }}>({active.reference})</span> : null}
      </div>
    </div>
  );
};

export const DangerousTrendsTable = ({ dangerousTrends }) => {
  const rows = dangerousTrends || [];
  const th = { padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase' };
  const td = { padding: '8px 10px', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' };
  if (!rows.length) {
    return <div style={{ padding: '14px', color: '#16a34a', fontSize: '13px' }}>✅ No dangerous rate-of-change trends detected.</div>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Parameter</th>
            <th style={th}>Rate of Change</th>
            <th style={{ ...th, textAlign: 'center' }}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const { arrow, color } = trendArrow(r.slope_per_year, true);
            return (
              <tr key={r.parameter}>
                <td style={td}>{i + 1}</td>
                <td style={td}>{r.display}</td>
                <td style={{ ...td, fontWeight: 600 }}>{r.rate_of_change}</td>
                <td style={{ ...td, textAlign: 'center', color, fontSize: '18px', fontWeight: 700 }}>{arrow}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const OilQualityTrend = ({ data, onClose }) => {
  const trend = data || {};
  const risk = RISK_COLORS[String(trend.trend_risk || 'NORMAL').toUpperCase()] || RISK_COLORS.NORMAL;
  const eq = trend.equipment || {};

  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '24px', overflowY: 'auto' },
    modal: { background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '1000px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', color: '#0f172a' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#fff', borderRadius: '12px 12px 0 0', zIndex: 1 },
    title: { fontSize: '18px', fontWeight: 700, margin: 0 },
    subtitle: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' },
    body: { padding: '20px 24px' },
    section: { marginBottom: '22px' },
    sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '10px' },
    riskPill: { display: 'inline-block', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, background: risk.bg, color: risk.color },
    recRow: { display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' },
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <h3 style={s.title}>Oil Quality Trend Analysis</h3>
            <div style={s.subtitle}>
              {trend.standard || 'IEC 60422:2024 (trend)'} · {eq.asset_code || eq.asset_name || `Asset ${eq.asset_id ?? ''}`}
              {eq.category ? ` · Category ${eq.category}` : ''} · {trend.sample_count ?? 0} samples
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.body}>
          <div style={s.section}>
            <div style={s.sectionTitle}>Trend Risk</div>
            <span style={s.riskPill}>{String(trend.trend_risk || 'NORMAL').toUpperCase()}</span>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Rate-of-change chart</div>
            <TrendChart parameters={trend.parameters} />
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Dangerous Trends</div>
            <DangerousTrendsTable dangerousTrends={trend.dangerous_trends} />
          </div>

          {(trend.recommendations || []).length > 0 && (
            <div style={s.section}>
              <div style={s.sectionTitle}>Recommendations</div>
              {trend.recommendations.map((r) => (
                <div key={r.parameter} style={s.recRow}>
                  <span style={{ fontWeight: 600, minWidth: '160px' }}>{r.display}</span>
                  <span style={{ color: '#475569' }}>{r.recommendation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OilQualityTrend;
