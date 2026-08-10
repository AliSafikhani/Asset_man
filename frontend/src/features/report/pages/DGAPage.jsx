/**
 * DGAPage — report page 2 (+ continuation pages): gas trend, results table,
 * recommendations.
 * File: frontend/src/features/report/pages/DGAPage.jsx
 *
 * The gas trend uses a LOG Y axis (gases span ~0.1–5000 ppm). The results table
 * is paginated (see dgaPageCount/dgaRowsForPage in reportData) so each page is
 * one A4 node for capture.
 */

import ReportPage from '../ReportPage';
import { PageHeader, PageFooter } from '../components/PageChrome';
import ReportChart from '../components/ReportChart';
import DGATable from '../components/DGATable';
import { ReportCard, SectionTitle, CardTitle } from '../components/ReportCard';
import { colors, gasColors, gasLabels, PAGE_W_PX, PAGE_PAD_PX } from '../reportTheme';
import { buildGasTrend, dgaPageCount, dgaRowsForPage } from '../reportData';

const CHART_W = PAGE_W_PX - PAGE_PAD_PX * 2; // usable width inside padding

const GasLegendNote = ({ series }) => (
  <div style={{ fontSize: 9, color: colors.faint, marginTop: 4, textAlign: 'center' }}>
    Log scale (ppm). Series:{' '}
    {series.map((k, i) => (
      <span key={k} style={{ color: gasColors[k], fontWeight: 600 }}>
        {gasLabels[k]}
        {i < series.length - 1 ? ' · ' : ''}
      </span>
    ))}
  </div>
);

const DGAPage = ({ innerRef, dga, subIndex, headerRight, pageNo, pageCount, footerLeft }) => {
  const table = dga?.results_table || [];
  const isFirst = subIndex === 0;
  const gas = isFirst ? buildGasTrend(dga?.gas_trend) : null;
  const pageRows = dgaRowsForPage(table, subIndex);

  const gasSeries =
    gas?.series.map((k) => ({ key: k, name: gasLabels[k], color: gasColors[k] })) || [];

  return (
    <ReportPage ref={innerRef}>
      <PageHeader
        title={isFirst ? 'Dissolved Gas Analysis (DGA)' : 'DGA — Results (continued)'}
        subtitle={isFirst ? 'Multi-method diagnostic assessment' : undefined}
        right={headerRight}
      />

      {isFirst && (
        <ReportCard style={{ marginBottom: 14 }}>
          <CardTitle>Gas Concentration Trend</CardTitle>
          {gas && gas.rows.length ? (
            <>
              <ReportChart
                data={gas.rows}
                series={gasSeries}
                width={CHART_W - 32}
                height={230}
                xKey="date"
                yScale="log"
                yDomain={[gas.yMin, gas.yMax]}
                yLabel="ppm"
              />
              <GasLegendNote series={gas.series} />
            </>
          ) : (
            <div style={{ fontSize: 11, color: colors.faint, padding: '18px 0', textAlign: 'center' }}>
              No gas-concentration history available.
            </div>
          )}
        </ReportCard>
      )}

      <ReportCard style={{ marginBottom: 14 }}>
        <CardTitle>Diagnostic Results by Test Date</CardTitle>
        <DGATable rows={pageRows} />
        {dga?.note && (
          <div style={{ fontSize: 10, color: colors.faint, marginTop: 8 }}>{dga.note}</div>
        )}
      </ReportCard>

      {/* Recommendations block — only on the last DGA page; blank per spec. */}
      {subIndex === dgaPageCount(dga) - 1 && (
        <ReportCard style={{ minHeight: 90 }}>
          <SectionTitle style={{ fontSize: 13 }}>Recommendations</SectionTitle>
          {dga?.recommendations?.length ? (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: colors.slate, lineHeight: 1.7 }}>
              {dga.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 11, color: colors.faint, fontStyle: 'italic' }}>
              (To be completed by the reviewing engineer.)
            </div>
          )}
        </ReportCard>
      )}

      <PageFooter left={footerLeft} pageNo={pageNo} pageCount={pageCount} />
    </ReportPage>
  );
};

export default DGAPage;
