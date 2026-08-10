/**
 * ReportChart — fixed-size Recharts line chart for print capture.
 * File: frontend/src/features/report/components/ReportChart.jsx
 *
 * Capture-safe rules (all mandatory, else html2canvas grabs a blank chart):
 *   - explicit pixel width/height (NEVER ResponsiveContainer %)
 *   - isAnimationActive={false} on every series
 *   - dot={false} so hundreds of points stay light
 *
 * Supports an optional log Y scale (DGA gas trend) and horizontal reference
 * lines (RUL / IEC limits).
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { colors } from '../reportTheme';

const ReportChart = ({
  data,
  series,
  width,
  height = 220,
  xKey = 'date',
  xTickFormatter,
  yScale = 'linear',
  yDomain,
  yLabel,
  refLines = [],
  showLegend = true,
}) => (
  <LineChart
    data={data}
    width={width}
    height={height}
    margin={{ top: 8, right: 24, left: 4, bottom: 4 }}
  >
    <CartesianGrid strokeDasharray="3 3" stroke={colors.line} />
    <XAxis
      dataKey={xKey}
      tick={{ fontSize: 9, fill: colors.faint }}
      tickFormatter={xTickFormatter}
      minTickGap={24}
    />
    <YAxis
      tick={{ fontSize: 9, fill: colors.faint }}
      scale={yScale}
      domain={yDomain || ['auto', 'auto']}
      allowDataOverflow={yScale === 'log'}
      width={44}
      label={
        yLabel
          ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fill: colors.faint, fontSize: 10 } }
          : undefined
      }
    />
    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', fontSize: 11 }} />
    {showLegend && <Legend verticalAlign="top" height={26} wrapperStyle={{ fontSize: 10 }} />}
    {refLines.map((r, i) => (
      <ReferenceLine
        key={i}
        y={r.y}
        stroke={r.color}
        strokeDasharray="5 5"
        label={{ value: r.label, fill: r.color, fontSize: 9, position: 'right' }}
      />
    ))}
    {series.map((s) => (
      <Line
        key={s.key}
        type="monotone"
        dataKey={s.key}
        name={s.name}
        stroke={s.color}
        strokeWidth={s.width || 1.5}
        dot={s.dot ? { r: 2, fill: s.color } : false}
        connectNulls
        isAnimationActive={false}
      />
    ))}
  </LineChart>
);

export default ReportChart;
