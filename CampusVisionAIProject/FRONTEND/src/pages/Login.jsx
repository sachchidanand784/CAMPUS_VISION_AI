import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, Eye, EyeOff, ShieldAlert, ArrowRight, BookOpen, ShieldCheck, KeyRound } from 'lucide-react';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract role from URL search params (e.g. ?role=student or ?role=gateman)
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'student';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('username', username); // OAuth2 expects username
      params.append('password', password);
      
      // Pass the role as a query parameter so the backend can distinguish if duplicate emails exist
      const url = `${import.meta.env.VITE_API_URL}/api/auth/login${role ? `?role=${role}` : ''}`;
      
      const res = await axios.post(url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      setToken(token);
      
      // Get user role
      const meRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const dbRole = meRes.data.role;
      localStorage.setItem('role', dbRole);

      if (dbRole === 'admin') navigate('/admin');
      else if (dbRole === 'gate_man') navigate('/gateman');
      else navigate('/student');
      
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to customize login page appearance based on role
  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Console',
          subtitle: 'System Administrator Authentication',
          label: 'Email or Username',
          placeholder: 'admin@campusvision.ai',
          badgeBg: 'rgba(99, 102, 241, 0.1)',
          badgeColor: '#6366f1',
          icon: <ShieldCheck size={20} style={{ marginRight: '6px' }} />,
          buttonText: 'Authenticate Admin'
        };
      case 'gateman':
      case 'gate_man':
        return {
          title: 'Gate Man Portal',
          subtitle: 'Security & Access Control Sign In',
          label: 'Email or Gate Man ID',
          placeholder: 'security@campusvision.ai or GT-XXXXXX',
          badgeBg: 'rgba(16, 185, 129, 0.1)',
          badgeColor: '#10b981',
          icon: <KeyRound size={20} style={{ marginRight: '6px' }} />,
          buttonText: 'Secure Access Sign In'
        };
      case 'student':
      default:
        return {
          title: 'Student Dashboard',
          subtitle: 'Access academic attendance & history',
          label: 'Email or Student ID',
          placeholder: 'student@example.com or 231304',
          badgeBg: 'rgba(59, 130, 246, 0.1)',
          badgeColor: '#3b82f6',
          icon: <BookOpen size={20} style={{ marginRight: '6px' }} />,
          buttonText: 'Student Portal Sign In'
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="animate-fade-in" style={{ maxWidth: 460, margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card glass-effect" style={{ border: '1px solid rgba(226, 232, 240, 0.8)', padding: '2.5rem 2.25rem' }}>
        
        {/* Role Badge Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 16px',
            borderRadius: '20px',
            backgroundColor: config.badgeBg,
            color: config.badgeColor,
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {config.icon}
            {config.title}
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Welcome Back
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          {config.subtitle}
        </p>
        
        {error && (
          <div style={{ 
            color: '#b91c1c', 
            backgroundColor: '#fee2e2', 
            padding: '0.875rem 1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem', 
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #fca5a5'
          }}>
            <ShieldAlert size={18} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{config.label}</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '1rem', top: '0.95rem', color: '#94a3b8' }} size={18} />
              <input 
                type="text" 
                placeholder={config.placeholder}
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                style={{ paddingLeft: '3rem', width: '100%' }}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '1rem', top: '0.95rem', color: '#94a3b8' }} size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ paddingLeft: '3rem', paddingRight: '3rem', width: '100%' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '0.85rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {loading ? (
              <span className="animate-spin" style={{ display: 'inline-block', width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              <>
                {config.buttonText}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Need an account?</p>
            <a 
              href={`/register?role=${role}`} 
              style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              className="hover-scale"
            >
              Register as {role === 'gateman' ? 'Gate Man' : role === 'admin' ? 'Admin' : 'Student'}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
