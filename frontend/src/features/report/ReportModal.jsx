/**
 * ReportModal — full-screen host that previews the report pages and downloads
 * them as a PDF.
 * File: frontend/src/features/report/ReportModal.jsx
 *
 * IMPORTANT — capture correctness:
 * html2canvas renders through any CSS transform on an ancestor of the captured
 * node. If we captured the *scaled* preview, every page would be shrunk into
 * the top-left corner of the A4 canvas (the "irregular" PDF bug). So the modal
 * renders the document TWICE:
 *   1. a scaled, on-screen PREVIEW (transform:scale) — for the human, and
 *   2. an off-screen, natural-size CAPTURE layer (no transform) — for the PDF.
 * Only the capture layer feeds html2canvas, so the output is always 1:1 A4.
 */

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import ReportDocument from './ReportDocument';
import useReportReady from './hooks/useReportReady';
import useGeneratePdf from './hooks/useGeneratePdf';
import { reportFileName } from './reportData';
import { PAGE_W_PX, colors } from './reportTheme';

// Scale the on-screen preview so an A4 page column fits comfortably in the overlay.
const PREVIEW_SCALE = 0.7;

const ReportModal = ({ open, onClose, payload, modules }) => {
  // Ref points at the OFF-SCREEN natural-size document — the capture source.
  const captureRef = useRef(null);
  const generatedAt = new Date().toLocaleString();
  // Gate keyed on payload identity so the readiness clock restarts per report.
  const ready = useReportReady([payload, (modules || []).join(',')]);
  const { generate, generating } = useGeneratePdf();

  if (!open) return null;

  const cover = payload?.data?.cover;

  const handleDownload = async () => {
    if (!ready) {
      toast('Report is still rendering — try again in a moment.');
      return;
    }
    const nodes = captureRef.current?.getPageNodes?.() || [];
    if (!nodes.length) {
      toast.error('Nothing to export.');
      return;
    }
    const fileName = reportFileName(cover, new Date().toISOString().slice(0, 10));
    await toast.promise(generate(nodes, fileName), {
      loading: 'Generating PDF…',
      success: 'PDF downloaded.',
      error: (e) => `PDF failed: ${e?.message || e}`,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: colors.brandDark,
          color: '#fff',
          flex: '0 0 auto',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          Report Preview
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 10 }}>
            {ready ? 'Ready' : 'Rendering…'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleDownload}
            disabled={generating || !ready}
            style={{
              padding: '8px 20px',
              background: generating || !ready ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: generating || !ready ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {generating ? 'Generating…' : '⬇ Download PDF'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Scrollable preview surface (scaled, purely visual). */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'top center',
            width: PAGE_W_PX,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            <ReportDocument payload={payload} modules={modules} generatedAt={generatedAt} />
          </div>
        </div>
      </div>

      {/*
        Off-screen CAPTURE layer — natural A4 size, NO transform or clipping
        ancestor. Rendered through a portal to <body> so the overlay's
        overflow:hidden cannot clip it, and pushed off-screen (not display:none,
        which html2canvas can't capture). This is the only document
        html2canvas reads, guaranteeing 1:1 full-page output.
      */}
      {createPortal(
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -100000,
            top: 0,
            width: PAGE_W_PX,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <ReportDocument ref={captureRef} payload={payload} modules={modules} generatedAt={generatedAt} />
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportModal;
