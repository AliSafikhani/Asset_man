/**
 * ReportDocument — assembles the ordered page list from the payload + selected
 * modules, owns one ref per page, and renders every page.
 * File: frontend/src/features/report/ReportDocument.jsx
 *
 * The parent (ReportModal) reads `pageRefs.current` after the readiness gate to
 * drive the capture loop. DGA can span multiple pages when the results table is
 * long, so page count is computed, not assumed.
 */

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import CoverPage from './pages/CoverPage';
import DGAPage from './pages/DGAPage';
import IEC62874Page from './pages/IEC62874Page';
import RULPage from './pages/RULPage';
import { displayValue, dgaPageCount } from './reportData';

const ReportDocument = forwardRef(({ payload, modules, generatedAt }, ref) => {
  const data = payload?.data || {};
  const cover = data.cover || {};

  // Build the flat list of page descriptors in order.
  const pages = useMemo(() => {
    const selected = modules || payload?.modules || [];
    const list = [{ type: 'cover' }];
    if (selected.includes('dga') && data.dga) {
      const n = dgaPageCount(data.dga);
      for (let i = 0; i < n; i++) list.push({ type: 'dga', subIndex: i });
    }
    if (selected.includes('iec62874') && data.iec62874) list.push({ type: 'iec62874' });
    if (selected.includes('rul') && data.rul) list.push({ type: 'rul' });
    return list;
  }, [modules, payload?.modules, data.dga, data.iec62874, data.rul]);

  const pageRefs = useRef([]);
  pageRefs.current = [];
  const setRef = (i) => (el) => {
    pageRefs.current[i] = el;
  };

  // Expose the captured nodes to the parent.
  useImperativeHandle(ref, () => ({
    getPageNodes: () => pageRefs.current.filter(Boolean),
    pageCount: pages.length,
  }));

  const pageCount = pages.length;
  const footerLeft = `${displayValue(cover.plant_name)} — ${displayValue(cover.asset?.asset_name)}`;
  const headerRight = `${displayValue(cover.company_name)} • ${displayValue(cover.plant_name)}`;

  return (
    <div>
      {pages.map((p, i) => {
        const common = {
          key: i,
          innerRef: setRef(i),
          pageNo: i + 1,
          pageCount,
          footerLeft,
          headerRight,
        };
        if (p.type === 'cover') {
          return <CoverPage {...common} cover={cover} generatedAt={generatedAt} />;
        }
        if (p.type === 'dga') {
          return <DGAPage {...common} dga={data.dga} subIndex={p.subIndex} cover={cover} />;
        }
        if (p.type === 'iec62874') {
          return <IEC62874Page {...common} block={data.iec62874} />;
        }
        if (p.type === 'rul') {
          return <RULPage {...common} block={data.rul} />;
        }
        return null;
      })}
    </div>
  );
});

ReportDocument.displayName = 'ReportDocument';

export default ReportDocument;
