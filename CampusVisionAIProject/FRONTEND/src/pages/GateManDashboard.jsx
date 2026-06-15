import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Search, Mail, Phone, LogIn, Monitor,
  CalendarDays, ClipboardList, RefreshCw,
  UserCheck, Clock, ChevronUp, ChevronDown,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

/* ─── tiny helpers ─────────────────────────────────────────── */
// Backend stores UTC but may serialize without 'Z'. Append 'Z' so browser
// correctly converts UTC → local (IST) instead of treating it as local time.
const toUTC = (iso) => {
  if (!iso) return null;
  return (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) ? iso : iso + 'Z';
};

const fmtTime = (iso) => {
  const d = toUTC(iso);
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const fmtDateShort = (iso) => {
  const d = toUTC(iso);
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const fmtDateTime = (iso) => {
  const d = toUTC(iso);
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    + ' · ' + dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const todayISO = () => new Date().toISOString().split('T')[0];

const Badge = ({ label, color }) => (
  <span style={{
    fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px',
    borderRadius: '6px', background: color + '22', color, whiteSpace: 'nowrap',
  }}>{label}</span>
);

/* ─── Status Helpers ───────────────────────────────────────── */
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

/* ─── Entry Table ──────────────────────────────────────────── */
const getBadgeProps = (status, isLate) => {
  if (status === 'EarlyExit') return { label: 'Early Exit', color: '#ea580c' };
  if (status === 'Re-entered') return { label: 'Re-entered', color: '#7e22ce' };
  if (status === 'Re-exited') return { label: 'Re-exited', color: '#0e7490' };
  return isLate ? { label: 'Late', color: '#ef4444' } : { label: 'On-Time', color: '#22c55e' };
};

const EntryTable = ({ rows, searchTerm, setSearchTerm }) => {
  const filtered = rows.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      (r.student_name || '').toLowerCase().includes(q) ||
      (r.student_id   || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="card animate-fade-in" style={{ padding: 0, marginTop: '1.5rem' }}>
      {/* search bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name or ID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* table */}
      <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No entries found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
              <tr>
                {['Student Name', 'Roll No.', 'Entry Time', 'Exit Time', 'Type', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.student_name}</td>
                  <td style={{ padding: '12px 16px', color: '#3b82f6', fontFamily: 'monospace' }}>{row.student_id || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 600 }}>{fmtDateTime(row.entry_time)}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{row.exit_time ? fmtDateTime(row.exit_time) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Still inside</span>}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge
                      label={row.marked_by === 'gateman' ? 'Manual' : 'Auto'}
                      color={row.marked_by === 'gateman' ? '#f59e0b' : '#3b82f6'}
                    />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {(() => {
                      const { label, color } = getBadgeProps(row.status, row.is_late);
                      return <Badge label={label} color={color} />;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ─── Main Component ───────────────────────────────────────── */
const GateManDashboard = ({ token }) => {
  const headers = { Authorization: `Bearer ${token}` };

  /* profile */
  const [profile, setProfile] = useState(null);

  /* manual entry section */
  const [studentId, setStudentId]       = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [marking, setMarking]           = useState(false);
  const [entryError, setEntryError]     = useState(null);
  const [entrySuccess, setEntrySuccess] = useState(null);

  /* today's summary */
  const [todayEntries, setTodayEntries]   = useState([]);
  const [todayLoading, setTodayLoading]   = useState(false);

  /* date-wise log */
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [dateEntries, setDateEntries]   = useState([]);
  const [dateLoading, setDateLoading]   = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');

  /* UI toggles */
  const [showSummary, setShowSummary]   = useState(true);

  /* ── fetch helpers ── */
  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/auth/me`, { headers });
      setProfile(res.data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchTodayManual = useCallback(async () => {
    setTodayLoading(true);
    try {
      const res = await axios.get(`${API}/api/attendance/today/manual`, { headers });
      setTodayEntries(res.data);
    } catch (e) { console.error(e); }
    finally { setTodayLoading(false); }
  }, [token]);

  const fetchByDate = useCallback(async (date) => {
    setDateLoading(true);
    try {
      const res = await axios.get(`${API}/api/attendance/by-date?date=${date}`, { headers });
      setDateEntries(res.data);
    } catch (e) { console.error(e); }
    finally { setDateLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchTodayManual();
    fetchByDate(todayISO());
    // auto-refresh every 60 s
    const iv = setInterval(() => { fetchTodayManual(); fetchByDate(selectedDate); }, 60000);
    return () => clearInterval(iv);
  }, [token]);

  /* when date picker changes */
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSearchTerm('');
    fetchByDate(e.target.value);
  };

  /* ── student search & mark ── */
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!studentId.trim()) return;
    setMarking(true); setEntryError(null); setEntrySuccess(null); setStudentDetails(null);
    try {
      const res = await axios.get(`${API}/api/admin/students`, { headers });
      const found = res.data.find(s => s.student_id === studentId.trim());
      if (found) setStudentDetails(found);
      else setEntryError('Student ID not found in system.');
    } catch { setEntryError('Search failed. Check your connection.'); }
    finally { setMarking(false); }
  };

  const markAttendance = async (mode = 'entry') => {
    if (!studentDetails) return;
    setMarking(true);
    setEntryError(null);
    setEntrySuccess(null);
    try {
      await axios.post(`${API}/api/attendance/mark/id`, { 
        student_id: studentDetails.student_id,
        mode: mode
      }, { headers });
      setEntrySuccess(`✅ ${mode === 'entry' ? 'Entry' : 'Exit'} recorded for ${studentDetails.name}`);
      setStudentDetails(null);
      setStudentId('');
      // refresh counts
      fetchTodayManual();
      fetchByDate(selectedDate);
    } catch (err) {
      setEntryError(err.response?.data?.detail || 'Failed to mark attendance.');
    } finally { setMarking(false); }
  };

  if (!profile) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#3b82f6', fontWeight: 700, letterSpacing: '0.15em' }}>
      SYNCHRONIZING GATE CONSOLE…
    </div>
  );

  return (
    <div className="main-content animate-fade-in">

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--primary-blue)' }}>Gate Monitor Console</h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Authorized Entry Verification &amp; Attendance Station</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0fdf4', color: '#15803d', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
            <span style={{ width: 9, height: 9, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
            STATION 01 · ONLINE
          </div>
          <button
            onClick={() => { fetchTodayManual(); fetchByDate(selectedDate); }}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── TOP GRID: Profile + Manual Entry ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>

        {/* Profile card */}
        <div className="card glass-effect" style={{ borderTop: '4px solid var(--primary-blue)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`}
                alt="avatar"
                style={{ width: 72, height: 72, borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}
              />
              <div style={{ position: 'absolute', bottom: -4, right: -4, background: '#22c55e', width: 14, height: 14, borderRadius: '50%', border: '2px solid white' }}></div>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{profile.name}</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '4px' }}>
                AUTHORIZED WARDEN
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={15} color="#94a3b8" /> {profile.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={15} color="#94a3b8" /> {profile.mobile || 'Emergency only'}</div>
          </div>
        </div>

        {/* Manual attendance card */}
        <div className="card" style={{ background: '#0f172a', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem', color: 'white', fontSize: '1rem' }}>
            <Search size={20} color="#3b82f6" /> Manual Verification
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginBottom: '1.25rem' }}>Enter Student ID to fetch record and grant access.</p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="e.g. STU12345"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem' }}
            />
            <button className="btn btn-primary" type="submit" disabled={marking} style={{ padding: '0 22px', fontSize: '0.9rem' }}>
              {marking ? '…' : 'Search'}
            </button>
          </form>

          {entryError   && <div style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '12px', borderRadius: '10px', fontSize: '0.825rem', marginBottom: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>{entryError}</div>}
          {entrySuccess && <div style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', padding: '12px', borderRadius: '10px', fontSize: '0.825rem', marginBottom: '12px', border: '1px solid rgba(34,197,94,0.2)' }}>{entrySuccess}</div>}

          {studentDetails && (
            <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #3b82f6', borderRadius: '14px', padding: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                <img
                  src={studentDetails.face_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentDetails.name)}`}
                  alt="student"
                  style={{ width: 80, height: 80, borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                />
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{studentDetails.name}</div>
                    <span className={`status-badge ${getStatusClasses(studentDetails)}`} style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                      {getStatusLabel(studentDetails)}
                    </span>
                  </div>
                  <div style={{ color: '#3b82f6', fontSize: '0.8rem', marginTop: '3px' }}>{studentDetails.student_id}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{studentDetails.course} · Year {studentDetails.year}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => markAttendance('entry')}
                  disabled={marking}
                  style={{ flex: 1, minWidth: '130px', padding: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                >
                  <LogIn size={18} /> {marking ? '...' : 'GRANT ENTRY'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => markAttendance('exit')}
                  disabled={marking}
                  style={{ flex: 1, minWidth: '130px', padding: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#ea580c', borderColor: '#fdba74' }}
                >
                  <LogOut size={18} /> {marking ? '...' : 'RECORD EXIT'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TODAY'S SUMMARY ── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '20px', borderLeft: '5px solid #3b82f6' }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowSummary(v => !v)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#eff6ff', width: 46, height: 46, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={22} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Total Manual Entries</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                {todayLoading ? '—' : todayEntries.length}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b', marginLeft: '8px' }}>Gate-Man marked</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
            {showSummary ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
          </div>
        </div>

        {showSummary && todayEntries.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {todayEntries.slice(0, 6).map(e => (
              <div key={e.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 700 }}>{e.student_name}</span>
                <span style={{ color: '#94a3b8', marginLeft: '6px' }}>{fmtTime(e.entry_time)}</span>
              </div>
            ))}
            {todayEntries.length > 6 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '8px 14px', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 700 }}>
                +{todayEntries.length - 6} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DATE-WISE LOG ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        {/* date picker header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={20} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Date-wise Entry Log</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={handleDateChange}
              style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.875rem', cursor: 'pointer' }}
            />
            {dateLoading && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loading…</span>}
          </div>
        </div>

        {/* date summary strip */}
        <div style={{ display: 'flex', gap: '16px', margin: '16px 0', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Entries', value: dateEntries.length, color: '#3b82f6' },
            { label: 'Manual (Gate)', value: dateEntries.filter(e => e.marked_by === 'gateman').length, color: '#f59e0b' },
            { label: 'Self (App)',    value: dateEntries.filter(e => e.marked_by !== 'gateman').length,  color: '#10b981' },
            { label: 'Late Arrivals',value: dateEntries.filter(e => e.is_late).length,                  color: '#ef4444' },
          ].map(stat => (
            <div key={stat.label} style={{ flex: '1 1 130px', background: '#f8fafc', border: `1px solid ${stat.color}33`, borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* entry table */}
        <EntryTable rows={dateEntries} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>
    </div>
  );
};

export default GateManDashboard;
