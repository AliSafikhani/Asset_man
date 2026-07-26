// frontend/src/components/AssetDetail/tabs/AssetProfileTab/subTabs/Specifications.jsx
import React from 'react';
import { FaDownload, FaPrint, FaMicrochip } from 'react-icons/fa';

// ---- Helpers ----
const formatValue = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return val;
};

const formatUnit = (val, unit) => {
  if (val === null || val === undefined || val === '') return '—';
  return unit ? `${val} ${unit}` : val;
};

// ---- Grouped sections for each asset type ----
const getSections = (asset) => {
  const type = asset?.asset_type;
  const base = [
    {
      title: 'General Information',
      icon: <FaMicrochip />,
      items: [
        { label: 'Asset Name', value: asset?.asset_name },
        { label: 'Asset Code', value: asset?.asset_code },
        { label: 'Asset Tag', value: asset?.asset_tag },
        { label: 'Manufacturer', value: asset?.manufacturer },
        { label: 'Model', value: asset?.model },
        { label: 'Serial Number', value: asset?.serial_number },
        { label: 'Manufacturing Year', value: asset?.manufacturing_year },
        { label: 'Installation Date', value: asset?.installation_date ? new Date(asset.installation_date).toLocaleDateString() : null },
        { label: 'Commissioning Date', value: asset?.commissioning_date ? new Date(asset.commissioning_date).toLocaleDateString() : null },
        { label: 'Location', value: asset?.location_within_plant },
        { label: 'Criticality Level', value: asset?.criticality_level },
      ],
    },
  ];

  if (type === 'transformer' && asset?.transformer) {
    const t = asset.transformer;
    return [
      ...base,
      {
        title: 'Electrical Ratings',
        items: [
          { label: 'Transformer Types ', value: t.transformer_type },
          { label: 'Power Rating', value: formatUnit(t.power_rating_mva, 'MVA') },
          { label: 'Power Rating (Forced)', value: formatUnit(t.power_rating_mva_forced, 'MVA') },
          { label: 'HV Voltage', value: formatUnit(t.hv_voltage_kv, 'kV') },
          { label: 'LV Voltage', value: formatUnit(t.lv_voltage_kv, 'kV') },
          { label: 'Tertiary Voltage', value: formatUnit(t.tertiary_voltage_kv, 'kV') },
          { label: 'Frequency', value: formatUnit(t.frequency_hz, 'Hz') },
          { label: 'Impedance', value: formatUnit(t.impedance_percent, '%') },
          { label: 'Vector Group', value: t.vector_group },
          { label: 'Number of Windings', value: t.number_of_windings },
        ],
      },
      {
        title: 'Mechanical & Cooling',
        items: [
          { label: 'Cooling Type', value: t.cooling_type },
          { label: 'Insulation Type', value: t.insulation_type },
          { label: 'Insulation Class', value: t.insulation_class },
          { label: 'Oil Type', value: t.oil_type },
          { label: 'Breathing', value: t.breathing },
          { label: 'Oil Inhibition', value: t.oil_inhibition },
          { label: 'Paper Type', value: t.paper_type },
          { label: 'Oil Volume', value: formatUnit(t.oil_volume_liters, 'L') },
          { label: 'Weight', value: formatUnit(t.weight_kg, 'kg') },
          { label: 'Insulation Level (HV)', value: formatUnit(t.insulation_level_hv_kv, 'kV') },
          { label: 'Insulation Level (LV)', value: formatUnit(t.insulation_level_lv_kv, 'kV') },
          { label: 'Temperature Rise (Oil)', value: formatUnit(t.temperature_rise_oil_c, '°C') },
          { label: 'Temperature Rise (Winding)', value: formatUnit(t.temperature_rise_winding_c, '°C') },
        ],
      },
      {
        title: 'Losses & Performance',
        items: [
          { label: 'No‑Load Loss', value: formatUnit(t.no_load_loss_w, 'W') },
          { label: 'Load Loss', value: formatUnit(t.load_loss_w, 'W') },
          { label: 'Efficiency', value: formatUnit(t.efficiency_percent, '%') },
          { label: 'Magnetizing Current', value: formatUnit(t.magnetizing_current_percent, '%') },
        ],
      },
      {
        title: 'Tap Changer & Protection',
        items: [
          { label: 'Has On‑Load Tap Changer', value: formatValue(t.has_on_load_tap_changer) },
          { label: 'Number of Taps', value: t.number_of_taps },
          { label: 'HV Tap Range', value: formatUnit(t.hv_tap_range_percent, '%') },
          { label: 'Has Buchholz Relay', value: formatValue(t.has_buchholz_relay) },
          { label: 'Has Pressure Relief', value: formatValue(t.has_pressure_relief) },
        ],
      },
    ];
  }

  if (type === 'motor' && asset?.motor) {
    const m = asset.motor;
    return [
      ...base,
      {
        title: 'Electrical Ratings',
        items: [
          { label: 'Power Rating', value: formatUnit(m.power_rating_kw, 'kW') },
          { label: 'Voltage', value: formatUnit(m.voltage_v, 'V') },
          { label: 'Current', value: formatUnit(m.current_a, 'A') },
          { label: 'Frequency', value: formatUnit(m.frequency_hz, 'Hz') },
          { label: 'Power Factor', value: m.power_factor },
        ],
      },
      {
        title: 'Mechanical & Performance',
        items: [
          { label: 'Speed', value: formatUnit(m.speed_rpm, 'RPM') },
          { label: 'Efficiency', value: formatUnit(m.efficiency_percent, '%') },
          { label: 'Frame Size', value: m.frame_size },
          { label: 'Insulation Class', value: m.insulation_class },
          { label: 'Duty Type', value: m.duty_type },
          { label: 'Mounting Type', value: m.mounting_type },
          { label: 'Weight', value: formatUnit(m.weight_kg, 'kg') },
        ],
      },
    ];
  }

  if (type === 'generator' && asset?.generator) {
    const g = asset.generator;
    return [
      ...base,
      {
        title: 'Electrical Ratings',
        items: [
          { label: 'Power Rating', value: formatUnit(g.power_rating_mva, 'MVA') },
          { label: 'Voltage', value: formatUnit(g.voltage_kv, 'kV') },
          { label: 'Current', value: formatUnit(g.current_a, 'A') },
          { label: 'Frequency', value: formatUnit(g.frequency_hz, 'Hz') },
          { label: 'Power Factor', value: g.power_factor },
          { label: 'Number of Poles', value: g.number_of_poles },
        ],
      },
      {
        title: 'Mechanical & Performance',
        items: [
          { label: 'Speed', value: formatUnit(g.speed_rpm, 'RPM') },
          { label: 'Efficiency', value: formatUnit(g.efficiency_percent, '%') },
          { label: 'Insulation Class', value: g.insulation_class },
          { label: 'Excitation Type', value: g.excitation_type },
          { label: 'Cooling Type', value: g.cooling_type },
          { label: 'Weight', value: formatUnit(g.weight_kg, 'kg') },
        ],
      },
    ];
  }

  // Fallback: show only general info
  return base;
};

// ---- Main Component ----
const Specifications = ({ asset }) => {
  if (!asset) return <div>No asset data</div>;

  const sections = getSections(asset);

  const handleDownload = () => {
    // TODO: generate PDF or CSV
    alert('Download functionality coming soon.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Technical Specifications</h2>
        <div style={styles.actions}>
          <button onClick={handleDownload} style={styles.actionButton}>
            <FaDownload /> Download
          </button>
          <button onClick={handlePrint} style={styles.actionButton}>
            <FaPrint /> Print
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {sections.map((section, idx) => (
          <div key={idx} style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              {section.icon && <span style={{ marginRight: '8px' }}>{section.icon}</span>}
              {section.title}
            </h3>
            <table style={styles.table}>
              <tbody>
                {section.items.map((item, i) => (
                  <tr key={i} style={styles.row}>
                    <td style={styles.label}>{item.label}</td>
                    <td style={styles.value}>{item.value || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Styles ----
const styles = {
  container: {
    padding: '16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#1e293b',
    transition: 'all 0.2s',
    '&:hover': {
      background: '#f1f5f9',
    },
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  sectionCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  row: {
    borderBottom: '1px solid #f1f5f9',
  },
  label: {
    padding: '6px 8px 6px 0',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    width: '45%',
  },
  value: {
    padding: '6px 0 6px 8px',
    fontSize: '13px',
    fontWeight: '400',
    color: '#0f172a',
    wordBreak: 'break-word',
  },
};

export default Specifications;