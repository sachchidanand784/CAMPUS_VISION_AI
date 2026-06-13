import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import {
  Camera, MapPin, LogOut, LogIn, User, BookOpen, Calendar,
  History, ShieldCheck, AlertTriangle, Phone, Mail,
  CheckCircle2, XCircle, Clock3, ClipboardList, ChevronDown, ChevronUp,
  Timer, TrendingUp, RefreshCw,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

/* ─── UTC-safe datetime helpers ─────────────────────────── */
const toUTC = (iso) => {
  if (!iso) return null;
  return (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) ? iso : iso + 'Z';
};
const fmtTime = (iso) => {
  const d = toUTC(iso);
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const fmtDate = (iso) => {
  const d = toUTC(iso);
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDay = (iso) => {
  const d = toUTC(iso);
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
};

/* ─── Status Circle Component ────────────────────────────── */
const StatusCircle = ({ done, label, color, icon: Icon, time }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    <div style={{
      width: 72, height: 72, borderRadius: '50%',
      background: done ? color + '22' : '#f1f5f9',
      border: `3px solid ${done ? color : '#e2e8f0'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.4s ease',
      boxShadow: done ? `0 0 0 6px ${color}18` : 'none',
    }}>
      <Icon size={28} color={done ? color : '#cbd5e1'} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: done ? color : '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      {time && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{time}</div>}
    </div>
  </div>
);

/* ─── History Row Component ──────────────────────────────── */
const HistoryRow = ({ rec, isEven }) => (
  <tr style={{ borderBottom: '1px solid #f1f5f9', background: isEven ? 'white' : '#fafafa' }}>
    <td style={{ padding: '12px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fmtDay(rec.entry_time)}</div>
      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fmtDate(rec.entry_time)}</div>
    </td>
    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{fmtTime(rec.entry_time)}</td>
    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.875rem' }}>
      {rec.exit_time ? fmtTime(rec.exit_time) : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>No exit</span>}
    </td>
    <td style={{ padding: '12px 16px' }}>
      <span style={{
        fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
        background: rec.is_late ? '#fee2e2' : '#dcfce7',
        color: rec.is_late ? '#dc2626' : '#16a34a',
      }}>
        {rec.is_late ? 'Late' : 'On-Time'}
      </span>
    </td>
    <td style={{ padding: '12px 16px' }}>
      <span style={{
        fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
        background: rec.marked_by === 'gateman' ? '#fef3c7' : '#f0f9ff',
        color: rec.marked_by === 'gateman' ? '#92400e' : '#0369a1',
      }}>
        {rec.marked_by === 'gateman' ? 'Gate Man' : 'Self'}
      </span>
    </td>
  </tr>
);

/* ─── Status Helpers ─────────────────────────────────────── */
const getStatusClasses = (student) => {
  if (student.is_blocked) return 'status-blocked';
  if (student.late_count >= 4) return 'status-strict-warning';
  if (student.late_count >= 3) return 'status-warning';
  return 'status-present';
};
const getStatusLabel = (student) => {
  if (student.is_blocked) return 'Blocked';
  if (student.late_count >= 4) return 'Strict Warning';
  if (student.late_count >= 3) return 'Warning';
  return 'Active';
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const StudentDashboard = ({ token }) => {
  const webcamRef = useRef(null);
  const headers   = { Authorization: `Bearer ${token}` };

  /* state */
  const [profile,      setProfile]      = useState(null);
  const [todayStatus,  setTodayStatus]  = useState(null);   // { has_entry, has_exit, entry_time, exit_time, is_late }
  const [history,      setHistory]      = useState([]);
  const [showCamera,   setShowCamera]   = useState(false);
  const [cameraMode,   setCameraMode]   = useState(null);   // 'entry' | 'exit'
  const [statusMsg,    setStatusMsg]    = useState('');
  const [feedback,     setFeedback]     = useState(null);   // { type: 'success'|'error', text }
  const [showHistory,  setShowHistory]  = useState(false);
  const [historyPage,  setHistoryPage]  = useState(1);
  const PAGE_SIZE = 10;

  /* ── fetch helpers ── */
  const fetchProfile = useCallback(async () => {
    const res = await axios.get(`${API}/api/auth/me`, { headers });
    setProfile(res.data);
  }, [token]);

  const fetchToday = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/attendance/my/today`, { headers });
      setTodayStatus(res.data);
    } catch { setTodayStatus(null); }
  }, [token]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/attendance/my/history`, { headers });
      setHistory(res.data);
    } catch { setHistory([]); }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchToday();
  }, [token]);

  /* auto-dismiss feedback after 5 s */
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  /* ── attendance capture ── */
  const handleAttendance = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setStatusMsg('Verifying identity & location…');

    const geoTimeout = setTimeout(() => {
      finalizeAttendance(imageSrc, null, null);
    }, 10000);

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(geoTimeout); finalizeAttendance(imageSrc, pos.coords.latitude, pos.coords.longitude); },
          ()    => { clearTimeout(geoTimeout); finalizeAttendance(imageSrc, null, null); },
          { timeout: 8000 }
        );
      } else {
        clearTimeout(geoTimeout);
        finalizeAttendance(imageSrc, null, null);
      }
    } catch { clearTimeout(geoTimeout); finalizeAttendance(imageSrc, null, null); }
  };

  const finalizeAttendance = async (imageSrc, lat, lon) => {
    try {
      const endpoint = cameraMode === 'exit' ? '/api/attendance/exit' : '/api/attendance/mark/face';
      const res = await axios.post(`${API}${endpoint}`, { image_base64: imageSrc, lat, lon }, { headers });
      const data = res.data;

      let label = '';
      if (cameraMode === 'exit') {
         if (data.status === 'EarlyExit') {
            label = 'Exit Marked Successfully (Early Exit)';
         } else {
            label = 'Exit Marked Successfully (On Time)';
         }
      } else {
         if (data.status === 'LateEntry' || data.is_late) {
            label = 'Entry Marked Successfully (Late Entry)';
         } else {
            label = 'Entry Marked Successfully (On Time)';
         }
      }

      setFeedback({ type: 'success', text: `✅ ${label}` });
      setShowCamera(false);
      setStatusMsg('');
      await fetchToday();
      await fetchProfile();
      if (showHistory) await fetchHistory();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Verification failed. Please try again.' });
      setShowCamera(false);
      setStatusMsg('');
    }
  };

  /* ── history toggle ── */
  const handleShowHistory = async () => {
    if (!showHistory && history.length === 0) await fetchHistory();
    setShowHistory(v => !v);
    setHistoryPage(1);
  };

  /* ── derived display values ── */
  const pagedHistory = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);
  const totalPages   = Math.ceil(history.length / PAGE_SIZE);
  const onTimeCount  = history.filter(r => !r.is_late).length;
  const lateCount    = history.filter(r =>  r.is_late).length;

  if (!profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="pulse-primary" style={{ width: 40, height: 40, background: '#3b82f6', borderRadius: '50%' }}></div>
    </div>
  );

  return (
    <div className="main-content animate-fade-in">

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Student Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Welcome back, {profile.name}. Your campus status is secure.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: 9, height: 9, background: '#22c55e', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>SYSTEM ACTIVE</span>
        </div>
      </div>

      {/* ── FEEDBACK BANNER ── */}
      {feedback && (
        <div className="animate-fade-in" style={{
          padding: '14px 20px', borderRadius: '14px', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.9rem',
          background: feedback.type === 'success' ? '#f0fdf4' : '#fff1f2',
          border:     `1px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color:      feedback.type === 'success' ? '#16a34a' : '#dc2626',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {feedback.text}
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'inherit', padding: 0 }}>×</button>
        </div>
      )}

      {/* ── TODAY STATUS CARD ── */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>

          {/* Left: circles */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' }}>
              Today's Attendance Status — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
              <StatusCircle
                done={todayStatus?.has_entry}
                label="Entry"
                color="#22c55e"
                icon={todayStatus?.has_entry ? CheckCircle2 : LogIn}
                time={todayStatus?.has_entry ? fmtTime(todayStatus.entry_time) : 'Not marked'}
              />
              {/* connector line */}
              <div style={{ marginTop: '35px', flex: 1, maxWidth: '60px', height: '2px', background: todayStatus?.has_entry ? '#22c55e44' : '#e2e8f0', borderRadius: '2px' }}></div>
              <StatusCircle
                done={todayStatus?.has_exit}
                label="Exit"
                color="#3b82f6"
                icon={todayStatus?.has_exit ? CheckCircle2 : LogOut}
                time={todayStatus?.has_exit ? fmtTime(todayStatus.exit_time) : 'Not marked'}
              />
            </div>
          </div>

          {/* Right: late/on-time badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            {todayStatus?.has_entry ? (
              <div style={{
                padding: '14px 22px', borderRadius: '16px', textAlign: 'center',
                background: todayStatus.is_late ? '#fff1f2' : '#f0fdf4',
                border: `1px solid ${todayStatus.is_late ? '#fca5a5' : '#86efac'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1rem', color: todayStatus.is_late ? '#dc2626' : '#16a34a' }}>
                  {todayStatus.is_late ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
                  {todayStatus.is_late ? 'LATE ARRIVAL' : 'ON TIME ✓'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  {todayStatus.is_late ? 'Infraction recorded on your account' : 'Good punctuality today!'}
                </div>
              </div>
            ) : (
              <div style={{ padding: '14px 22px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>No entry yet today</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>Mark entry to begin your day</div>
              </div>
            )}

            <button
              onClick={() => { fetchToday(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} /> Refresh status
            </button>
          </div>
        </div>
      </div>

      {/* ── PROFILE + ACTION ROW ── */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Profile Card */}
        <div className="card glass-effect" style={{ borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={profile.face_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
                alt="Profile"
                style={{ width: 100, height: 100, borderRadius: '20px', objectFit: 'cover', border: '3px solid white', boxShadow: 'var(--shadow-md)' }}
              />
              <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: '#3b82f6', color: 'white', padding: '5px', borderRadius: '8px' }}>
                <ShieldCheck size={16} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{profile.name}</h3>
                <span className={`status-badge ${getStatusClasses(profile)}`}>
                  {getStatusLabel(profile)}
                </span>
              </div>
              <p style={{ color: '#3b82f6', fontWeight: 700, margin: '4px 0 10px', fontSize: '0.9rem' }}>{profile.student_id}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} color="#94a3b8" /> {profile.course}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#94a3b8" /> Year {profile.year}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="#94a3b8" /> {profile.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="#94a3b8" /> {profile.mobile || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Late count bar */}
          <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>Late Infractions</span>
              <span style={{ fontWeight: 800, color: profile.is_blocked ? '#dc2626' : profile.late_count >= 4 ? '#c2410c' : profile.late_count >= 3 ? '#a16207' : '#3b82f6' }}>{profile.late_count} / 5</span>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px', transition: 'width 0.6s ease',
                width: `${(profile.late_count / 5) * 100}%`,
                background: profile.late_count >= 4 ? '#f97316' : profile.late_count >= 3 ? '#eab308' : '#22c55e',
              }}></div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {profile.is_blocked
                ? <><AlertTriangle size={13} color="#dc2626" /> Access suspended — visit admin</>
                : profile.late_count >= 4
                ? <><AlertTriangle size={13} color="#c2410c" /> Strict Warning — 1 strike remaining!</>
                : profile.late_count >= 3
                ? <><AlertTriangle size={13} color="#a16207" /> Warning — punctuality required</>
                : <><ShieldCheck size={13} color="#22c55e" /> Account in good standing</>
              }
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="card" style={{ background: '#0f172a', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(45deg, rgba(59,130,246,0.12), transparent)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                <MapPin size={20} color="#3b82f6" /> Attendance Actions
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '6px' }}>AI VERIFIED</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={(e) => { 
                  if (profile.is_blocked) {
                    e.preventDefault();
                    setFeedback({ type: 'error', text: 'You are blocked due to repeated late entries' });
                    return;
                  }
                  if (todayStatus?.has_entry && !todayStatus?.has_exit) {
                     e.preventDefault();
                     return;
                  }
                  setShowCamera(true); setCameraMode('entry'); setFeedback(null); 
                }}
                className={profile.is_blocked ? "btn btn-outline" : "btn btn-primary"}
                style={{ 
                  padding: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                  borderColor: profile.is_blocked ? '#ef4444' : '',
                  color: profile.is_blocked ? '#ef4444' : '',
                  opacity: (profile.is_blocked || (todayStatus?.has_entry && !todayStatus?.has_exit)) ? 0.6 : 1,
                  cursor: (profile.is_blocked || (todayStatus?.has_entry && !todayStatus?.has_exit)) ? 'not-allowed' : 'pointer'
                }}
              >
                <LogIn size={20} /> 
                {profile.is_blocked ? 'ENTRY BLOCKED' : 'MARK CAMPUS ENTRY'}
                {(!profile.is_blocked && todayStatus?.has_entry && !todayStatus?.has_exit) && (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>IN CAMPUS</span>
                )}
              </button>
              <button
                onClick={(e) => { 
                  if (!todayStatus?.has_entry || todayStatus?.has_exit) {
                     e.preventDefault();
                     return;
                  }
                  setShowCamera(true); setCameraMode('exit'); setFeedback(null); 
                }}
                className="btn btn-outline"
                style={{ 
                  background: 'transparent', padding: '1.1rem', color: 'white', borderColor: 'rgba(255,255,255,0.2)', 
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                  opacity: (!todayStatus?.has_entry || todayStatus?.has_exit) ? 0.5 : 1,
                  cursor: (!todayStatus?.has_entry || todayStatus?.has_exit) ? 'not-allowed' : 'pointer'
                }}
              >
                <LogOut size={20} /> MARK CAMPUS EXIT
              </button>
            </div>

            {/* Today's quick stats */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
              {[
                { label: 'Total Days', value: history.length || '—', icon: Calendar },
                { label: 'On Time',    value: onTimeCount  || '—', icon: Timer     },
                { label: 'Late',       value: lateCount    || '—', icon: Clock3    },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ATTENDANCE HISTORY TOGGLE BUTTON ── */}
      <button
        onClick={handleShowHistory}
        className="btn btn-outline"
        style={{ width: '100%', justifyContent: 'center', gap: '10px', padding: '14px', marginBottom: showHistory ? '0' : '1rem', borderRadius: '14px' }}
      >
        <ClipboardList size={20} />
        {showHistory ? 'Hide Attendance Log' : 'Check Attendance Log'}
        {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* ── HISTORY PANEL ── */}
      {showHistory && (
        <div className="card animate-fade-in" style={{ padding: 0, marginTop: '12px' }}>
          {/* header with stats */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={20} color="#3b82f6" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Your Attendance History</h3>
              <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{history.length} records</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontWeight: 700 }}>
                <TrendingUp size={14} /> {onTimeCount} On-Time
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#dc2626', fontWeight: 700 }}>
                <Clock3 size={14} /> {lateCount} Late
              </span>
            </div>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8' }}>No attendance records found.</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc' }}>
                    <tr>
                      {['Date', 'Entry Time', 'Exit Time', 'Status', 'Marked By'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.map((rec, i) => <HistoryRow key={rec.id} rec={rec} isEven={i % 2 === 0} />)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              {totalPages > 1 && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Showing {(historyPage - 1) * PAGE_SIZE + 1}–{Math.min(historyPage * PAGE_SIZE, history.length)} of {history.length}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}
                      className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>← Prev</button>
                    <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages}
                      className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── CAMERA MODAL ── */}
      {showCamera && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.85)', zIndex: 2000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '480px', background: 'white', padding: '20px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>
                {cameraMode === 'entry' ? '📥 Entry Verification' : '📤 Exit Verification'}
              </h3>
              <button onClick={() => { setShowCamera(false); setStatusMsg(''); }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', height: '340px' }}>
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Face guide */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '180px', height: '240px', border: '2px dashed #3b82f6', borderRadius: '50%',
                boxShadow: '0 0 0 1000px rgba(0,0,0,0.42)', pointerEvents: 'none',
              }}>
                <div style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                  ALIGN FACE HERE
                </div>
              </div>
            </div>

            {statusMsg && (
              <div style={{ textAlign: 'center', marginTop: '14px', color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="pulse-primary" style={{ display: 'inline-block', width: 8, height: 8, background: '#3b82f6', borderRadius: '50%' }}></div>
                {statusMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={handleAttendance} className="btn btn-primary" style={{ flex: 2, padding: '14px' }} disabled={!!statusMsg}>
                {statusMsg ? 'VERIFYING…' : 'CAPTURE & PROCEED'}
              </button>
              <button onClick={() => { setShowCamera(false); setStatusMsg(''); }} className="btn btn-outline" style={{ flex: 1 }} disabled={!!statusMsg}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
