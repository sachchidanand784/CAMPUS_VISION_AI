import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, MapPin, Users, Mail, Phone, Linkedin, Github, 
  ArrowRight, ShieldAlert, Cpu, Award, MessageSquare, ExternalLink, Activity
} from 'lucide-react';
import heroImage from '../assets/smart_campus_hero.png';

const Home = () => {
  return (
    <div className="home-page animate-fade-in" style={{ background: '#f8fafc' }}>
      
      {/* ── HERO SECTION ── */}
      <section style={{ 
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        color: 'white',
        padding: '80px 20px 100px',
        borderRadius: '0 0 40px 40px',
        overflow: 'hidden',
        marginBottom: '60px'
      }}>
        {/* Decorative background glow elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '60%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="main-content" style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap', padding: 0 }}>
          {/* Hero Left Content */}
          <div style={{ flex: '1', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(59, 130, 246, 0.15)', 
              color: '#60a5fa', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: 700,
              width: 'fit-content',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <Activity size={14} className="pulse-soft" />
              <span>AI-POWERED GATE ATTENDANCE</span>
            </div>

            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 900, 
              lineHeight: 1.15,
              color: 'white',
              textAlign: 'left'
            }}>
              Smart Campus <br />
              <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Attendance System
              </span>
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
              Eliminate physical logs and bypass cards. Track student presence in real time at security gates using edge-based facial biometrics, precise geofencing parameters, and automated strike warnings.
            </p>

            <div className="hero-buttons" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start', margin: '10px 0' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/live-gate" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.15)', padding: '14px 28px' }}>
                Open Live Gate
              </Link>
            </div>

            {/* Quick Micro stats */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', marginTop: '10px' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>&lt; 1 sec</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verification Speed</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>99.9%</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Matching Accuracy</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>100%</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Automated Disciplinary Engine</div>
              </div>
            </div>
          </div>

          {/* Hero Right Graphic */}
          <div style={{ flex: '1', minWidth: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            {/* Soft background glow directly behind the image */}
            <div style={{ position: 'absolute', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 60%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
            
            <img 
              src={heroImage} 
              alt="Smart Campus Gateway Illustration" 
              className="floating-hero-img"
              style={{ 
                width: '100%', 
                maxWidth: '460px', 
                height: 'auto',
                borderRadius: '28px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1.5px solid rgba(255, 255, 255, 0.08)'
              }}
            />

            {/* Float overlay pill */}
            <div className="floating-badge" style={{ 
              position: 'absolute', 
              top: '15%', 
              left: '5%', 
              background: 'rgba(15, 23, 42, 0.85)', 
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'white',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} className="pulse-soft"></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Security Status: Secured</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section id="about" className="main-content" style={{ marginBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>System Architecture</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Built using modern fullstack components designed to guarantee security, accuracy, and quick verification at the campus gates.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          <div className="card glass-effect" style={{ borderTop: '4px solid #3b82f6', transition: 'all 0.3s ease' }}>
            <div className="contact-icon-wrapper" style={{ width: '56px', height: '56px', borderRadius: '14px', marginBottom: '20px', fontSize: '1.5rem' }}>
              <Cpu size={24} />
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>Facial Biometrics</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Verifies matching using facial landmarks. Compares entry captures instantly with registered cloud profile photos. Prevents ID proxy checking and attendance forgery.
            </p>
          </div>

          <div className="card glass-effect" style={{ borderTop: '4px solid #10b981', transition: 'all 0.3s ease' }}>
            <div className="contact-icon-wrapper" style={{ width: '56px', height: '56px', borderRadius: '14px', marginBottom: '20px', fontSize: '1.5rem', color: '#10b981', background: 'rgba(16,185,129,0.1)' }}>
              <MapPin size={24} />
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>Geofencing Perimeter</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Enforces location validation during attendance scans. Uses device coordinates to ensure students can only mark their check-in when physically standing within gate boundaries.
            </p>
          </div>

          <div className="card glass-effect" style={{ borderTop: '4px solid #f59e0b', transition: 'all 0.3s ease' }}>
            <div className="contact-icon-wrapper" style={{ width: '56px', height: '56px', borderRadius: '14px', marginBottom: '20px', fontSize: '1.5rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
              <ShieldAlert size={24} />
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>Discipline Automation</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Built-in policy engine. Keeps track of late arrivals and automatically flags accounts. Triggers official warnings at 3 late entries, and suspends gate access automatically at 5 strikes.
            </p>
          </div>
        </div>
      </section>

      {/* ── AUTOMATED DISCIPLINARY STRIKE ABOUT SECTION ── */}
      <section style={{ background: '#f1f5f9', padding: '80px 20px' }}>
        <div className="main-content" style={{ display: 'flex', gap: '50px', alignItems: 'center', flexWrap: 'wrap', padding: 0 }}>
          
          {/* Left Diagram Box */}
          <div style={{ flex: '1', minWidth: '320px' }}>
            <div className="card" style={{ background: '#1e293b', color: 'white', padding: '30px' }}>
              <h3 style={{ color: '#60a5fa', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} /> Smart Disciplinary Policy Flow
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { title: "First Entry", desc: "Checks timing against scheduled lectures.", color: "#3b82f6" },
                  { title: "3 Late Strikes", desc: "Puts student in Warning status. Emails alert notification.", color: "#eab308" },
                  { title: "4 Late Strikes", desc: "Triggers Strict Warning level. Final warning threshold.", color: "#f97316" },
                  { title: "5 Late Strikes", desc: "Suspends account immediately. Gate block active.", color: "#ef4444" }
                ].map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '14px', position: 'relative' }}>
                    {idx < 3 && (
                      <div style={{ position: 'absolute', left: '11px', top: '22px', bottom: '-18px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                    )}
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', 
                      background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 900, color: 'white', flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>{step.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Text Content */}
          <div style={{ flex: '1.2', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Automatic Attendance & Disciplinary Engine
            </h2>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              CampusVisionAI operates as a fully automated security and disciplinary guard. Attendance isn't just about recording values; it actively maintains punctuality requirements. 
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Administrators configure daily check-in deadlines and exit permissions. The system monitors entry stamps. Once a student accumulates 5 late check-ins, the security gates automatically lock out access for that student, forcing an administrative reset.
            </p>
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              <div style={{ background: 'white', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', color: 'var(--primary-blue)' }}>Admin Settings</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Customizable date/weekly deadlines</span>
              </div>
              <div style={{ background: 'white', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', color: '#10b981' }}>Secure Reports</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Instant logs for wardens and guards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REGISTER OPTIONS ── */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '12px', fontSize: '2.25rem', fontWeight: 800 }}>System Gateways</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '0.95rem' }}>Select your portal below to sign in or register.</p>
        
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
           <div className="card hover-scale" style={{ width: '100%', maxWidth: '300px', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>🎓</div>
              <h3>Student Portal</h3>
              <p style={{ margin: '12px 0 20px', color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.5 }}>
                Mark self-attendance using face scans, check attendance logs, and track warnings.
              </p>
              <Link to="/register?role=student" className="btn btn-primary" style={{ width: '100%' }}>Register Student</Link>
           </div>
           
           <div className="card hover-scale" style={{ width: '100%', maxWidth: '300px', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>🚧</div>
              <h3>Gate Man Terminal</h3>
              <p style={{ margin: '12px 0 20px', color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.5 }}>
                Verify incoming students, override biometric failures, and record campus entries/exits.
              </p>
              <Link to="/register?role=gateman" className="btn btn-outline" style={{ width: '100%', color: '#f59e0b', borderColor: '#f59e0b' }}>Register Gate Man</Link>
           </div>

           <div className="card hover-scale" style={{ width: '100%', maxWidth: '300px', textAlign: 'center', borderTop: '4px solid #ef4444' }}>
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>💻</div>
              <h3>Admin Command</h3>
              <p style={{ margin: '12px 0 20px', color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.5 }}>
                Configure geofencing radius parameters, manage timings, and unlock blocked accounts.
              </p>
              <Link to="/register?role=admin" className="btn btn-outline" style={{ width: '100%', color: '#ef4444', borderColor: '#ef4444' }}>Register Admin</Link>
           </div>
        </div>
      </section>

      {/* ── CONTACT & DEVELOPER PROFILE SECTION ── */}
      <section style={{ background: '#f8fafc', padding: '80px 20px', borderTop: '1px solid #e2e8f0' }}>
        <div className="main-content" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>Developer Contact</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
              Have questions, feedback, or system integration inquiries? Reach out directly.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {/* Left: Contact Info cards */}
            <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '10px' }}>Contact Channels</h3>
              
              <a href="mailto:snsachidanand784@gmail.com" className="contact-item">
                <div className="contact-icon-wrapper">
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Address</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>snsachidanand784@gmail.com</div>
                </div>
              </a>

              <a href="tel:9450885320" className="contact-item">
                <div className="contact-icon-wrapper">
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mobile Number</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>+91 9450885320</div>
                </div>
              </a>

              <a href="https://www.linkedin.com/in/784sachchidanandyadav" target="_blank" rel="noopener noreferrer" className="contact-item">
                <div className="contact-icon-wrapper" style={{ color: '#0077b5', background: 'rgba(0,119,181,0.1)' }}>
                  <Linkedin size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LinkedIn Profile</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    784sachchidanandyadav <ExternalLink size={13} />
                  </div>
                </div>
              </a>

              <a href="https://github.com/sachchidanand784" target="_blank" rel="noopener noreferrer" className="contact-item">
                <div className="contact-icon-wrapper" style={{ color: '#24292e', background: 'rgba(36,41,46,0.1)' }}>
                  <Github size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>GitHub Handle</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    sachchidanand784 <ExternalLink size={13} />
                  </div>
                </div>
              </a>
            </div>

            {/* Right: Message Form Mockup */}
            <div style={{ flex: '1.2', minWidth: '300px' }}>
              <div className="card glass-effect" style={{ height: '100%' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontSize: '1.25rem' }}>
                  <MessageSquare size={20} color="var(--primary-blue)" /> Quick Inquiries
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
                  Drop a message regarding project collaborations, deployment assistance, or custom features.
                </p>
                
                <form onSubmit={(e) => { e.preventDefault(); alert("Mock Message Submitted Successfully!"); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                      <input type="text" placeholder="Your Name" required style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                      <input type="email" placeholder="Your Email" required style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <input type="text" placeholder="Subject" required style={{ fontSize: '0.85rem', padding: '10px 14px' }} />
                  </div>
                  <div className="form-group">
                    <textarea 
                      placeholder="Type your message here..." 
                      required 
                      rows="3"
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
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid #e2e8f0', background: 'white', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '0.85rem' }}>© 2026 CampusVisionAI. All rights reserved. Designed for smarter, safer college gates.</p>
      </footer>
    </div>
  );
};

export default Home;
