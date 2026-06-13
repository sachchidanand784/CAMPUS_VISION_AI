import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-page animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        padding: '100px 20px', 
        textAlign: 'center', 
        background: 'var(--primary-gradient)', 
        color: 'white',
        borderRadius: '0 0 50px 50px',
        marginBottom: '60px'
      }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', fontWeight: '800' }}>CampusVisionAI</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '40px', opacity: '0.9', maxWidth: '700px', margin: '0 auto 40px' }}>
          Next-generation AI-powered smart attendance system using real-time face recognition and geofencing.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link to="/register" className="btn" style={{ background: 'white', color: 'var(--primary-blue)', padding: '15px 40px' }}>Get Started</Link>
          <a href="#about" className="btn btn-outline" style={{ background: 'transparent', color: 'white', borderColor: 'white' }}>Learn More</a>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="main-content" style={{ marginBottom: '80px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '50px', fontSize: '2.5rem' }}>Core Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div className="card glass-effect">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👤</div>
            <h3 style={{ marginBottom: '15px' }}>Face Recognition</h3>
            <p>Seamlessly mark attendance using advanced facial biometrics. Fast, secure, and touchless.</p>
          </div>
          <div className="card glass-effect">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📍</div>
            <h3 style={{ marginBottom: '15px' }}>Geofencing</h3>
            <p>Ensure attendance is only marked within campus boundaries using precise location validation.</p>
          </div>
          <div className="card glass-effect">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛡️</div>
            <h3 style={{ marginBottom: '15px' }}>Admin Control</h3>
            <p>Comprehensive dashboard for managing students, viewing logs, and configuring system settings.</p>
          </div>
        </div>
      </section>

      {/* Register Options */}
      <section style={{ background: '#f1f5f9', padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '40px' }}>Join the System</h2>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
           <div className="card" style={{ width: '300px', textAlign: 'center' }}>
              <h3>Register as Student</h3>
              <p style={{ margin: '15px 0' }}>Join the campus and start tracking your presence automatically.</p>
              <Link to="/register?role=student" className="btn btn-primary" style={{ width: '100%' }}>Register Student</Link>
           </div>
           <div className="card" style={{ width: '300px', textAlign: 'center' }}>
              <h3>Register as Gate Man</h3>
              <p style={{ margin: '15px 0' }}>Help students mark attendance manually when needed.</p>
              <Link to="/register?role=gateman" className="btn btn-outline" style={{ width: '100%' }}>Register Gate Man</Link>
           </div>
        </div>
      </section>

      <footer style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>© 2026 CampusVisionAI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
