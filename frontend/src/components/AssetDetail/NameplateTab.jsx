// NameplateTab.jsx
import React from 'react';
import InfoField from '../common/InfoField';

const NameplateTab = ({ asset }) => {
  return (
    <div style={styles.tabContent}>
      <h2>Nameplate Information</h2>
      <div style={styles.infoGrid}>
        <InfoField label="Asset Name" value={asset.asset_name} />
        <InfoField label="Asset Code" value={asset.asset_code} />
        <InfoField label="Manufacturer" value={asset.manufacturer || '-'} />
        <InfoField label="Model" value={asset.model || '-'} />
        <InfoField label="Status" value={asset.operational_status || 'active'} />
        <InfoField label="Serial Number" value={asset.serial_number || '-'} />
        <InfoField label="Manufacturing Year" value={asset.manufacturing_year || '-'} />
        <InfoField label="Location" value={asset.location_within_plant || '-'} />
      </div>
    </div>
  );
};

const styles = {
  tabContent: { 
    background: 'white', 
    padding: '20px', 
    borderRadius: '10px', 
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
  },
  infoGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
    gap: '15px', 
    marginTop: '20px' 
  }
};

export default NameplateTab;