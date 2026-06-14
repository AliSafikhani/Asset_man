import { useState } from 'react';
import App from './App_original';

function AppContent({ onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    window.location.href = '/login';
  };

  return (
    <div>
      {/* Add logout button to your existing UI */}
      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 1000 }}>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 0 100px rgba(0,0,0,0.5)',
          zIndex: 1001
        }}>
          <p>Are you sure you want to logout?</p>
          <button onClick={handleLogout} style={{ marginRight: '10px', background: '#dc3545', color: 'white', padding: '5px 15px', border: 'none', borderRadius: '3px' }}>Yes</button>
          <button onClick={() => setShowLogoutConfirm(false)} style={{ background: '#6c757d', color: 'white', padding: '5px 15px', border: 'none', borderRadius: '3px' }}>No</button>
        </div>
      )}

      <App />
    </div>
  );
}

export default AppContent;
