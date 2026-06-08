import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('username', email); // OAuth2 expects username
      params.append('password', password);
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      setToken(token);
      
      // Get user role
      const meRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const role = meRes.data.role;
      localStorage.setItem('role', role);

      if (role === 'admin') navigate('/admin');
      else if (role === 'gate_man') navigate('/gateman');
      else navigate('/student');
      
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Login failed. Please check your email and password.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '4rem auto' }} className="card">
      <h2 style={{ textAlign: 'center' }}>Welcome Back</h2>
      <p style={{ textAlign: 'center', marginBottom: '2rem' }}>Please enter your details to sign in.</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
          Sign In
        </button>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>Administrator setup required?</p>
          <a href="/register?role=admin" style={{ color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'none' }}>Create new Admin account</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
