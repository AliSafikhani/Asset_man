import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setCaptcha({
      question: `${num1} + ${num2} = ?`,
      answer: num1 + num2
    });
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (parseInt(captchaInput) !== captcha.answer) {
      toast.error('Invalid CAPTCHA');
      setLoading(false);
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.access_token);
      toast.success('Login successful!');
      if (onLogin) onLogin();
      navigate('/Dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
      generateCaptcha();
      setCaptchaInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🏭</div>
        <h1 style={styles.title}>Asset Management System</h1>
        <p style={styles.subtitle}>Sign in to your account ali</p>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              style={styles.input}
              placeholder="Enter your username"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={styles.input}
              placeholder="Enter your password"
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>CAPTCHA: {captcha.question}</label>
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter the result"
            />
          </div>
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '440px',
    animation: 'fadeIn 0.5s ease-out'
  },
  logo: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '16px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '8px',
    fontSize: '28px',
    fontWeight: '600',
    color: '#1f2937'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: '32px',
    color: '#6b7280',
    fontSize: '14px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#374151',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px'
  }
};

export default Login;
