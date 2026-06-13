import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Registration from './pages/Registration';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LiveGate from './pages/LiveGate';

import Home from './pages/Home';
import GateManDashboard from './pages/GateManDashboard';

const AxiosInterceptor = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          onLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate, onLogout]);

  return null;
};

const ProtectedRoute = ({ token, children }) => {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Navigation = ({ token, onLogout }) => {
  const [showLoginDropdown, setShowLoginDropdown] = React.useState(false);

  const handleAboutClick = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="glass-effect" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="nav-container">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
           <div style={{ width: 35, height: 35, background: 'var(--primary-gradient)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 900 }}>CV</div>
           <h1 style={{ color: 'var(--primary-blue)', margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>CampusVisionAI</h1>
        </Link>
        
        <nav className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/#about" onClick={handleAboutClick} className="nav-link">About</Link>
          
          {!token ? (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '8px 20px', borderRadius: '12px' }}
                onClick={() => setShowLoginDropdown(!showLoginDropdown)}
              >
                Login ▾
              </button>
              {showLoginDropdown && (
                <div className="dropdown-menu card animate-fade-in" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', minWidth: '200px', zIndex: 100, padding: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                  <Link to="/login?role=student" onClick={() => setShowLoginDropdown(false)} style={{ display: 'block', padding: '10px 15px', textDecoration: 'none', color: 'var(--text-main)', borderRadius: '8px' }} className="hover-bg">Student Access</Link>
                  <Link to="/login?role=gateman" onClick={() => setShowLoginDropdown(false)} style={{ display: 'block', padding: '10px 15px', textDecoration: 'none', color: 'var(--text-main)', borderRadius: '8px' }} className="hover-bg">Gate Man Access</Link>
                  <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
                  <Link to="/login?role=admin" onClick={() => setShowLoginDropdown(false)} style={{ display: 'block', padding: '10px 15px', textDecoration: 'none', color: 'var(--primary-blue)', fontWeight: 600, borderRadius: '8px' }} className="hover-bg">Admin Console</Link>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onLogout} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>Logout</button>
          )}
        </nav>
      </div>
    </header>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    window.location.href = '/login';
  };

  // Provide an inner component so we can use hooks like useNavigate in AxiosInterceptor
  const AppContent = () => (
    <div className="app-container">
      <AxiosInterceptor onLogout={handleLogout} />
      <Navigation token={token} onLogout={handleLogout} />
      <main>
        <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/login" element={<Login setToken={setToken} />} />
           <Route path="/register" element={<Registration />} />
           
           <Route path="/student" element={
             <ProtectedRoute token={token}><StudentDashboard token={token} /></ProtectedRoute>
           } />
           <Route path="/admin" element={
             <ProtectedRoute token={token}><AdminDashboard token={token} /></ProtectedRoute>
           } />
           <Route path="/gateman" element={
             <ProtectedRoute token={token}><GateManDashboard token={token} /></ProtectedRoute>
           } />
           
           <Route path="/live-gate" element={<LiveGate />} />
        </Routes>
      </main>
    </div>
  );

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
