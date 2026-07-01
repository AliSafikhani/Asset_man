// Pagination.jsx
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

  const pageNumbers = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div style={styles.paginationContainer}>
      <div style={styles.paginationInfo}>
        Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
      </div>
      <div style={styles.paginationControls}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{...styles.paginationButton, ...(currentPage === 1 ? styles.paginationButtonDisabled : {})}}
        >
          ⟪
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{...styles.paginationButton, ...(currentPage === 1 ? styles.paginationButtonDisabled : {})}}
        >
          ‹
        </button>
        
        {startPage > 1 && (
          <>
            <button onClick={() => onPageChange(1)} style={styles.paginationButton}>1</button>
            {startPage > 2 && <span style={styles.paginationEllipsis}>…</span>}
          </>
        )}
        
        {pageNumbers.map(num => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            style={{
              ...styles.paginationButton,
              ...(num === currentPage ? styles.paginationButtonActive : {})
            }}
          >
            {num}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span style={styles.paginationEllipsis}>…</span>}
            <button onClick={() => onPageChange(totalPages)} style={styles.paginationButton}>{totalPages}</button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{...styles.paginationButton, ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})}}
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{...styles.paginationButton, ...(currentPage === totalPages ? styles.paginationButtonDisabled : {})}}
        >
          ⟫
        </button>
      </div>
      <div style={styles.pageSizeSelector}>
        <label>Show:</label>
        <select value={pageSize} onChange={onPageSizeChange} style={styles.pageSizeSelect}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
};

const styles = {
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '10px 0',
    marginBottom: '10px',
    borderBottom: '1px solid #e0e0e0'
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#666'
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap'
  },
  paginationButton: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#333',
    cursor: 'pointer',
    fontSize: '14px',
    minWidth: '32px',
    transition: 'all 0.2s'
  },
  paginationButtonActive: {
    backgroundColor: '#667eea',
    color: 'white',
    borderColor: '#667eea'
  },
  paginationButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  paginationEllipsis: {
    padding: '0 8px',
    color: '#666'
  },
  pageSizeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  pageSizeSelect: {
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export default Pagination;