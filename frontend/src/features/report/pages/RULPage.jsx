/**
 * RULPage — report page 4: IEC 60076-7 thermal-life (RUL) assessment.
 * File: frontend/src/features/report/pages/RULPage.jsx
 *
 * Maps every item RULResults.jsx shows: remaining-life gauge, life-consumed /
 * hot-spot / FAA stat tiles, Method 1 & Method 2 cards + agreement, the four
 * trend charts (raw signals, FAA vs 1.0, load factor, hot-spot vs 110), and
 * recommendations. Handles the not_configured state gracefully.
 */

import ReportPage from '../ReportPage';
import { PageHeader, PageFooter } from '../components/PageChrome';
import ReportChart from '../components/ReportChart';
import { ReportCard, CardTitle, StatTile, GaugeBar, Row } from '../components/ReportCard';
import { colors, PAGE_W_PX, PAGE_PAD_PX } from '../reportTheme';
import { num, fmtDate, buildRulChartData, lifeColor } from '../reportData';

const USABLE_W = PAGE_W_PX - PAGE_PAD_PX * 2;
const HALF_CHART_W = Math.floor(USABLE_W / 2) - 40;

const MethodCard = ({ title, rows, skipped }) => (
  <ReportCard>
    <CardTitle>{title}</CardTitle>
    {skipped ? (
      <div style={{ fontSize: 10, color: colors.faint, paddingTop: 4 }}>{skipped}</div>
    ) : (
      <div style={{ display: 'grid', gap: 3 }}>
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} style={{ fontSize: 10, padding: '3px 0' }} />
        ))}
      </div>
    )}
  </ReportCard>
);

const RULPage = ({ innerRef, block, headerRight, pageNo, pageCount, footerLeft }) => {
  const notConfigured = block?.status === 'not_configured';
  const errored = !block || (block.error && !notConfigured);
  const r = block?.data || {};

  const info = r.transformer_info || {};
  const overall = r.overall_remaining_life || {};
  const thermal = r.current_thermal_state || {};
  const dyn = r.life_estimation?.dynamic_gradient || {};
  const load = r.life_estimation?.load_current || {};
  const comparison = r.comparison || {};
  const recommendations = r.recommendations || [];
  const chartData = buildRulChartData(r.time_series);
  const hasLoadFactor = chartData.some((x) => x.load_factor != null);

  const remaining = overall.remaining_life_years;
  const design = overall.design_life_years;
  const usedPct = Math.min(100, Math.max(0, overall.life_used_percent || 0));
  const remColor = lifeColor(remaining, design);

  return (
    <ReportPage ref={innerRef}>
      <PageHeader
        title="IEC 60076-7 Thermal Life (RUL)"
        subtitle={
          errored || notConfigured
            ? undefined
            : `${info.transformer_id || 'Transformer'} • ${num(info.age_years)} yrs • ${info.cooling_type || 'N/A'}`
        }
        right={headerRight}
      />

      {notConfigured ? (
        <ReportCard>
          <div style={{ fontSize: 12, color: colors.muted }}>
            RUL signals are not configured for this transformer. Map the Top Oil and Ambient
            temperature signals (and optionally Load Current) before this assessment can run.
          </div>
        </ReportCard>
      ) : errored ? (
        <ReportCard>
          <div style={{ fontSize: 12, color: colors.red }}>
            RUL assessment unavailable: {block?.error || 'no data'}
          </div>
        </ReportCard>
      ) : (
        <>
          {/* Overall life row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
            <ReportCard>
              <CardTitle>Remaining Life</CardTitle>
              <div style={{ fontSize: 24, fontWeight: 700, color: remColor }}>
                {num(remaining)} <span style={{ fontSize: 12, color: colors.faint }}>yrs</span>
              </div>
              <GaugeBar pct={usedPct} color={remColor} />
              <div style={{ fontSize: 9, color: colors.faint, marginTop: 4 }}>
                {num(usedPct, 0)}% used of {num(design, 0)} yr design
              </div>
            </ReportCard>
            <StatTile
              label="Life Consumed"
              value={`${num(overall.total_elapsed_life_years)} yrs`}
              sub={`${num(usedPct, 1)}% of design`}
            />
            <StatTile
              label="Current Hot-Spot"
              value={`${num(thermal.hot_spot_current)} °C`}
              sub={`Top oil ${num(thermal.top_oil_current)} • Amb ${num(thermal.ambient_current)}`}
              valueColor={thermal.hot_spot_current > 110 ? '#ef4444' : '#0f172a'}
            />
            <StatTile
              label="Ageing (FAA)"
              value={num(thermal.faa_current, 2)}
              sub={thermal.load_factor_current != null ? `Load ${num(thermal.load_factor_current, 2)} pu` : 'Load N/A'}
              valueColor={thermal.faa_current > 5 ? '#ef4444' : '#0f172a'}
            />
          </div>

          {/* Method comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
            <MethodCard
              title="Method 1 — Dynamic Gradient"
              rows={[
                ['Consumed life', `${num(dyn.consumed_life_years, 2)} yrs`],
                ['Remaining life', `${num(dyn.remaining_life_years, 2)} yrs`],
                ['Average FAA', num(dyn.average_faa, 3)],
                ['Max hot-spot', `${num(dyn.max_hotspot_temp)} °C`],
                ['Max top-oil', `${num(dyn.max_top_oil_temp)} °C`],
              ]}
            />
            <MethodCard
              title="Method 2 — Load Current"
              skipped={load.skipped}
              rows={[
                ['Consumed life', `${num(load.consumed_life_years, 2)} yrs`],
                ['Remaining life', `${num(load.remaining_life_years, 2)} yrs`],
                ['Average FAA', num(load.average_faa, 3)],
                ['Max hot-spot', `${num(load.max_hotspot_temp)} °C`],
                ['Loss ratio R', num(load.loss_ratio_R_used, 2)],
              ]}
            />
            <ReportCard>
              <CardTitle>Agreement</CardTitle>
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
                  <div style={{ fontSize: 10, color: colors.slate, marginTop: 4 }}>{comparison.status}</div>
                  <div style={{ fontSize: 9, color: colors.faint, marginTop: 6 }}>
                    Δ {num(comparison.difference_years, 2)} yrs between methods
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 10, color: colors.faint, paddingTop: 4 }}>
                  Comparison needs a load-current signal and rated data.
                </div>
              )}
            </ReportCard>
          </div>

          {/* Trend charts (2×2) */}
          {chartData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <ReportCard>
                <CardTitle>Raw Signals — Top Oil & Ambient (°C)</CardTitle>
                <ReportChart
                  data={chartData}
                  series={[
                    { key: 'top_oil', name: 'Top Oil', color: '#f59e0b' },
                    { key: 'ambient', name: 'Ambient', color: '#3b82f6', width: 1 },
                  ]}
                  width={HALF_CHART_W}
                  height={150}
                  xKey="t"
                  xTickFormatter={fmtDate}
                />
              </ReportCard>
              <ReportCard>
                <CardTitle>Ageing Acceleration (FAA)</CardTitle>
                <ReportChart
                  data={chartData}
                  series={[{ key: 'faa', name: 'FAA', color: '#8b5cf6' }]}
                  width={HALF_CHART_W}
                  height={150}
                  xKey="t"
                  xTickFormatter={fmtDate}
                  refLines={[{ y: 1, color: '#94a3b8', label: 'FAA 1.0' }]}
                  showLegend={false}
                />
              </ReportCard>
              <ReportCard>
                <CardTitle>Load Factor (pu)</CardTitle>
                {hasLoadFactor ? (
                  <ReportChart
                    data={chartData}
                    series={[{ key: 'load_factor', name: 'Load', color: '#10b981' }]}
                    width={HALF_CHART_W}
                    height={150}
                    xKey="t"
                    xTickFormatter={fmtDate}
                    refLines={[{ y: 1, color: '#94a3b8', label: 'Rated 1.0' }]}
                    showLegend={false}
                  />
                ) : (
                  <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 10, color: colors.faint }}>
                    No load-factor trend — map a Load Current signal and rated MVA/kV.
                  </div>
                )}
              </ReportCard>
              <ReportCard>
                <CardTitle>Hot-Spot Temperature (°C)</CardTitle>
                <ReportChart
                  data={chartData}
                  series={[{ key: 'hot_spot', name: 'Hot-spot', color: '#ef4444' }]}
                  width={HALF_CHART_W}
                  height={150}
                  xKey="t"
                  xTickFormatter={fmtDate}
                  refLines={[{ y: 110, color: '#ef4444', label: 'HS 110°C' }]}
                  showLegend={false}
                />
              </ReportCard>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <ReportCard>
              <CardTitle>📋 Recommendations</CardTitle>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10, color: colors.slate, lineHeight: 1.6 }}>
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
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

export default RULPage;
