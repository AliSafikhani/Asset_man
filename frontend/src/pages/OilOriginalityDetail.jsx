// frontend/src/pages/OilOriginalityDetail.jsx
// Detail / report page for one oil-originality analysis. Replicates the
// "Transformer Oil Authenticity Assessment — DSC & DTA Reference Comparison"
// mock: sample info, final verdict, per-method assessments, curve-comparison
// charts (reference vs sample), extracted-feature tables and a decision summary.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { oilOriginalityAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  FaArrowLeft, FaShieldAlt, FaFlask, FaCheckCircle, FaExclamationTriangle,
  FaTimesCircle, FaCalendarAlt, FaChartLine, FaTable, FaClipboardCheck,
  FaThermometerHalf,
} from 'react-icons/fa';

// DSC / DTA rule limits (mirror the backend thresholds) used in the feature tables.
const DSC_LIMITS = { delta_tonset: 10, delta_tmax: 5, delta_area: 20 };
const DTA_LIMITS = { delta_tonset: 10, delta_tmax: 8, delta_delta_t: 2 };

const STATUS_META = {
  original:   { label: 'ORIGINAL',   color: '#10b981', bg: '#d1fae5', icon: FaCheckCircle },
  suspicious: { label: 'SUSPICIOUS', color: '#f59e0b', bg: '#fef3c7', icon: FaExclamationTriangle },
  fake:       { label: 'FAKE',       color: '#ef4444', bg: '#fee2e2', icon: FaTimesCircle },
};

const meta = (s) => STATUS_META[s] || { label: (s || 'N/A').toUpperCase(), color: '#94a3b8', bg: '#f1f5f9', icon: FaFlask };
const fmt = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(d));

// Build recharts rows from the aligned curve pair (shared temperature axis).
function toChartData(curves) {
  if (!curves) return [];
  const t = curves.reference?.temperature || [];
  const refS = curves.reference?.signal || [];
  const sampleS = curves.sample?.signal || [];
  return t.map((temp, i) => ({
    temp: Number(temp),
    reference: refS[i] ?? null,
    sample: sampleS[i] ?? null,
  }));
}

function OilOriginalityDetail() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await oilOriginalityAPI.get(recordId);
        setRecord(res.data);
      } catch (error) {
        console.error('Error loading record:', error);
        toast.error('Failed to load analysis');
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId]);

  if (loading) {
    return <div style={styles.container}><div style={styles.loading}>Loading analysis…</div></div>;
  }
  if (!record) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Analysis not found.</div>
      </div>
    );
  }

  const result = record.result_data || {};
  const dsc = result.dsc || {};
  const dta = result.dta || {};
  const curves = result.curves || {};
  const dscDetails = record.dsc_details || {};
  const dtaDetails = record.dta_details || {};

  const finalMeta = meta(record.final_status);
  const FinalIcon = finalMeta.icon;
  const confidence = Math.round((1 - (record.total_score || 0) / 4) * 100);

  const dscChart = toChartData(curves.dsc);
  const dtaChart = toChartData(curves.dta);

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(`/oil-originality?plant_id=${record.plant_id}`)}>
          <FaArrowLeft size={16} />
        </button>
        <div>
          <h1 style={styles.title}>Transformer Oil Authenticity Assessment</h1>
          <p style={styles.subtitle}>DSC &amp; DTA Reference Comparison</p>
        </div>
      </div>

      {/* Top row: Sample info + Final result */}
      <div style={styles.topGrid}>
        {/* Sample information */}
        <div style={styles.card}>
          <div style={styles.cardTitle}><FaFlask size={15} color="#8b5cf6" /> Sample Information</div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Record #</span><span style={styles.infoValue}>{record.record_number}</span></div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Custom Name</span><span style={styles.infoValue}>{record.custom_name}</span></div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}><FaCalendarAlt size={11} /> Sample Date</span>
            <span style={styles.infoValue}>{fmtDate(record.sample_date)}</span>
          </div>
          <div style={styles.infoRow}><span style={styles.infoLabel}>Analyzed</span><span style={styles.infoValue}>{fmtDate(record.created_at)}</span></div>
          {record.notes && (
            <div style={styles.notesBox}><strong>Notes:</strong> {record.notes}</div>
          )}
        </div>

        {/* Final authenticity result */}
        <div style={{ ...styles.card, ...styles.finalCard, borderColor: finalMeta.color }}>
          <div style={styles.cardTitle}><FaShieldAlt size={15} color={finalMeta.color} /> Final Authenticity Result</div>
          <div style={styles.finalBody}>
            <div style={{ ...styles.finalShield, background: finalMeta.bg, color: finalMeta.color }}>
              <FinalIcon size={44} />
            </div>
            <div style={{ ...styles.finalStatus, color: finalMeta.color }}>{finalMeta.label}</div>
            <div style={styles.finalMetrics}>
              <div style={styles.finalMetric}>
                <span style={styles.finalMetricValue}>{record.total_score}</span>
                <span style={styles.finalMetricLabel}>Total Score</span>
              </div>
              <div style={styles.finalMetricDivider} />
              <div style={styles.finalMetric}>
                <span style={{ ...styles.finalMetricValue, color: finalMeta.color }}>{confidence}%</span>
                <span style={styles.finalMetricLabel}>Confidence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Method assessment cards */}
      <div style={styles.topGrid}>
        <AssessmentCard
          title="DSC Assessment"
          status={record.dsc_status}
          failCount={dsc.evaluation?.fail_count}
          rows={[
            { label: 'Δ Onset Temp', value: dscDetails.delta_tonset, limit: DSC_LIMITS.delta_tonset, unit: '°C' },
            { label: 'Δ Peak Temp', value: dscDetails.delta_tmax, limit: DSC_LIMITS.delta_tmax, unit: '°C' },
            { label: 'Δ Area', value: dscDetails.delta_area, limit: DSC_LIMITS.delta_area, unit: '%' },
          ]}
          strict
        />
        <AssessmentCard
          title="DTA Assessment"
          status={record.dta_status}
          failCount={dta.evaluation?.fail_count}
          rows={[
            { label: 'Δ Onset Temp', value: dtaDetails.delta_tonset, limit: DTA_LIMITS.delta_tonset, unit: '°C' },
            { label: 'Δ Peak Temp', value: dtaDetails.delta_tmax, limit: DTA_LIMITS.delta_tmax, unit: '°C' },
            { label: 'Δ Delta-T', value: dtaDetails.delta_delta_t, limit: DTA_LIMITS.delta_delta_t, unit: '' },
          ]}
        />
      </div>

      {/* Curve comparison charts */}
      <div style={styles.topGrid}>
        <CurveCard
          title="DSC Curve Comparison"
          data={dscChart}
          tonsetSample={dsc.sample?.tonset}
          tmaxSample={dsc.sample?.tmax}
          tonsetRef={dsc.reference?.tonset}
          tmaxRef={dsc.reference?.tmax}
          yLabel="Heat Flow"
        />
        <CurveCard
          title="DTA Curve Comparison"
          data={dtaChart}
          tonsetSample={dta.sample?.tonset}
          tmaxSample={dta.sample?.tmax}
          tonsetRef={dta.reference?.tonset}
          tmaxRef={dta.reference?.tmax}
          yLabel="ΔT Signal"
        />
      </div>

      {/* Extracted feature tables */}
      <div style={styles.topGrid}>
        <FeatureTable
          title="DSC Extracted Features"
          rows={[
            { p: 'Onset Temp (°C)', ref: dsc.reference?.tonset, sample: dsc.sample?.tonset, diff: dscDetails.delta_tonset, limit: DSC_LIMITS.delta_tonset },
            { p: 'Peak Temp (°C)', ref: dsc.reference?.tmax, sample: dsc.sample?.tmax, diff: dscDetails.delta_tmax, limit: DSC_LIMITS.delta_tmax },
            { p: 'Area (%)', ref: dsc.reference?.area, sample: dsc.sample?.area, diff: dscDetails.delta_area, limit: DSC_LIMITS.delta_area, diffIsPct: true },
          ]}
          strict
        />
        <FeatureTable
          title="DTA Extracted Features"
          rows={[
            { p: 'Onset Temp (°C)', ref: dta.reference?.tonset, sample: dta.sample?.tonset, diff: dtaDetails.delta_tonset, limit: DTA_LIMITS.delta_tonset },
            { p: 'Peak Temp (°C)', ref: dta.reference?.tmax, sample: dta.sample?.tmax, diff: dtaDetails.delta_tmax, limit: DTA_LIMITS.delta_tmax },
            { p: 'Delta-T', ref: dta.reference?.delta_t, sample: dta.sample?.delta_t, diff: dtaDetails.delta_delta_t, limit: DTA_LIMITS.delta_delta_t },
          ]}
        />
      </div>

      {/* Decision summary */}
      <DecisionSummary
        dscStatus={record.dsc_status}
        dtaStatus={record.dta_status}
        totalScore={record.total_score}
        finalStatus={record.final_status}
      />
    </div>
  );
}

// ---- Method assessment card ------------------------------------------------

function AssessmentCard({ title, status, failCount, rows, strict }) {
  const m = meta(status);
  const Icon = m.icon;
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}><FaThermometerHalf size={15} color={m.color} /> {title}</div>
      <div style={styles.assessTop}>
        <span style={{ ...styles.statusPill, background: m.bg, color: m.color }}><Icon size={13} /> {m.label}</span>
        <span style={styles.failCount}>{failCount ?? 0} rule{(failCount ?? 0) === 1 ? '' : 's'} failed</span>
      </div>
      <div style={styles.ruleList}>
        {rows.map((r) => {
          const failed = strict ? r.value > r.limit : r.value >= r.limit;
          return (
            <div key={r.label} style={styles.ruleRow}>
              <span style={styles.ruleLabel}>{r.label}</span>
              <span style={styles.ruleValue}>
                {fmt(r.value)}{r.unit} <span style={styles.ruleLimit}>/ {r.limit}{r.unit}</span>
              </span>
              <span style={{ ...styles.ruleBadge, background: failed ? '#fee2e2' : '#d1fae5', color: failed ? '#ef4444' : '#10b981' }}>
                {failed ? 'FAIL' : 'PASS'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Curve comparison chart ------------------------------------------------

function CurveCard({ title, data, tonsetSample, tmaxSample, tonsetRef, tmaxRef, yLabel }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}><FaChartLine size={15} color="#8b5cf6" /> {title}</div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis
            dataKey="temp" type="number" domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => Math.round(v)} tick={{ fontSize: 11, fill: '#94a3b8' }}
            label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
          <Tooltip formatter={(v) => (v === null ? '—' : Number(v).toFixed(3))} labelFormatter={(v) => `${Number(v).toFixed(1)} °C`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {tonsetRef != null && <ReferenceLine x={tonsetRef} stroke="#3b82f6" strokeDasharray="4 4" />}
          {tmaxRef != null && <ReferenceLine x={tmaxRef} stroke="#3b82f6" strokeDasharray="2 2" />}
          {tonsetSample != null && <ReferenceLine x={tonsetSample} stroke="#8b5cf6" strokeDasharray="4 4" />}
          {tmaxSample != null && <ReferenceLine x={tmaxSample} stroke="#8b5cf6" strokeDasharray="2 2" />}
          <Line type="monotone" dataKey="reference" name="Reference" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="sample" name="Sample" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Extracted-feature table ----------------------------------------------

function FeatureTable({ title, rows, strict }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}><FaTable size={15} color="#8b5cf6" /> {title}</div>
      <table style={styles.featTable}>
        <thead>
          <tr>
            <th style={styles.th}>Parameter</th>
            <th style={styles.thNum}>Reference</th>
            <th style={styles.thNum}>Sample</th>
            <th style={styles.thNum}>Difference</th>
            <th style={styles.thNum}>Limit</th>
            <th style={styles.thCenter}>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const failed = strict ? r.diff > r.limit : r.diff >= r.limit;
            return (
              <tr key={r.p}>
                <td style={styles.td}>{r.p}</td>
                <td style={styles.tdNum}>{fmt(r.ref)}</td>
                <td style={styles.tdNum}>{fmt(r.sample)}</td>
                <td style={styles.tdNum}>{fmt(r.diff)}{r.diffIsPct ? '%' : ''}</td>
                <td style={styles.tdNum}>{r.limit}{r.diffIsPct ? '%' : ''}</td>
                <td style={styles.tdCenter}>
                  <span style={{ ...styles.ruleBadge, background: failed ? '#fee2e2' : '#d1fae5', color: failed ? '#ef4444' : '#10b981' }}>
                    {failed ? 'FAIL' : 'PASS'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Decision summary ------------------------------------------------------

function DecisionSummary({ dscStatus, dtaStatus, totalScore, finalStatus }) {
  const score = (s) => ({ original: 0, suspicious: 1, fake: 2 }[s] ?? 0);
  const dscScore = score(dscStatus);
  const dtaScore = score(dtaStatus);
  const fm = meta(finalStatus);
  const consistent = dscStatus === dtaStatus;

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}><FaClipboardCheck size={15} color="#8b5cf6" /> Decision Summary</div>
      <div style={styles.legend}>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#10b981' }} /> Original = 0</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#f59e0b' }} /> Suspicious = 1</span>
        <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#ef4444' }} /> Fake = 2</span>
      </div>
      <div style={styles.scoreEquation}>
        <div style={styles.scoreBox}>
          <span style={{ ...styles.scoreValue, color: meta(dscStatus).color }}>{dscScore}</span>
          <span style={styles.scoreLabel}>DSC</span>
        </div>
        <span style={styles.scoreOp}>+</span>
        <div style={styles.scoreBox}>
          <span style={{ ...styles.scoreValue, color: meta(dtaStatus).color }}>{dtaScore}</span>
          <span style={styles.scoreLabel}>DTA</span>
        </div>
        <span style={styles.scoreOp}>=</span>
        <div style={{ ...styles.scoreBox, ...styles.scoreTotal, borderColor: fm.color }}>
          <span style={{ ...styles.scoreValue, color: fm.color }}>{totalScore}</span>
          <span style={styles.scoreLabel}>Total</span>
        </div>
        <span style={styles.scoreArrow}>→</span>
        <span style={{ ...styles.statusPill, background: fm.bg, color: fm.color, fontSize: '14px', padding: '8px 18px' }}>{fm.label}</span>
      </div>
      <div style={{ ...styles.consistencyMsg, background: consistent ? '#d1fae5' : '#fef3c7', color: consistent ? '#065f46' : '#92400e' }}>
        {consistent
          ? 'Both DSC and DTA methods agree on the verdict — high consistency.'
          : 'DSC and DTA methods differ — verdict derived from the combined score. Consider re-testing.'}
      </div>
      <div style={styles.thresholdNote}>
        Thresholds: total score ≥ 3 → Fake, ≥ 2 → Suspicious, otherwise Original.
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' },
  loading: { padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  backBtn: { width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' },
  topGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card: { background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  infoLabel: { fontSize: '13px', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
  notesBox: { marginTop: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#475569' },
  finalCard: { border: '2px solid', display: 'flex', flexDirection: 'column' },
  finalBody: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', padding: '8px 0' },
  finalShield: { width: '88px', height: '88px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  finalStatus: { fontSize: '28px', fontWeight: '800', letterSpacing: '1px' },
  finalMetrics: { display: 'flex', alignItems: 'center', gap: '24px', marginTop: '8px' },
  finalMetric: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  finalMetricValue: { fontSize: '24px', fontWeight: '700', color: '#0f172a' },
  finalMetricLabel: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  finalMetricDivider: { width: '1px', height: '36px', background: '#e2e8f0' },
  assessTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' },
  failCount: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
  ruleList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  ruleRow: { display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px' },
  ruleLabel: { fontSize: '13px', color: '#475569', fontWeight: '500' },
  ruleValue: { fontSize: '13px', color: '#0f172a', fontWeight: '600', textAlign: 'right' },
  ruleLimit: { color: '#94a3b8', fontWeight: '400' },
  ruleBadge: { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px' },
  featTable: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  thNum: { textAlign: 'right', padding: '8px 10px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  thCenter: { textAlign: 'center', padding: '8px 10px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '10px', color: '#475569', borderBottom: '1px solid #f8fafc' },
  tdNum: { padding: '10px', color: '#0f172a', fontWeight: '600', textAlign: 'right', borderBottom: '1px solid #f8fafc', fontVariantNumeric: 'tabular-nums' },
  tdCenter: { padding: '10px', textAlign: 'center', borderBottom: '1px solid #f8fafc' },
  legend: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' },
  legendDot: { width: '12px', height: '12px', borderRadius: '3px' },
  scoreEquation: { display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' },
  scoreBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', padding: '10px 16px', background: '#f8fafc', borderRadius: '10px' },
  scoreTotal: { border: '2px solid', background: 'white' },
  scoreValue: { fontSize: '26px', fontWeight: '800' },
  scoreLabel: { fontSize: '11px', color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase' },
  scoreOp: { fontSize: '22px', fontWeight: '700', color: '#cbd5e1' },
  scoreArrow: { fontSize: '22px', fontWeight: '700', color: '#cbd5e1' },
  consistencyMsg: { padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', textAlign: 'center' },
  thresholdNote: { marginTop: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' },
};

export default OilOriginalityDetail;
