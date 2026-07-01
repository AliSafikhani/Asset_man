// InfoField.jsx - Reusable component for displaying field information
import React from 'react';

const InfoField = ({ label, value }) => {
  return (
    <div style={styles.infoField}>
      <span style={styles.infoLabel}>{label}:</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
};

const styles = {
  infoField: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '10px', 
    borderBottom: '1px solid #eee' 
  },
  infoLabel: { 
    fontWeight: 'bold', 
    color: '#666' 
  },
  infoValue: { 
    color: '#333' 
  }
};

export default InfoField;