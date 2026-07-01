// DCSTab.jsx
import React, { useState } from 'react';
import DCSManagement from '../DCSManagement';
import DCSVisualization from '../DCSVisualization';

const DCSTab = ({ assetId, assetName, plantId }) => {
  const [dcsSubTab, setDcsSubTab] = useState('management');

  return (
    <div style={styles.tabContent}>
      <div style={styles.dcsSubTabs}>
        <button 
          onClick={() => setDcsSubTab('management')} 
          style={{ 
            ...styles.dcsSubTab, 
            backgroundColor: dcsSubTab === 'management' ? '#667eea' : '#f0f0f0',
            color: dcsSubTab === 'management' ? 'white' : '#333'
          }}
        >
          Signal Management
        </button>
        <button 
          onClick={() => setDcsSubTab('visualization')} 
          style={{ 
            ...styles.dcsSubTab, 
            backgroundColor: dcsSubTab === 'visualization' ? '#667eea' : '#f0f0f0',
            color: dcsSubTab === 'visualization' ? 'white' : '#333'
          }}
        >
          Data Visualization
        </button>
      </div>
      {dcsSubTab === 'management' && <DCSManagement assetId={assetId} assetName={assetName} plantId={plantId} onBack={() => {}} />}
      {dcsSubTab === 'visualization' && <DCSVisualization assetId={assetId} assetName={assetName} onBack={() => {}} />}
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
  dcsSubTabs: { 
    display: 'flex', 
    gap: '10px', 
    marginBottom: '20px', 
    borderBottom: '1px solid #e0e0e0', 
    paddingBottom: '10px' 
  },
  dcsSubTab: { 
    padding: '8px 16px', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontSize: '14px' 
  }
};

export default DCSTab;