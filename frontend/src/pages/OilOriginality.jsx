// frontend/src/pages/OilOriginality.jsx
// Oil-originality (اصالت روغن) module — plant-level list page.
// Lists previously-submitted DSC/DTA authenticity analyses for a plant and lets
// the user add a new one (name + date + curve data via Excel upload or paste).
// "Open" navigates to the detail page that replicates the assessment report.

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { oilOriginalityAPI } from '../services/api';
import API from '../services/api';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';
import {
  FaFlask, FaPlus, FaEdit, FaTrash, FaArrowRight, FaTimes,
  FaArrowLeft, FaFileExcel, FaPaste, FaShieldAlt, FaCalendarAlt,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaBuilding
} from 'react-icons/fa';

// Parse a pasted two-column block ("temperature<sep>signal" per line) into
// {temperature:[], signal:[]}. Separators: tab / comma / semicolon / whitespace.
// Header rows and malformed lines are skipped (NaN → dropped).
function parsePasted(text) {
  const temperature = [];
  const signal = [];
  for (const line of (text || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/[\s,;]+/).map(Number);
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      temperature.push(parts[0]);
      signal.push(parts[1]);
    }
  }
  return { temperature, signal };
}

// Parse a single pasted column of numbers (one value per line) into an array.
// Only the first numeric token on each line is used; blanks/headers are skipped.
function parseColumn(text) {
  const out = [];
  for (const line of (text || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const n = Number(trimmed.split(/[\s,;]+/)[0]);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

// Build one curve {temperature, signal} from an X box and a Y box.
// If the Y box is empty, the X box is treated as a two-column paste (temp+signal)
// so a combined copy still works. Otherwise X and Y are parsed independently.
function parseCurve(xText, yText) {
  if (!(yText || '').trim()) {
    return parsePasted(xText);
  }
  return { temperature: parseColumn(xText), signal: parseColumn(yText) };
}

// Validate a curve: non-empty and equal-length arrays. Returns an error string
// (label included) or null when valid.
function validateCurve(curve, label) {
  if (!curve || !curve.temperature.length) return `${label}: no data provided.`;
  if (curve.temperature.length !== curve.signal.length) {
    return `${label}: X has ${curve.temperature.length} values but Y has ${curve.signal.length}.`;
  }
  return null;
}

const STATUS_META = {
  original:   { label: 'Original',   color: '#10b981', bg: '#d1fae5', icon: <FaCheckCircle /> },
  suspicious: { label: 'Suspicious', color: '#f59e0b', bg: '#fef3c7', icon: <FaExclamationTriangle /> },
  fake:       { label: 'Fake',       color: '#ef4444', bg: '#fee2e2', icon: <FaTimesCircle /> },
};

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status || 'N/A', color: '#94a3b8', bg: '#f1f5f9', icon: null };
  return (
    <span style={{ ...styles.statusBadge, background: meta.bg, color: meta.color }}>
      {meta.icon} {meta.label}
    </span>
  );
}

function OilOriginality() {
  const navigate = useNavigate();
  const location = useLocation();
  const plantId = new URLSearchParams(location.search).get('plant_id');

  const [records, setRecords] = useState([]);
  const [plantName, setPlantName] = useState('');
  const [loading, setLoading] = useState(Boolean(plantId));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    custom_name: '',
    sample_date: '',
    notes: '',
    inputMode: 'paste',       // 'paste' | 'excel'
    // Paste inputs — each curve is two arrays (X = temperature, Y = signal).
    dscSampleX: '', dscSampleY: '',
    dtaSampleX: '', dtaSampleY: '',
    dscRefX: '', dscRefY: '',
    dtaRefX: '', dtaRefY: '',
    // Reference source per method: 'builtin' (use verified curve) | 'custom'.
    dscRefMode: 'builtin',
    dtaRefMode: 'builtin',
    // Parsed Excel result: {dsc, dta, dsc_reference, dta_reference, filename}.
    excel: null,
  };
  const [form, setForm] = useState(emptyForm);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await oilOriginalityAPI.list(plantId);
      setRecords(res.data.items || []);
    } catch (error) {
      console.error('Error loading oil-originality records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const loadPlant = async () => {
    try {
      const res = await API.get(`/sites/${plantId}`);
      setPlantName(res.data?.name || '');
    } catch {
      // non-fatal — header just omits the plant name
    }
  };

  useEffect(() => {
    if (!plantId) {
      toast.error('No plant selected');
      return;
    }
    loadRecords();
    loadPlant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    setForm({
      ...emptyForm,
      custom_name: rec.custom_name || '',
      sample_date: rec.sample_date ? String(rec.sample_date).slice(0, 10) : '',
      notes: rec.notes || '',
    });
    setShowForm(true);
  };

  const handleExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await oilOriginalityAPI.parseExcel(file);
      const d = res.data;
      setForm((f) => ({
        ...f,
        excel: {
          dsc: d.dsc,
          dta: d.dta,
          dsc_reference: d.dsc_reference || null,
          dta_reference: d.dta_reference || null,
          filename: d.filename,
        },
      }));
      const refBits = [
        d.dsc_reference ? 'DSC ref' : null,
        d.dta_reference ? 'DTA ref' : null,
      ].filter(Boolean);
      toast.success(
        `Parsed ${d.dsc.temperature.length} DSC + ${d.dta.temperature.length} DTA sample points` +
        (refBits.length ? ` (+ ${refBits.join(', ')})` : ' (built-in references)')
      );
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not parse Excel');
    }
  };

  const handleDelete = async (rec) => {
    if (!window.confirm(`Delete "${rec.custom_name}"? This cannot be undone.`)) return;
    try {
      await oilOriginalityAPI.delete(rec.id);
      toast.success('Record deleted');
      loadRecords();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        // Curves are immutable — only metadata is editable.
        await oilOriginalityAPI.update(editing.id, {
          custom_name: form.custom_name,
          sample_date: form.sample_date || null,
          notes: form.notes || null,
        });
        toast.success('Record updated');
      } else {
        // Resolve the four curves from either Excel or the paste inputs.
        let dsc, dta, dscRef, dtaRef;
        if (form.inputMode === 'excel') {
          const ex = form.excel;
          if (!ex) {
            toast.error('Upload an Excel file first');
            setSubmitting(false);
            return;
          }
          dsc = ex.dsc; dta = ex.dta;
          dscRef = ex.dsc_reference; dtaRef = ex.dta_reference;
        } else {
          dsc = parseCurve(form.dscSampleX, form.dscSampleY);
          dta = parseCurve(form.dtaSampleX, form.dtaSampleY);
          dscRef = form.dscRefMode === 'custom' ? parseCurve(form.dscRefX, form.dscRefY) : null;
          dtaRef = form.dtaRefMode === 'custom' ? parseCurve(form.dtaRefX, form.dtaRefY) : null;
        }

        // Validate every curve that is present (references are optional).
        const err =
          validateCurve(dsc, 'DSC sample') ||
          validateCurve(dta, 'DTA sample') ||
          (dscRef ? validateCurve(dscRef, 'DSC reference') : null) ||
          (dtaRef ? validateCurve(dtaRef, 'DTA reference') : null);
        if (err) {
          toast.error(err);
          setSubmitting(false);
          return;
        }

        const created = await oilOriginalityAPI.create(plantId, {
          custom_name: form.custom_name,
          sample_date: form.sample_date || null,
          notes: form.notes || null,
          dsc,
          dta,
          dsc_reference: dscRef || null,
          dta_reference: dtaRef || null,
        });
        toast.success(`Analysis complete: ${created.data.final_status}`);
        setShowForm(false);
        loadRecords();
        navigate(`/oil-originality/${created.data.id}`);
        return;
      }
      setShowForm(false);
      loadRecords();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  const columns = ['#', 'Date', 'Custom Name', 'Status', 'Actions'];
  const tableData = records.map((rec) => ({
    id: rec.id,
    '#': <span style={styles.rowNumber}>{rec.record_number}</span>,
    date: <span style={styles.dateCell}><FaCalendarAlt size={12} color="#94a3b8" /> {fmtDate(rec.sample_date)}</span>,
    custom_name: <span style={styles.nameCell}>{rec.custom_name}</span>,
    status: statusBadge(rec.final_status),
    actions: (
      <div style={styles.actionButtons}>
        <button style={{ ...styles.actionBtn, ...styles.actionBtnEdit }} onClick={() => openEdit(rec)} title="Edit">
          <FaEdit size={14} />
        </button>
        <button style={{ ...styles.actionBtn, ...styles.actionBtnDelete }} onClick={() => handleDelete(rec)} title="Delete">
          <FaTrash size={14} />
        </button>
        <button style={{ ...styles.actionBtn, ...styles.actionBtnOpen }} onClick={() => navigate(`/oil-originality/${rec.id}`)} title="Open">
          <FaArrowRight size={14} />
        </button>
      </div>
    ),
  }));

  const counts = {
    total: records.length,
    original: records.filter((r) => r.final_status === 'original').length,
    suspicious: records.filter((r) => r.final_status === 'suspicious').length,
    fake: records.filter((r) => r.final_status === 'fake').length,
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate(`/assets?plant_id=${plantId}`)} title="Back to plant">
            <FaArrowLeft size={16} />
          </button>
          <div style={styles.headerIcon}><FaFlask size={24} color="#8b5cf6" /></div>
          <div>
            <h1 style={styles.title}>Oil Originality</h1>
            <p style={styles.subtitle}>
              <FaBuilding size={12} color="#94a3b8" style={{ marginRight: '4px' }} />
              {plantName || `Plant #${plantId}`} • DSC &amp; DTA oil authenticity assessment
            </p>
          </div>
        </div>
        <button style={styles.addBtn} onClick={openAdd}>
          <FaPlus size={16} /> Add New
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaFlask color="#8b5cf6" /></div>
          <div><span style={styles.statValue}>{counts.total}</span><span style={styles.statLabel}>Total Analyses</span></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaCheckCircle color="#10b981" /></div>
          <div><span style={styles.statValue}>{counts.original}</span><span style={styles.statLabel}>Original</span></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaExclamationTriangle color="#f59e0b" /></div>
          <div><span style={styles.statValue}>{counts.suspicious}</span><span style={styles.statLabel}>Suspicious</span></div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}><FaTimesCircle color="#ef4444" /></div>
          <div><span style={styles.statValue}>{counts.fake}</span><span style={styles.statLabel}>Fake</span></div>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <span style={styles.tableTitle}>
            <FaFlask size={16} color="#64748b" style={{ marginRight: '8px' }} />
            Analyses <span style={styles.tableCount}>({records.length})</span>
          </span>
        </div>
        <Table columns={columns} data={tableData} loading={loading} />
        {!loading && records.length === 0 && (
          <div style={styles.empty}>
            <FaFlask size={40} color="#cbd5e1" />
            <p style={styles.emptyText}>No analyses yet. Click <strong>Add New</strong> to run one.</p>
          </div>
        )}
      </div>

      {showForm && (
        <FormModal
          form={form}
          setForm={setForm}
          editing={editing}
          submitting={submitting}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          onExcel={handleExcel}
        />
      )}
    </div>
  );
}

// ---- Per-method curve inputs (sample + reference, each split into X / Y) ----

function CurveXY({ label, xValue, yValue, onX, onY, xPlaceholder, yPlaceholder }) {
  return (
    <div>
      <div style={styles.curveLabel}>{label}</div>
      <div style={styles.xyGrid}>
        <div style={styles.formGroup}>
          <label style={styles.xyLabel}>X · Temperature</label>
          <textarea value={xValue} onChange={(e) => onX(e.target.value)} style={styles.textarea} rows={7} placeholder={xPlaceholder} />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.xyLabel}>Y · Signal</label>
          <textarea value={yValue} onChange={(e) => onY(e.target.value)} style={styles.textarea} rows={7} placeholder={yPlaceholder} />
        </div>
      </div>
    </div>
  );
}

function MethodInputs({
  method, sampleX, sampleY, refMode, refX, refY,
  onSampleX, onSampleY, onRefMode, onRefX, onRefY,
}) {
  return (
    <div style={styles.methodCard}>
      <div style={styles.methodTitle}>{method} Method</div>

      <CurveXY
        label="Sample curve"
        xValue={sampleX} yValue={sampleY} onX={onSampleX} onY={onSampleY}
        xPlaceholder={'21.26\n21.84\n23.28\n...'}
        yPlaceholder={'0.3157\n-0.0849\n-0.4521\n...'}
      />

      <div style={styles.refHeader}>
        <span style={styles.curveLabel}>Reference curve</span>
        <div style={styles.refToggle}>
          <button
            type="button"
            style={{ ...styles.refToggleBtn, ...(refMode === 'builtin' ? styles.refToggleActive : {}) }}
            onClick={() => onRefMode('builtin')}
          >
            Built-in
          </button>
          <button
            type="button"
            style={{ ...styles.refToggleBtn, ...(refMode === 'custom' ? styles.refToggleActive : {}) }}
            onClick={() => onRefMode('custom')}
          >
            Custom
          </button>
        </div>
      </div>

      {refMode === 'custom' ? (
        <CurveXY
          label={null}
          xValue={refX} yValue={refY} onX={onRefX} onY={onRefY}
          xPlaceholder={'20.17\n22.76\n26.50\n...'}
          yPlaceholder={'0.338\n0.011\n-0.186\n...'}
        />
      ) : (
        <div style={styles.builtinNote}>Using the verified built-in {method} reference curve.</div>
      )}
    </div>
  );
}

// ---- Add / Edit modal ------------------------------------------------------

function FormModal({ form, setForm, editing, submitting, onClose, onSubmit, onExcel }) {
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderLeft}>
            <span style={styles.modalIcon}>{editing ? <FaEdit size={20} /> : <FaPlus size={20} />}</span>
            <h2 style={styles.modalTitle}>{editing ? 'Edit Analysis' : 'New Oil Originality Analysis'}</h2>
          </div>
          <button style={styles.modalClose} onClick={onClose}><FaTimes size={20} /></button>
        </div>

        <form onSubmit={onSubmit} style={styles.modalForm}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Custom Name <span style={styles.required}>*</span></label>
              <input
                type="text" value={form.custom_name} required
                onChange={(e) => set('custom_name', e.target.value)}
                style={styles.formInput} placeholder="e.g., Unit-3 oil sample"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}><FaCalendarAlt size={13} style={styles.labelIcon} /> Date</label>
              <input
                type="date" value={form.sample_date}
                onChange={(e) => set('sample_date', e.target.value)}
                style={styles.formInput}
              />
            </div>
          </div>

          {editing ? (
            <div style={styles.noteBox}>
              <FaShieldAlt size={14} color="#8b5cf6" /> Curve data is immutable. Editing updates the name, date and notes only.
            </div>
          ) : (
            <>
              {/* Input mode toggle */}
              <div style={styles.modeToggle}>
                <button
                  type="button"
                  style={{ ...styles.modeBtn, ...(form.inputMode === 'paste' ? styles.modeBtnActive : {}) }}
                  onClick={() => set('inputMode', 'paste')}
                >
                  <FaPaste size={14} /> Copy / Paste
                </button>
                <button
                  type="button"
                  style={{ ...styles.modeBtn, ...(form.inputMode === 'excel' ? styles.modeBtnActive : {}) }}
                  onClick={() => set('inputMode', 'excel')}
                >
                  <FaFileExcel size={14} /> File Upload
                </button>
              </div>

              {form.inputMode === 'paste' ? (
                <div style={styles.methodsGrid}>
                  <MethodInputs
                    method="DSC"
                    sampleX={form.dscSampleX} sampleY={form.dscSampleY}
                    refMode={form.dscRefMode} refX={form.dscRefX} refY={form.dscRefY}
                    onSampleX={(v) => set('dscSampleX', v)} onSampleY={(v) => set('dscSampleY', v)}
                    onRefMode={(v) => set('dscRefMode', v)}
                    onRefX={(v) => set('dscRefX', v)} onRefY={(v) => set('dscRefY', v)}
                  />
                  <MethodInputs
                    method="DTA"
                    sampleX={form.dtaSampleX} sampleY={form.dtaSampleY}
                    refMode={form.dtaRefMode} refX={form.dtaRefX} refY={form.dtaRefY}
                    onSampleX={(v) => set('dtaSampleX', v)} onSampleY={(v) => set('dtaSampleY', v)}
                    onRefMode={(v) => set('dtaRefMode', v)}
                    onRefX={(v) => set('dtaRefX', v)} onRefY={(v) => set('dtaRefY', v)}
                  />
                </div>
              ) : (
                <div style={styles.excelBox}>
                  <label style={styles.excelLabel}>
                    <FaFileExcel size={20} color="#10b981" />
                    <span>{form.excel?.filename || 'Choose an .xlsx / .xls / .txt / .csv file'}</span>
                    <input type="file" accept=".xlsx,.xls,.txt,.csv,.tsv" onChange={onExcel} style={{ display: 'none' }} />
                  </label>
                  <p style={styles.excelHint}>
                    Eight separate columns (X = temperature, Y = signal), same as the paste boxes:<br />
                    Sample (required): <code>DSC sample x</code>, <code>DSC sample y</code>, <code>DTA sample x</code>, <code>DTA sample y</code>.<br />
                    Reference (optional): <code>DSC reference x</code>, <code>DSC reference y</code>, <code>DTA reference x</code>, <code>DTA reference y</code> — omit to use the built-in references.
                  </p>
                  {form.excel && (
                    <div style={styles.excelParsed}>
                      <FaCheckCircle color="#10b981" />
                      <span>
                        DSC sample: {form.excel.dsc.temperature.length} pts • DTA sample: {form.excel.dta.temperature.length} pts<br />
                        DSC ref: {form.excel.dsc_reference ? `${form.excel.dsc_reference.temperature.length} pts` : 'built-in'} • DTA ref: {form.excel.dta_reference ? `${form.excel.dta_reference.temperature.length} pts` : 'built-in'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Notes</label>
            <textarea
              value={form.notes} onChange={(e) => set('notes', e.target.value)}
              style={styles.textarea} rows={2} placeholder="Optional remarks"
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Analyzing…' : (editing ? 'Save Changes' : 'Run Analysis')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'white', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  headerIcon: { width: '48px', height: '48px', background: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748b', margin: '4px 0 0 0', display: 'flex', alignItems: 'center' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  statIcon: { width: '44px', height: '44px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#0f172a', display: 'block' },
  statLabel: { fontSize: '13px', color: '#94a3b8', display: 'block' },
  tableContainer: { background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' },
  tableHeader: { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: '15px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center' },
  tableCount: { fontSize: '13px', fontWeight: '400', color: '#94a3b8', marginLeft: '4px' },
  rowNumber: { fontWeight: '600', color: '#94a3b8', fontSize: '13px' },
  dateCell: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px' },
  nameCell: { fontWeight: '600', color: '#0f172a', fontSize: '14px' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  actionButtons: { display: 'flex', gap: '6px' },
  actionBtn: { width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  actionBtnEdit: { background: '#fffbeb', color: '#f59e0b' },
  actionBtnDelete: { background: '#fef2f2', color: '#ef4444' },
  actionBtnOpen: { background: '#f5f3ff', color: '#8b5cf6' },
  empty: { padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  emptyText: { color: '#94a3b8', fontSize: '14px', margin: 0 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', borderRadius: '16px', padding: '32px', width: '920px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  modalHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  modalIcon: { width: '40px', height: '40px', background: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 },
  modalClose: { width: '36px', height: '36px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  formLabel: { fontSize: '13px', fontWeight: '500', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' },
  labelIcon: { color: '#94a3b8' },
  hint: { fontSize: '11px', color: '#94a3b8', fontWeight: '400' },
  required: { color: '#ef4444' },
  formInput: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical' },
  methodsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  methodCard: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fafafa' },
  methodTitle: { fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 },
  curveLabel: { fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  xyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  xyLabel: { fontSize: '11px', fontWeight: '500', color: '#64748b' },
  refHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' },
  refToggle: { display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' },
  refToggleBtn: { padding: '5px 12px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', color: '#64748b' },
  refToggleActive: { background: 'white', color: '#8b5cf6', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
  builtinNote: { fontSize: '12px', color: '#6d28d9', background: '#f5f3ff', padding: '10px 12px', borderRadius: '8px' },
  modeToggle: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' },
  modeBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#64748b' },
  modeBtnActive: { background: 'white', color: '#8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  excelBox: { border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '20px', background: '#f8fafc' },
  excelLabel: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '16px', fontSize: '14px', color: '#475569', fontWeight: '500' },
  excelHint: { fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '8px 0 0 0' },
  excelParsed: { marginTop: '12px', padding: '10px 14px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' },
  noteBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f5f3ff', borderRadius: '8px', color: '#6d28d9', fontSize: '13px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' },
  cancelBtn: { padding: '10px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  submitBtn: { padding: '10px 28px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};

export default OilOriginality;
