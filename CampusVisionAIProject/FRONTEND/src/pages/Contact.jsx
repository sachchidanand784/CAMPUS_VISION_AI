import React, { useState } from 'react';
import { Mail, Phone, Linkedin, Github, MessageSquare, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="main-content animate-fade-in" style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          color: 'var(--primary-blue)', 
          padding: '6px 16px', 
          borderRadius: '20px', 
          fontSize: '0.8rem', 
          fontWeight: 700,
          letterSpacing: '0.05em'
        }}>
          GET IN TOUCH
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '12px', color: 'var(--text-main)' }}>
          Contact the Developer
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', maxWidth: '600px', margin: '8px auto 0' }}>
          Have technical questions, deployment requests, or feature inquiries regarding CampusVisionAI? Feel free to reach out.
        </p>
      </div>

      {submitted && (
        <div className="animate-fade-in" style={{
          padding: '14px 20px', borderRadius: '14px', marginBottom: '2rem', fontWeight: 600, fontSize: '0.9rem',
          background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <ShieldCheck size={18} />
          Thank you! Your message has been simulated and sent successfully.
        </div>
      )}

      {/* Main Grid */}
      <div className="grid-2" style={{ alignItems: 'stretch' }}>
        
        {/* Left: Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Direct Communication</h3>
          
          <a href="mailto:snsachidanand784@gmail.com" className="contact-item" style={{ textDecoration: 'none' }}>
            <div className="contact-icon-wrapper">
              <Mail size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Address</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>snsachidanand784@gmail.com</div>
            </div>
          </a>

          <a href="tel:9450885320" className="contact-item" style={{ textDecoration: 'none' }}>
            <div className="contact-icon-wrapper">
              <Phone size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mobile Number</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>+91 9450885320</div>
            </div>
          </a>

          <a href="https://www.linkedin.com/in/784sachchidanandyadav" target="_blank" rel="noopener noreferrer" className="contact-item" style={{ textDecoration: 'none' }}>
            <div className="contact-icon-wrapper" style={{ color: '#0077b5', background: 'rgba(0,119,181,0.1)' }}>
              <Linkedin size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LinkedIn Profile</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                784sachchidanandyadav <ExternalLink size={13} />
              </div>
            </div>
          </a>

          <a href="https://github.com/sachchidanand784" target="_blank" rel="noopener noreferrer" className="contact-item" style={{ textDecoration: 'none' }}>
            <div className="contact-icon-wrapper" style={{ color: '#24292e', background: 'rgba(36,41,46,0.1)' }}>
              <Github size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GitHub Handle</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)' }}>
                sachchidanand784 <ExternalLink size={13} />
              </div>
            </div>
          </a>
        </div>

        {/* Right: Message Form */}
        <div>
          <div className="card glass-effect" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <MessageSquare size={20} color="var(--primary-blue)" /> Send a Message
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Use the form below to ask questions about system features or deployment configurations.
            </p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    style={{ fontSize: '0.85rem' }} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{ fontSize: '0.85rem' }} 
                  />
                </div>
              </div>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Subject" 
                  required 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  style={{ fontSize: '0.85rem' }} 
                />
              </div>
              <div className="form-group">
                <textarea 
                  placeholder="Type your message details here..." 
                  required 
                  rows="4"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    borderRadius: '12px', 
                    border: '2px solid transparent', 
                    background: '#f8fafc',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                Send Message <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
