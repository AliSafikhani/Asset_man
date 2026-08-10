/**
 * CoverPage — report page 1: company / plant / transformer nameplate.
 * File: frontend/src/features/report/pages/CoverPage.jsx
 */

import ReportPage from '../ReportPage';
import { PageFooter } from '../components/PageChrome';
import { colors } from '../reportTheme';
import { displayValue, fmtDate } from '../reportData';

const NameGroup = ({ title, rows }) => (
  <div style={{ marginBottom: 14 }}>
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: colors.ink,
        borderBottom: `2px solid ${colors.brandDark}`,
        paddingBottom: 4,
        marginBottom: 8,
      }}
    >
      {title}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
      {rows.map(([label, value]) => (
        <div
          key={label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            padding: '3px 0',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <span style={{ color: colors.faint }}>{label}</span>
          <span style={{ fontWeight: 600, color: colors.ink, textAlign: 'right' }}>
            {displayValue(value)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const CoverPage = ({ innerRef, cover, pageNo, pageCount, generatedAt }) => {
  const asset = cover?.asset || {};
  const t = cover?.transformer || {};

  return (
    <ReportPage ref={innerRef}>
      {/* Brand banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colors.brandDark}, ${colors.brandDarker})`,
          borderRadius: 14,
          padding: '30px 32px',
          color: colors.bg,
          marginBottom: 22,
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase' }}>
          Transformer Asset Report
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>
          {displayValue(asset.asset_name)}
        </div>
        <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 6 }}>
          {displayValue(cover?.company_name)} &nbsp;•&nbsp; {displayValue(cover?.plant_name)}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          Asset code: {displayValue(asset.asset_code)}
          {asset.asset_tag ? ` • Tag: ${asset.asset_tag}` : ''}
        </div>
      </div>

      {/* Company / plant */}
      <NameGroup
        title="Organisation"
        rows={[
          ['Company', cover?.company_name],
          ['Plant', cover?.plant_name],
          ['Location in plant', asset.location_within_plant],
          ['Operational status', asset.operational_status],
          ['Criticality', asset.criticality_level],
        ]}
      />

      {/* Identification */}
      <NameGroup
        title="Identification"
        rows={[
          ['Manufacturer', asset.manufacturer],
          ['Model', asset.model],
          ['Serial number', asset.serial_number],
          ['Manufacturing year', asset.manufacturing_year],
          ['Installation date', fmtDate(asset.installation_date)],
          ['Commissioning date', fmtDate(asset.commissioning_date)],
        ]}
      />

      {/* Electrical nameplate */}
      <NameGroup
        title="Electrical Nameplate"
        rows={[
          ['Type', t.transformer_type],
          ['Cooling', t.cooling_type],
          ['Vector group', t.vector_group],
          ['Windings', t.number_of_windings],
          ['Rated power', t.power_rating_mva != null ? `${t.power_rating_mva} MVA` : null],
          ['Forced rating', t.power_rating_mva_forced != null ? `${t.power_rating_mva_forced} MVA` : null],
          ['HV voltage', t.hv_voltage_kv != null ? `${t.hv_voltage_kv} kV` : null],
          ['LV voltage', t.lv_voltage_kv != null ? `${t.lv_voltage_kv} kV` : null],
          ['Tertiary voltage', t.tertiary_voltage_kv != null ? `${t.tertiary_voltage_kv} kV` : null],
          ['Impedance', t.impedance_percent != null ? `${t.impedance_percent} %` : null],
          ['Frequency', t.frequency_hz != null ? `${t.frequency_hz} Hz` : null],
          ['Efficiency', t.efficiency_percent != null ? `${t.efficiency_percent} %` : null],
        ]}
      />

      {/* Insulation & construction */}
      <NameGroup
        title="Insulation & Construction"
        rows={[
          ['Oil type', t.oil_type],
          ['Paper type', t.paper_type],
          ['Insulation type', t.insulation_type],
          ['Insulation class', t.insulation_class],
          ['Oil volume', t.oil_volume_liters != null ? `${t.oil_volume_liters} L` : null],
          ['Weight', t.weight_kg != null ? `${t.weight_kg} kg` : null],
          ['No-load loss', t.no_load_loss_w != null ? `${t.no_load_loss_w} W` : null],
          ['Load loss', t.load_loss_w != null ? `${t.load_loss_w} W` : null],
          ['OLTC', t.has_on_load_tap_changer == null ? null : t.has_on_load_tap_changer ? 'Yes' : 'No'],
          ['Buchholz relay', t.has_buchholz_relay == null ? null : t.has_buchholz_relay ? 'Yes' : 'No'],
          ['Pressure relief', t.has_pressure_relief == null ? null : t.has_pressure_relief ? 'Yes' : 'No'],
        ]}
      />

      <PageFooter
        left={`${displayValue(cover?.plant_name)} — ${displayValue(asset.asset_code)} • Generated ${generatedAt}`}
        pageNo={pageNo}
        pageCount={pageCount}
      />
    </ReportPage>
  );
};

export default CoverPage;
