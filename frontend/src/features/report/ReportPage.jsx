/**
 * ReportPage — one A4 page container.
 * File: frontend/src/features/report/ReportPage.jsx
 *
 * A fixed-size white box (794×1123 px @ 96dpi = A4); one node per PDF page.
 * The capture hook calls html2canvas on each ref in sequence.
 */

import { forwardRef } from 'react';
import { PAGE_W_PX, PAGE_H_PX, PAGE_PAD_PX, colors } from './reportTheme';

const ReportPage = forwardRef(({ children, style }, ref) => (
  <div
    ref={ref}
    style={{
      width: PAGE_W_PX,
      height: PAGE_H_PX,
      background: colors.bg,
      boxSizing: 'border-box',
      padding: PAGE_PAD_PX,
      overflow: 'hidden',
      position: 'relative',
      ...style,
    }}
  >
    {children}
  </div>
));

ReportPage.displayName = 'ReportPage';

export default ReportPage;
