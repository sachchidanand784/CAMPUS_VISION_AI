import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, Mail, Lock, User, Phone, BookOpen, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

const Registration = () => {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedRole = queryParams.get('role') || 'student';
  
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', student_id: '', mobile: '', 
    course: '', year: '', password: ''
  });
  const [status, setStatus] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImage(imageSrc);
    }
  }, [webcamRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!image && selectedRole === 'student') {
        return setStatus({ type: 'error', msg: 'Face capture is required for student biometric entry.' });
      }
      
      setStatus({ type: 'loading', msg: 'Processing registration...' });
      
      // Use specific endpoints as requested
      let endpoint;
      if (selectedRole === 'gateman') {
        endpoint = `${apiUrl}/api/students/register/gateman`;
      } else if (selectedRole === 'admin') {
        endpoint = `${apiUrl}/api/students/register/admin`;
      } else {
        endpoint = `${apiUrl}/api/students/register/student`;
      }

      await axios.post(endpoint, {
        ...formData,
        role: selectedRole,
        year: selectedRole === 'student' ? (parseInt(formData.year) || 1) : 0,
        face_image_base64: image
      });
      
      setStatus({ type: 'success', msg: 'Registration Complete! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: (err.response?.data?.detail || 'Registration failed. Please try again.') });
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '3rem auto', padding: '0 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary-blue)' }}>
            Join CampusVisionAI
        </h1>
        <p style={{ color: '#64748b' }}>Register as <strong style={{ color: 'var(--primary-blue)' }}>{selectedRole === 'gateman' ? 'GATE MAN' : selectedRole === 'admin' ? 'ADMIN' : 'STUDENT'}</strong></p>
      </div>

      <div className="card">
        {status && (
            <div style={{ 
                padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '2rem',
                background: status.type === 'success' ? '#dcfce7' : status.type === 'loading' ? '#eff6ff' : '#fee2e2',
                color: status.type === 'success' ? '#166534' : status.type === 'loading' ? '#1d4ed8' : '#991b1b',
                display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600
            }}>
                {status.msg}
            </div>
        )}
        
        <form className={selectedRole === 'student' ? "registration-form" : ""} onSubmit={handleSubmit} style={selectedRole === 'student' ? {} : { display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Personal Credentials</h3>
            
            <div className="form-group" style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '1rem', top: '0.875rem', color: '#94a3b8' }} size={18} />
                <input placeholder="Enter Email" type="email" required style={{ paddingLeft: '3rem' }} onChange={e=>setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="form-row-grid">
                <div className="form-group"><input placeholder="Full Name" required onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
                {selectedRole !== 'admin' && (
                  <div className="form-group">
                    <input 
                      placeholder={selectedRole === 'gateman' ? "Gate Man ID" : "Student ID"} 
                      required 
                      onChange={e=>setFormData({...formData, student_id: e.target.value})} 
                    />
                  </div>
                )}
            </div>

            <div className="form-row-grid">
                <div className="form-group"><input placeholder="Mobile Number" required onChange={e=>setFormData({...formData, mobile: e.target.value})} /></div>
                {selectedRole === 'student' && (
                  <div className="form-group">
                      <select required onChange={e=>setFormData({...formData, year: e.target.value})} style={{ padding: '0.875rem' }}>
                          <option value="">Select Year</option>
                          <option value="1">Year 1</option>
                          <option value="2">Year 2</option>
                          <option value="3">Year 3</option>
                          <option value="4">Year 4</option>
                      </select>
                  </div>
                )}
            </div>

            {selectedRole === 'student' && (
              <div className="form-group"><input placeholder="Academic Course" required onChange={e=>setFormData({...formData, course: e.target.value})} /></div>
            )}
            
            <div className="form-group" style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '1rem', top: '0.875rem', color: '#94a3b8' }} size={18} />
                <input placeholder="Password" type="password" required style={{ paddingLeft: '3rem' }} onChange={e=>setFormData({...formData, password: e.target.value})} />
            </div>
          </div>
          
          {selectedRole === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Camera size={24} color="#3b82f6" /> Biometric Setup
              </h3>
              
              <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '2px solid #e2e8f0', background: '#000', height: '250px' }}>
                  {!image ? (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      screenshotFormat="image/jpeg"
                    />
                  ) : (
                    <img src={image} alt="Captured face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
              </div>

              {!image ? (
                  <button type="button" onClick={capture} className="btn btn-primary" style={{ width: '100%' }}>
                      <Camera size={18} /> Capture Face
                  </button>
              ) : (
                  <button type="button" onClick={() => setImage(null)} className="btn btn-outline" style={{ width: '100%' }}>
                      Retake
                  </button>
              )}
            </div>
          )}
          
          <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem' }}>
                REGISTER {selectedRole === 'gateman' ? 'GATE MAN' : selectedRole === 'admin' ? 'ADMIN' : 'STUDENT'} ACCOUNT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
