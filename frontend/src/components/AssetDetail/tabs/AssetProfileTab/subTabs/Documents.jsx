// frontend/src/components/AssetDetail/tabs/AssetProfileTab/subTabs/Documents.jsx
import React, { useState, useEffect } from 'react';
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileArchive,
  FaDownload,
  FaTrash,
  FaPlus,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';
import API from '../../../../../services/api';

// ---- Helper: get file icon based on extension ----
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return <FaFilePdf color="#ef4444" />;
    case 'doc':
    case 'docx': return <FaFileWord color="#3b82f6" />;
    case 'xls':
    case 'xlsx': return <FaFileExcel color="#10b981" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg': return <FaFileImage color="#8b5cf6" />;
    case 'zip':
    case 'rar':
    case '7z': return <FaFileArchive color="#f59e0b" />;
    default: return <FaFileAlt color="#64748b" />;
  }
};

// ---- Helper: format file size ----
const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
};

// ---- Helper: format date ----
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ---- Upload Modal ----
const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setUploading(false);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onUpload(selectedFile);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Upload Document</h3>
          <button onClick={onClose} style={styles.closeButton}><FaTimes /></button>
        </div>
        <div
          style={{
            ...styles.dropZone,
            ...(dragOver ? styles.dropZoneActive : {}),
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {selectedFile ? (
            <div style={styles.filePreview}>
              <span style={styles.fileName}>{selectedFile.name}</span>
              <span style={styles.fileSize}>({formatFileSize(selectedFile.size)})</span>
              <button onClick={() => setSelectedFile(null)} style={styles.removeFileButton}>
                <FaTimes />
              </button>
            </div>
          ) : (
            <>
              <FaUpload size={40} color="#94a3b8" />
              <p style={styles.dropText}>Drag & drop a file here, or click to browse</p>
              <input
                type="file"
                onChange={handleFileChange}
                style={styles.hiddenInput}
                id="fileInput"
              />
              <label htmlFor="fileInput" style={styles.browseButton}>Browse</label>
            </>
          )}
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            style={{
              ...styles.submitButton,
              ...(!selectedFile || uploading ? styles.submitButtonDisabled : {}),
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Main Documents Component ----
const Documents = ({ assetId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Replace with your actual API endpoint
        const res = await API.get(`/assets/${assetId}/documents`);
        setDocuments(res.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
        // Fallback mock data
        setDocuments([
          { id: 1, filename: 'Transformer_Manual.pdf', file_type: 'pdf', upload_date: '2024-01-15T10:00:00Z', file_size: 2457600 },
          { id: 2, filename: 'Maintenance_Procedure.docx', file_type: 'docx', upload_date: '2024-02-20T14:30:00Z', file_size: 512000 },
          { id: 3, filename: 'Test_Report_2024.xlsx', file_type: 'xlsx', upload_date: '2024-03-10T09:15:00Z', file_size: 1024000 },
          { id: 4, filename: 'Drawing_Schematic.png', file_type: 'png', upload_date: '2024-04-05T16:45:00Z', file_size: 3072000 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [assetId]);

  // ---- Upload handler ----
  const handleUpload = async (file) => {
    // Replace with your actual upload API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('asset_id', assetId);
    // await API.post(`/assets/${assetId}/documents`, formData);
    console.log('Uploading:', file.name);
    // Mock: add to list
    const newDoc = {
      id: Date.now(),
      filename: file.name,
      file_type: file.name.split('.').pop(),
      upload_date: new Date().toISOString(),
      file_size: file.size,
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  // ---- Delete handler ----
  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      // Replace with your actual delete API
      // await API.delete(`/documents/${docId}`);
      setDocuments(documents.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete document.');
    }
  };

  // ---- Download handler ----
  const handleDownload = (doc) => {
    // Replace with actual download logic (e.g., window.open)
    alert(`Downloading: ${doc.filename}`);
  };

  if (loading) {
    return <div style={styles.loading}>Loading documents...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Asset Documents</h2>
        <button onClick={() => setShowUploadModal(true)} style={styles.uploadButton}>
          <FaPlus /> Upload Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div style={styles.emptyState}>
          <FaFileAlt size={48} color="#94a3b8" />
          <p>No documents uploaded yet.</p>
          <button onClick={() => setShowUploadModal(true)} style={styles.uploadButton}>
            <FaPlus /> Upload First Document
          </button>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>File Name</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Upload Date</th>
                <th style={styles.th}>Size</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.fileIcon}>{getFileIcon(doc.filename)}</span>
                    {doc.filename}
                  </td>
                  <td style={styles.td}>{doc.file_type?.toUpperCase() || '—'}</td>
                  <td style={styles.td}>{formatDate(doc.upload_date)}</td>
                  <td style={styles.td}>{formatFileSize(doc.file_size)}</td>
                  <td style={styles.tdActions}>
                    <button onClick={() => handleDownload(doc)} style={styles.downloadButton} title="Download">
                      <FaDownload />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} style={styles.deleteButton} title="Delete">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
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
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
    '&:hover': {
      background: '#5a6fd6',
    },
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px dashed #e2e8f0',
    color: '#475569',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    background: 'white',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    backgroundColor: '#f1f5f9',
    fontWeight: '600',
    color: '#0f172a',
    borderBottom: '2px solid #e2e8f0',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #e2e8f0',
    color: '#1e293b',
  },
  tdActions: {
    padding: '8px 12px',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    display: 'flex',
    gap: '6px',
  },
  tr: {
    '&:hover': {
      backgroundColor: '#f8fafc',
    },
  },
  fileIcon: {
    marginRight: '8px',
    fontSize: '16px',
  },
  downloadButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#3b82f6',
    fontSize: '16px',
    padding: '4px',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ef4444',
    fontSize: '16px',
    padding: '4px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#475569',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#475569',
  },
  dropZone: {
    border: '2px dashed #e2e8f0',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    marginBottom: '16px',
  },
  dropZoneActive: {
    borderColor: '#667eea',
    background: '#f1f5f9',
  },
  dropText: {
    margin: '8px 0',
    color: '#475569',
  },
  hiddenInput: {
    display: 'none',
  },
  browseButton: {
    display: 'inline-block',
    padding: '6px 16px',
    background: '#667eea',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
  },
  fileName: {
    fontWeight: '500',
    color: '#0f172a',
  },
  fileSize: {
    color: '#475569',
    fontSize: '13px',
  },
  removeFileButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ef4444',
    fontSize: '16px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '8px 16px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#1e293b',
  },
  submitButton: {
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default Documents;