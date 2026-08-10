/**
 * Reports — Decision Support → Reports subtab (transformer asset report entry).
 * File: frontend/src/components/AssetDetail/tabs/DecisionSupportTab/subTabs/Reports.jsx
 *
 * User picks which stable transformer modules to include (DGA / IEC 62874 /
 * RUL) via checkboxes, clicks "Create Report", the aggregator is fetched in one
 * call, and a full-screen modal previews the pages and downloads the PDF.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { getTransformerReport } from '../../../../../api/reports';
import { MODULES } from '../../../../../features/report/reportConstants';
import ReportModal from '../../../../../features/report/ReportModal';

const Reports = ({ asset, assetId }) => {
  // All modules selected by default.
  const [selected, setSelected] = useState(() => MODULES.map((m) => m.key));
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const toggle = (key) =>
    setSelected((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]
    );

  const handleCreate = async () => {
    if (!assetId) {
      toast.error('No asset selected.');
      return;
    }
    if (!selected.length) {
      toast('Select at least one module.');
      return;
    }
    // Keep module order stable (MODULES order), not click order.
    const ordered = MODULES.map((m) => m.key).filter((k) => selected.includes(k));
    setLoading(true);
    try {
      const res = await getTransformerReport(assetId, ordered);
      if (res?.status === 'success') {
        setPayload({ ...res, modules: res.modules || ordered });
        setModalOpen(true);
      } else {
        toast.error('Unexpected response from the report service.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to build report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: 16,
          padding: '22px 28px',
          marginBottom: 24,
          color: 'white',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Transformer Asset Report</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
          {asset?.asset_name ? `${asset.asset_name} • ` : ''}
          Select the modules to include, then create a printable PDF report.
        </p>
      </div>

      {/* Module checklist */}
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          marginBottom: 20,
        }}
      >
        <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#0f172a' }}>Modules</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {MODULES.map((m) => {
            const checked = selected.includes(m.key);
            return (
              <label
                key={m.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  border: `1px solid ${checked ? '#10b981' : '#e2e8f0'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: checked ? '#f0fdf4' : 'white',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(m.key)}
                  style={{ width: 18, height: 18, accentColor: '#10b981', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={handleCreate}
          disabled={loading || !selected.length}
          style={{
            padding: '12px 32px',
            background:
              loading || !selected.length
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            cursor: loading || !selected.length ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 600,
            boxShadow: '0 4px 6px rgba(16,185,129,0.3)',
          }}
        >
          {loading ? '⏳ Building…' : '📄 Create Report'}
        </button>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          {selected.length} module{selected.length === 1 ? '' : 's'} selected
        </span>
      </div>

      {/* Preview + download modal */}
      <ReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        payload={payload}
        modules={payload?.modules}
      />
    </div>
  );
};

export default Reports;
