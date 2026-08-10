/**
 * IEC62874Page — report page 3: IEC TR 62874:2015 paper-degradation assessment.
 * File: frontend/src/features/report/pages/IEC62874Page.jsx
 *
 * Maps every item the webapp's IEC62874 page shows: validation status, quick
 * stats, final-decision gauge, 2-FAL / CO₂ / RoI cards, test summary, the CO₂
 * and 2-FAL trend charts with reference limits, and warnings.
 */

import ReportPage from '../ReportPage';
import { PageHeader, PageFooter } from '../components/PageChrome';
import ReportChart from '../components/ReportChart';
import { ReportCard, CardTitle, StatTile, GaugeBar, StatusPill } from '../components/ReportCard';
import { colors, PAGE_W_PX, PAGE_PAD_PX } from '../reportTheme';
import { displayValue } from '../reportData';

const USABLE_W = PAGE_W_PX - PAGE_PAD_PX * 2;
const HALF_CHART_W = Math.floor(USABLE_W / 2) - 40;

const statusColor = (s) =>
  ({ LOW: '#10b981', TYPICAL: '#f59e0b', HIGH: '#ef4444' }[s] || '#94a3b8');

const statusPillProps = (s) =>
  ({
    LOW: { bg: '#d1fae5', color: '#065f46' },
    TYPICAL: { bg: '#fef3c7', color: '#92400e' },
    HIGH: { bg: '#fee2e2', color: '#991b1b' },
  }[s] || { bg: '#f1f5f9', color: '#475569' });

const validationPill = (status) => {
  const map = {
    VALID: { bg: '#d1fae5', color: '#065f46', label: 'VALID' },
    INSUFFICIENT_TESTS: { bg: '#fee2e2', color: '#991b1b', label: 'Insufficient Tests' },
    INSUFFICIENT_TIME_GAP: { bg: '#fef3c7', color: '#92400e', label: 'Insufficient Time Gap' },
    NO_VALID_TESTS_AFTER_MAINTENANCE: { bg: '#fee2e2', color: '#991b1b', label: 'No Valid Tests After Maint.' },
  };
  return map[status] || { bg: '#f1f5f9', color: '#475569', label: status || 'N/A' };
};

const MetricCard = ({ title, value, status, extra }) => {
  const pill = statusPillProps(status);
  return (
    <ReportCard>
      <CardTitle>{title}</CardTitle>
      <div style={{ fontSize: 20, fontWeight: 700, color: colors.ink }}>{value}</div>
      {status && (
        <div style={{ marginTop: 5 }}>
          <StatusPill text={status} bg={pill.bg} color={pill.color} />
        </div>
      )}
      {extra && <div style={{ fontSize: 9, color: colors.faint, marginTop: 6 }}>{extra}</div>}
    </ReportCard>
  );
};

const IEC62874Page = ({ innerRef, block, headerRight, pageNo, pageCount, footerLeft }) => {
  const errored = !block || block.error;
  const r = block?.data || {};
  const ref2FAL = r.reference_2FAL || {};
  const refCO2 = r.reference_CO2 || {};
  const history = Array.isArray(r.test_history) ? r.test_history : [];
  const co2Data = history.filter((d) => d.co2 !== null && d.co2 !== undefined);
  const falData = history.filter((d) => d.fal !== null && d.fal !== undefined);
  const ts = r.test_summary || {};

  const scoreMap = { LOW: 85, TYPICAL: 50, HIGH: 20 };
  const score = scoreMap[r.final_decision] || 0;
  const vp = validationPill(r.validation?.status);

  const co2Refs = [
    refCO2.C90 !== undefined && { y: refCO2.C90, color: '#f59e0b', label: `C90 ${refCO2.C90}` },
    refCO2.C98 !== undefined && { y: refCO2.C98, color: '#ef4444', label: `C98 ${refCO2.C98}` },
  ].filter(Boolean);
  const falRefs = [
    ref2FAL.C90 !== undefined && { y: ref2FAL.C90, color: '#10b981', label: `C90 ${ref2FAL.C90}` },
    ref2FAL.C98 !== undefined && { y: ref2FAL.C98, color: '#ef4444', label: `C98 ${ref2FAL.C98}` },
  ].filter(Boolean);

  return (
    <ReportPage ref={innerRef}>
      <PageHeader
        title="IEC TR 62874:2015 Assessment"
        subtitle={
          errored
            ? undefined
            : `${displayValue(r.transformer)} • ${displayValue(r.age_years)} yrs (${displayValue(r.age_category)})`
        }
        right={headerRight}
      />

      {errored ? (
        <ReportCard>
          <div style={{ fontSize: 12, color: colors.red }}>
            IEC 62874 assessment unavailable: {block?.error || 'no data'}
          </div>
        </ReportCard>
      ) : (
        <>
          {/* Validation + quick stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: colors.muted }}>Validation:</span>
            <StatusPill text={vp.label} bg={vp.bg} color={vp.color} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
            <StatTile label="Total Tests" value={ts.total_tests || 0} />
            <StatTile label="Valid Tests" value={ts.valid_tests || 0} valueColor="#10b981" />
            <StatTile label="Invalid Tests" value={ts.invalid_tests || 0} valueColor="#ef4444" />
            <StatTile label="Last Valid" value={ts.valid_test_dates?.slice(-1)[0] || 'N/A'} />
          </div>

          {/* Final decision gauge + metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
            <ReportCard>
              <CardTitle>Final Decision</CardTitle>
              <div style={{ fontSize: 22, fontWeight: 700, color: statusColor(r.final_decision) }}>
                {displayValue(r.final_decision)}
              </div>
              <GaugeBar pct={score} color={statusColor(r.final_decision)} />
              <div style={{ fontSize: 9, color: colors.faint, marginTop: 5 }}>Conservative per Clause 6.2</div>
            </ReportCard>
            <MetricCard
              title="2-FAL (Furan)"
              value={r['latest_2FAL_mg/kg'] != null ? `${r['latest_2FAL_mg/kg']} mg/kg` : 'N/A'}
              status={r['2FAL_status']}
              extra={ref2FAL.C90 !== undefined ? `C90 ${ref2FAL.C90} • C98 ${ref2FAL.C98}` : null}
            />
            <MetricCard
              title="CO₂ (DGA)"
              value={r['latest_CO2_μl/l'] != null ? `${r['latest_CO2_μl/l']} μl/l` : 'N/A'}
              status={r['CO2_status']}
              extra={refCO2.C90 !== undefined ? `C90 ${refCO2.C90} • C98 ${refCO2.C98}` : null}
            />
            <MetricCard
              title="Rate of Increase"
              value={r['RoI_mg/kg_year'] != null ? `${r['RoI_mg/kg_year']} /yr` : 'N/A'}
              status={r['RoI_status']}
              extra={r.notes || null}
            />
          </div>

          {/* Trend charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <ReportCard>
              <CardTitle>CO₂ Trend</CardTitle>
              <ReportChart
                data={co2Data}
                series={[{ key: 'co2', name: 'CO₂', color: colors.indigo, dot: true }]}
                width={HALF_CHART_W}
                height={170}
                xKey="date"
                yLabel="μl/l"
                refLines={co2Refs}
                showLegend={false}
              />
            </ReportCard>
            <ReportCard>
              <CardTitle>2-FAL Trend</CardTitle>
              <ReportChart
                data={falData}
                series={[{ key: 'fal', name: '2-FAL', color: colors.amber, dot: true }]}
                width={HALF_CHART_W}
                height={170}
                xKey="date"
                yLabel="mg/kg"
                refLines={falRefs}
                showLegend={false}
              />
            </ReportCard>
          </div>

          {/* Warnings */}
          {r.warnings?.length > 0 && (
            <ReportCard style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}>
              <CardTitle style={{ color: '#92400e' }}>⚠️ Warnings</CardTitle>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10, color: '#78350f', lineHeight: 1.6 }}>
                {r.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </ReportCard>
          )}
        </>
      )}

      <PageFooter left={footerLeft} pageNo={pageNo} pageCount={pageCount} />
    </ReportPage>
  );
};

export default IEC62874Page;
