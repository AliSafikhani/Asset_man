// frontend/src/components/AssetDetail/common/SubTabNavigation.jsx
import React from 'react';

const SubTabNavigation = ({ tabs, activeId, onSelect }) => {
  return (
    <div style={styles.container}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          style={{
            ...styles.tab,
            ...(activeId === tab.id ? styles.activeTab : {}),
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
    overflowX: 'auto',
  },
  tab: {
    padding: '6px 16px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569', // darker (was #64748b)
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  activeTab: {
    background: '#667eea',
    color: 'white',
    boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
  },
};

export default SubTabNavigation;