// frontend/src/components/AssetDetail/Pagination.jsx
import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalRecords, 
  pageSize, 
  onPageChange, 
  onPageSizeChange 
}) => {
  const totalPages = Math.ceil(totalRecords / pageSize);
  if (totalPages <= 1) return null;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  return (
    <div style={styles.container}>
      <div style={styles.info}>
        {totalRecords} records
      </div>
      <div style={styles.controls}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{ ...styles.button, ...(currentPage === 1 ? styles.disabled : {}) }}
        >
          «
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ ...styles.button, ...(currentPage === 1 ? styles.disabled : {}) }}
        >
          ‹
        </button>
        {startPage > 2 && <span style={styles.ellipsis}>…</span>}
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(num => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            style={{
              ...styles.button,
              ...(num === currentPage ? styles.active : {}),
            }}
          >
            {num}
          </button>
        ))}
        {endPage < totalPages - 1 && <span style={styles.ellipsis}>…</span>}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ ...styles.button, ...(currentPage === totalPages ? styles.disabled : {}) }}
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{ ...styles.button, ...(currentPage === totalPages ? styles.disabled : {}) }}
        >
          »
        </button>
      </div>
      <div style={styles.sizeControl}>
        <select value={pageSize} onChange={onPageSizeChange} style={styles.select}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '8px 0',
    color: '#1e293b',
  },
  info: {
    fontSize: '14px',
    color: '#475569',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  button: {
    padding: '4px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#1e293b',
    transition: 'all 0.2s',
  },
  active: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea',
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  ellipsis: {
    padding: '0 4px',
    color: '#475569',
  },
  sizeControl: {
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    padding: '4px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#1e293b',
    background: 'white',
  },
};

export default Pagination;