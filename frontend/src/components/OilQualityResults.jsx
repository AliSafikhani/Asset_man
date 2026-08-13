// frontend/src/components/OilQualityResults.jsx
//
// Full-screen "Analyze" dashboard for a single transformer Oil Quality test,
// faithful to the target mockup. Fed by GET
// /oil-quality/transformer/{id}/assess/{test_result_id}. Renders the IEC 60422
// condition assessment, IEC 60296 new-oil acceptance, compliance route,
// coverage, priority actions, recommendations, and an embedded trend section.

import { useState } from 'react';
import { TrendChart, DangerousTrendsTable } from './OilQualityTrend';
import {
  badge60422, badge60296, RISK_COLORS, FINAL_REC_COLORS, REC_LEVEL_COLORS,
  GROUP_LABELS, trendArrow,
} from '../constants/oilQualityConstants';

const fmtVal = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3);
  return String(v);
};

const OilQualityResults = ({ data, onClose }) => {
  const d = data || {};
  const equipment = d.equipment || {};
  const routing = d.routing || {};
  const r422 = d.iec60422 || {};
  const r296 = d.iec60296 || {};
  const trend = d.trend || {};
  const summary = d.summary || {};
  const priority = d.priority_actions || {};
  const sample = d.sample || {};

  const [group, setGroup] = useState('all'); // parameter-assessment tab
  const [showAllRecs, setShowAllRecs] = useState(false);

  // Trend arrow per parameter (for the assessment table mini-trend column).
  const trendByParam = {};
  (trend.parameters || []).forEach((p) => { trendByParam[p.parameter] = p; });

  const results422 = r422.results || [];
  const filtered = group === 'all' ? results422 : results422.filter((r) => r.group === group);

  const counts422 = r422.counts || {};
  const cov = r422.coverage || {};
  const finalRec = summary.final_recommendation || 'NO ACTION';
  const finalRecColor = (FINAL_REC_COLORS[finalRec] || { color: '#475569' }).color;
  const condBadge = badge60422(r422.final_status);
  const riskBadge = RISK_COLORS[String(summary.trend_risk || 'NORMAL').toUpperCase()] || RISK_COLORS.NORMAL;

  const recs = r422.recommendations || [];
  const shownRecs = showAllRecs ? recs : recs.slice(0, 5);

  // ---- Styles ----
  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' },
    modal: { background: '#f8fafc', borderRadius: '12px', width: '100%', maxWidth: '1280px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', color: '#0f172a' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#fff', borderRadius: '12px 12px 0 0', position: 'sticky', top: 0, zIndex: 2 },
    title: { fontSize: '20px', fontWeight: 800, margin: 0, color: '#1e293b' },
    subtitle: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    closeBtn: { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '18px', cursor: 'pointer', color: '#64748b', width: '34px', height: '34px' },
    body: { padding: '20px 24px' },
    card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' },
    cardTitle: { fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', fontSize: '13px' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' },
    twoCol: { display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '18px', marginBottom: '18px' },
    th: { padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 700, borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', whiteSpace: 'nowrap' },
    td: { padding: '8px 10px', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
    pill: (b) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: b.bg, color: b.color }),
    tab: (on) => ({ padding: '5px 14px', borderRadius: '999px', border: '1px solid #e2e8f0', background: on ? '#2563eb' : '#f1f5f9', color: on ? '#fff' : '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: on ? 600 : 500 }),
    metaItem: { fontSize: '13px', padding: '3px 0', display: 'flex', gap: '8px' },
    metaLabel: { color: '#64748b', minWidth: '130px' },
    metaVal: { color: '#0f172a', fontWeight: 600 },
    bigStatus: { fontSize: '26px', fontWeight: 800, lineHeight: 1.1 },
    countRow: { display: 'flex', gap: '14px', marginTop: '10px', flexWrap: 'wrap' },
    countBox: { textAlign: 'center' },
    countNum: { fontSize: '18px', fontWeight: 800 },
    countLbl: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase' },
    footer: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '10px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff', borderRadius: '0 0 12px 12px', position: 'sticky', bottom: 0, flexWrap: 'wrap' },
    footItem: { fontSize: '14px', color: '#475569' },
    section: { marginBottom: '18px' },
    sectionTitle: { fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '10px' },
    recRow: { display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' },
    linkBtn: { width: '100%', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', color: '#2563eb', fontSize: '13px', fontWeight: 600, marginTop: '8px' },
  };

  const sampleDate = sample.test_date ? new Date(sample.test_date).toLocaleDateString() : '—';

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h3 style={s.title}>Transformer Oil Quality Control</h3>
            <div style={s.subtitle}>IEC 60296 &amp; IEC 60422:2024 Assessment</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Sample Date</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{sampleDate}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Data Quality</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>{r422.confidence ?? 0}%</div>
            </div>
            <button style={s.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={s.body}>
          {/* Sample & Equipment */}
          <div style={{ ...s.card, marginBottom: '18px' }}>
            <div style={s.cardTitle}>ℹ️ Sample &amp; Equipment</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <div style={s.metaItem}><span style={s.metaLabel}>Transformer</span><span style={s.metaVal}>{equipment.asset_name || '—'}</span></div>
                <div style={s.metaItem}><span style={s.metaLabel}>Asset Code</span><span style={s.metaVal}>{equipment.asset_code || '—'}</span></div>
                <div style={s.metaItem}><span style={s.metaLabel}>Laboratory</span><span style={s.metaVal}>{sample.lab_name || '—'}</span></div>
              </div>
              <div>
                <div style={s.metaItem}><span style={s.metaLabel}>Operating State</span><span style={s.metaVal}>{String(routing.operating_state || '').replace(/_/g, ' ')}</span></div>
                <div style={s.metaItem}><span style={s.metaLabel}>Equipment Category</span><span style={s.metaVal}>Category {equipment.category}</span></div>
                <div style={s.metaItem}><span style={s.metaLabel}>Oil Type</span><span style={s.metaVal}>{equipment.oil_type || '—'}</span></div>
              </div>
              <div>
                <div style={s.metaItem}><span style={s.metaLabel}>Standard Routing</span><span style={s.metaVal}>{r422.standard} › {r422.ruleset}</span></div>
                <div style={s.metaItem}><span style={s.metaLabel}>HV Rating</span><span style={s.metaVal}>{equipment.hv_voltage_kv != null ? `${equipment.hv_voltage_kv} kV` : '—'}</span></div>
                <div style={s.metaItem}><span style={s.metaLabel}>Parameters Loaded</span><span style={s.metaVal}>{counts422.evaluated ?? 0}</span></div>
              </div>
            </div>
          </div>

          {/* Four summary cards */}
          <div style={s.grid4}>
            <div style={s.card}>
              <div style={s.cardTitle}>Overall Oil Condition</div>
              <div style={{ ...s.bigStatus, color: condBadge.color }}>{r422.final_status || 'UNKNOWN'}</div>
              <div style={s.countRow}>
                <div style={s.countBox}><div style={{ ...s.countNum, color: '#2563eb' }}>{r422.confidence ?? 0}%</div><div style={s.countLbl}>Confidence</div></div>
                <div style={s.countBox}><div style={s.countNum}>{counts422.evaluated ?? 0}</div><div style={s.countLbl}>Evaluated</div></div>
                <div style={s.countBox}><div style={{ ...s.countNum, color: '#16a34a' }}>{counts422.good ?? 0}</div><div style={s.countLbl}>Good</div></div>
                <div style={s.countBox}><div style={{ ...s.countNum, color: '#d97706' }}>{counts422.fair ?? 0}</div><div style={s.countLbl}>Fair</div></div>
                <div style={s.countBox}><div style={{ ...s.countNum, color: '#dc2626' }}>{counts422.poor ?? 0}</div><div style={s.countLbl}>Poor</div></div>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>Compliance Route</div>
              <div style={s.row}><span style={{ color: '#64748b' }}>Operating State</span><span style={{ fontWeight: 700, color: '#2563eb' }}>{String(routing.operating_state || '').replace(/_/g, ' ').toUpperCase()}</span></div>
              <div style={s.row}><span style={{ color: '#64748b' }}>Category</span><span style={{ fontWeight: 700, color: '#2563eb' }}>{equipment.category}</span></div>
              <div style={s.row}><span style={{ color: '#64748b' }}>Ruleset</span><span style={{ fontWeight: 700, color: '#2563eb' }}>{r422.ruleset}</span></div>
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>Test Group Coverage</div>
              {['routine', 'complementary', 'special'].map((k) => (
                <div key={k} style={s.row}>
                  <span style={{ color: '#64748b' }}>{GROUP_LABELS[k]}</span>
                  <span style={{ fontWeight: 700 }}>{(cov[k]?.evaluated ?? 0)} / {(cov[k]?.total ?? 0)}</span>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>Priority Actions</div>
              <div style={s.countRow}>
                <div style={s.countBox}><div style={{ ...s.countNum, color: '#dc2626' }}>{priority.action ?? 0}</div><div style={s.countLbl}>Action</div></div>
                <div style={s.countBox}><div style={{ ...s.countNum, color: '#d97706' }}>{priority.attention ?? 0}</div><div style={s.countLbl}>Attention</div></div>
                <div style={s.countBox}><div style={{ ...s.countNum, color: '#dc2626' }}>{priority.dangerous_trends ?? 0}</div><div style={s.countLbl}>Dangerous Trends</div></div>
              </div>
            </div>
          </div>

          {/* Parameter assessment + recommendations */}
          <div style={s.twoCol}>
            <div style={s.card}>
              <div style={s.cardTitle}>Parameter Assessment — {r422.standard} {r422.ruleset}</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {['all', 'routine', 'complementary', 'special'].map((k) => (
                  <button key={k} style={s.tab(group === k)} onClick={() => setGroup(k)}>
                    {k === 'all' ? 'All' : GROUP_LABELS[k]}
                  </button>
                ))}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={s.th}>Parameter</th>
                      <th style={s.th}>Measured</th>
                      <th style={s.th}>Unit</th>
                      <th style={s.th}>Good Range</th>
                      <th style={s.th}>Status</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td style={s.td} colSpan={6}>No parameters in this group.</td></tr>
                    ) : filtered.map((r) => {
                      const b = badge60422(r.status);
                      const tp = trendByParam[r.parameter];
                      const ta = tp ? trendArrow(tp.slope_per_year, tp.dangerous) : null;
                      return (
                        <tr key={r.parameter}>
                          <td style={s.td}>{r.display}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{fmtVal(r.value)}</td>
                          <td style={s.td}>{r.unit || '—'}</td>
                          <td style={s.td}>{r.good_range || '—'}</td>
                          <td style={s.td}><span style={s.pill(b)}>{b.label}</span></td>
                          <td style={{ ...s.td, textAlign: 'center', color: ta?.color, fontSize: '16px', fontWeight: 700 }}>{ta ? ta.arrow : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardTitle}>Recommendations</div>
              {recs.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#16a34a' }}>✅ No action items — all evaluated parameters are within the NORMAL band.</div>
              ) : (
                <>
                  {shownRecs.map((r, i) => {
                    const lvl = REC_LEVEL_COLORS[String(r.status).toUpperCase()] || REC_LEVEL_COLORS.ATTENTION;
                    return (
                      <div key={`${r.parameter}-${i}`} style={s.recRow}>
                        <span style={s.pill(lvl)}>{lvl.label}</span>
                        <span style={{ color: '#334155' }}>{r.recommendation || r.display}</span>
                      </div>
                    );
                  })}
                  {recs.length > 5 && (
                    <button style={s.linkBtn} onClick={() => setShowAllRecs((v) => !v)}>
                      {showAllRecs ? 'Show fewer' : `View all recommendations (${recs.length}) ›`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* IEC 60296 new-oil acceptance */}
          <div style={{ ...s.card, ...s.section }}>
            <div style={s.cardTitle}>
              IEC 60296 — New-oil Acceptance (Type {r296.oil_type})
              <span style={{ marginLeft: '10px', ...s.pill(badge60296(r296.final_status)) }}>{badge60296(r296.final_status).label}</span>
              <span style={{ marginLeft: '8px', fontWeight: 500, color: '#94a3b8', textTransform: 'none' }}>
                {(r296.counts?.ok ?? 0)} OK · {(r296.counts?.fair ?? 0)} fair · {(r296.counts?.not_ok ?? 0)} not-OK / {(r296.counts?.total ?? 0)}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={s.th}>Category</th>
                    <th style={s.th}>Parameter</th>
                    <th style={s.th}>Measured</th>
                    <th style={s.th}>Unit</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(r296.results || []).map((r, i) => {
                    const b = badge60296(r.status);
                    return (
                      <tr key={`${r.parameter}-${i}`}>
                        <td style={s.td}>{r.category}</td>
                        <td style={s.td}>{r.display}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>{fmtVal(r.value)}</td>
                        <td style={s.td}>{r.unit || '—'}</td>
                        <td style={s.td}><span style={s.pill(b)}>{b.label}</span></td>
                        <td style={{ ...s.td, color: '#64748b' }}>{r.reason || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trend analysis + dangerous trends */}
          <div style={s.twoCol}>
            <div style={s.card}>
              <div style={s.cardTitle}>Trend Analysis</div>
              <TrendChart parameters={trend.parameters} />
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Dangerous Trends</div>
              <DangerousTrendsTable dangerousTrends={trend.dangerous_trends} />
            </div>
          </div>
        </div>

        {/* Footer summary bar */}
        <div style={s.footer}>
          <div style={s.footItem}>🧪 Current sample: <span style={{ fontWeight: 800, color: condBadge.color }}>{summary.sample_condition || r422.final_status}</span></div>
          <div style={s.footItem}>📈 Trend risk: <span style={{ fontWeight: 800, color: riskBadge.color }}>{summary.trend_risk}</span></div>
          <div style={s.footItem}>⚠️ Final recommendation: <span style={{ fontWeight: 800, color: finalRecColor }}>{finalRec}</span></div>
        </div>
      </div>
    </div>
  );
};

export default OilQualityResults;
