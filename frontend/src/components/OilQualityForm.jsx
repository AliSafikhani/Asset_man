// frontend/src/components/OilQualityForm.jsx
//
// Add / edit modal for a transformer "Oil Quality" test result. Renders the
// full canonical IEC 60296 + IEC 60422 parameter set as collapsible
// subsections (from OIL_QUALITY_GROUPS) plus meta fields (Operating State,
// Laboratory, Notes). Persists through the generic /test-results CRUD using
// the exact payload shape the DGA/other tests use.

import { useState, useMemo } from 'react';
import API from '../services/api';
import { OIL_QUALITY_GROUPS, OPERATING_STATES } from '../constants/oilQualityConstants';

const OilQualityForm = ({ assetId, testTypeId, editingResult, onClose, onSuccess }) => {
  const isEdit = !!editingResult;

  // ---- Initial form state ----
  const initial = useMemo(() => {
    const base = {
      test_date: new Date().toISOString().split('T')[0],
      lab_name: '',
      notes: '',
      operating_state: 'in_service',
    };
    OIL_QUALITY_GROUPS.forEach((g) => g.params.forEach((p) => { base[p.field_name] = ''; }));

    if (editingResult) {
      base.test_date = editingResult.test_date
        ? new Date(editingResult.test_date).toISOString().split('T')[0]
        : base.test_date;
      base.lab_name = editingResult.lab_name || '';
      base.notes = editingResult.notes || '';
      (editingResult.parameters || []).forEach((p) => {
        const val = p.field_value ?? p.field_value_text ?? '';
        if (p.field_name === 'operating_state') {
          base.operating_state = p.field_value_text || 'in_service';
        } else if (p.field_name in base) {
          base[p.field_name] = val === null || val === undefined ? '' : val;
        }
      });
    }
    return base;
  }, [editingResult]);

  const [form, setForm] = useState(initial);
  const [collapsed, setCollapsed] = useState({}); // group.key -> bool
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const toggleGroup = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Required routine params + operating_state must be present.
    const missing = [];
    OIL_QUALITY_GROUPS.forEach((g) => g.params.forEach((p) => {
      if (p.required && (form[p.field_name] === '' || form[p.field_name] == null)) {
        missing.push(p.display);
      }
    }));
    if (!form.operating_state) missing.push('Operating State');
    if (missing.length) {
      setError(`Please fill required fields: ${missing.join(', ')}`);
      return;
    }

    // Build the generic parameters[] payload.
    const parameters = [];
    // Meta field: operating_state (stored as text).
    parameters.push({
      field_name: 'operating_state',
      field_value: null,
      field_value_text: form.operating_state,
      field_value_date: null,
      field_value_boolean: null,
      unit: null,
    });
    OIL_QUALITY_GROUPS.forEach((g) => g.params.forEach((p) => {
      const raw = form[p.field_name];
      if (raw === '' || raw == null) return; // skip empties (sparse samples are fine)
      const isNumber = p.data_type === 'number';
      parameters.push({
        field_name: p.field_name,
        field_value: isNumber ? (parseFloat(raw) ?? null) : null,
        field_value_text: isNumber ? null : String(raw),
        field_value_date: null,
        field_value_boolean: null,
        unit: p.unit || null,
      });
    }));

    const payload = {
      asset_id: parseInt(assetId, 10),
      test_type_id: parseInt(testTypeId, 10),
      test_date: form.test_date,
      lab_name: form.lab_name || null,
      notes: form.notes || null,
      parameters,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await API.put(`/test-results/${editingResult.id}`, payload);
      } else {
        await API.post('/test-results/', payload);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save test result');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Styles ----
  const s = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      zIndex: 1000, padding: '24px', overflowY: 'auto',
    },
    modal: {
      background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '900px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)', color: '#0f172a',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
      position: 'sticky', top: 0, background: '#ffffff', borderRadius: '12px 12px 0 0', zIndex: 1,
    },
    title: { fontSize: '18px', fontWeight: 700, margin: 0 },
    subtitle: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' },
    body: { padding: '20px 24px' },
    metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '18px' },
    label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' },
    input: {
      width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px',
      fontSize: '13px', color: '#0f172a', boxSizing: 'border-box', background: '#fff',
    },
    groupCard: { border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '14px', overflow: 'hidden' },
    groupHeader: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    },
    paramGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '14px' },
    paramLabel: { fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '3px', display: 'block' },
    paramMeta: { fontSize: '10px', color: '#94a3b8', fontWeight: 400, marginLeft: '4px' },
    footer: {
      display: 'flex', justifyContent: 'flex-end', gap: '10px',
      padding: '16px 24px', borderTop: '1px solid #e2e8f0',
      position: 'sticky', bottom: 0, background: '#fff', borderRadius: '0 0 12px 12px',
    },
    btnCancel: { padding: '9px 18px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    btnSave: { padding: '9px 22px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
    errorBox: { padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', border: '1px solid #fecaca', marginBottom: '14px', fontSize: '13px' },
    reqStar: { color: '#dc2626', marginLeft: '2px' },
  };

  const renderInput = (p) => {
    const val = form[p.field_name] ?? '';
    if (p.data_type === 'select') {
      return (
        <select style={s.input} value={val} onChange={(e) => setField(p.field_name, e.target.value)}>
          <option value="">— select —</option>
          {p.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (p.data_type === 'text') {
      return <input type="text" style={s.input} value={val} onChange={(e) => setField(p.field_name, e.target.value)} />;
    }
    return (
      <input
        type="number" step="any" style={s.input} value={val}
        onChange={(e) => setField(p.field_name, e.target.value)}
        placeholder={p.unit ? p.unit : ''}
      />
    );
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <h3 style={s.title}>{isEdit ? 'Edit' : 'Add'} Oil Quality Test</h3>
            <div style={s.subtitle}>IEC 60296 (new-oil) + IEC 60422:2024 (in-service) parameter set</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.body}>
            {error && <div style={s.errorBox}>⚠️ {error}</div>}

            {/* Meta fields */}
            <div style={s.metaGrid}>
              <div>
                <label style={s.label}>Test Date <span style={s.reqStar}>*</span></label>
                <input type="date" style={s.input} value={form.test_date} required
                  onChange={(e) => setField('test_date', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Operating State <span style={s.reqStar}>*</span></label>
                <select style={s.input} value={form.operating_state}
                  onChange={(e) => setField('operating_state', e.target.value)}>
                  {OPERATING_STATES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Laboratory</label>
                <input type="text" style={s.input} value={form.lab_name}
                  onChange={(e) => setField('lab_name', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Notes</label>
                <input type="text" style={s.input} value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)} />
              </div>
            </div>

            {/* Parameter subsections */}
            {OIL_QUALITY_GROUPS.map((g) => {
              const isCollapsed = collapsed[g.key];
              return (
                <div key={g.key} style={s.groupCard}>
                  <div style={s.groupHeader} onClick={() => toggleGroup(g.key)}>
                    <span>{g.label}</span>
                    <span style={{ color: '#94a3b8' }}>{isCollapsed ? '▸' : '▾'}</span>
                  </div>
                  {!isCollapsed && (
                    <div style={s.paramGrid}>
                      {g.params.map((p) => (
                        <div key={p.field_name}>
                          <label style={s.paramLabel}>
                            {p.display}{p.required && <span style={s.reqStar}>*</span>}
                            {p.unit ? <span style={s.paramMeta}>({p.unit})</span> : null}
                            {p.subclause ? <span style={s.paramMeta}>§{p.subclause}</span> : null}
                          </label>
                          {renderInput(p)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={s.footer}>
            <button type="button" style={s.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" style={s.btnSave} disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Update Test' : 'Add Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OilQualityForm;
