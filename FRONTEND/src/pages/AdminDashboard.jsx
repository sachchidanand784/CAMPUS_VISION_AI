import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Users, ClipboardList, Settings, UserCheck, ShieldAlert, Search,
  Trash2, RotateCcw, CalendarDays, Clock, LogIn, LogOut, X,
  CheckCircle, AlertCircle, ChevronRight, BookOpen, Mail, Phone,
} from 'lucide-react';

/* ─── UTC helpers (same pattern as other dashboards) ────── */
const toUTC = (iso) => {
  if (!iso) return null;
  return (iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) ? iso : iso + 'Z';
};
const fmtTime = (iso) => {
  const d = toUTC(iso); if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const fmtDateTime = (iso) => {
  const d = toUTC(iso); if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    + ' · ' + dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

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

const getLogStatusClass = (statusStr, isLate) => {
  const s = (statusStr || '').toLowerCase();
  if (s.includes('block')) return 'status-blocked';
  if (s === 'strict-warning') return 'status-strict-warning';
  if (s.includes('warning')) return 'status-warning';
  // fallback if status string doesn't exist but is_late is true
  if (isLate && !s.includes('present')) return 'status-blocked';
  return 'status-present';
};

/* ─── Generic Modal shell ──────────────────────────────── */
const Modal = ({ title, onClose, children, maxWidth = 780 }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)',
  }}>
    <div className="card animate-fade-in" style={{ width: '92%', maxWidth, background: 'white', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={22} /></button>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
    </div>
  </div>
);

/* ─── Stat Mini-card ────────────────────────────────────── */
const StatCard = ({ title, value, sub, color, icon: Icon, onClick }) => (
  <div className="card hover-scale" onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default', borderTop: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{title}</p>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '6px 0', color }}>{value}</div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>{sub}</p>
      </div>
      <Icon size={36} color={color} opacity={0.18} />
    </div>
    {onClick && (
      <div style={{ marginTop: '12px', fontSize: '0.75rem', color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
        View Details <ChevronRight size={14} />
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   SETTINGS VIEW (Date-wise Timing + Geofence)
═══════════════════════════════════════════════════════════ */
const SettingsView = ({ token, apiUrl }) => {
  const headers = { Authorization: `Bearer ${token}` };

  /* geofence */
  const [geo, setGeo] = useState({ min_range: 0, max_range: 500 });

  /* day-of-week timing */
  const [timings, setTimings] = useState([]);

  /* date-wise timing */
  const [dateTimingDate, setDateTimingDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateTiming, setDateTiming] = useState({ entry_start: '', entry_end: '', exit_start: '', exit_end: '' });
  const [dtMsg, setDtMsg] = useState(null);   // { type: ok|err, text }
  const [dtLoading, setDtLoading] = useState(false);

  useEffect(() => {
    axios.get(`${apiUrl}/api/settings/geofence`, { headers }).then(r => setGeo({ min_range: r.data.min_range, max_range: r.data.max_range })).catch(() => {});
    axios.get(`${apiUrl}/api/settings/timings`,  { headers }).then(r => setTimings(r.data)).catch(() => {});
  }, []);

  /* load date timing when date changes */
  useEffect(() => {
    axios.get(`${apiUrl}/api/settings/date-timing?date=${dateTimingDate}`, { headers })
      .then(r => {
        if (r.data) {
          const fmt = (t) => t ? String(t).substring(0, 5) : '';
          setDateTiming({
            entry_start: fmt(r.data.entry_start),
            entry_end:   fmt(r.data.entry_end),
            exit_start:  fmt(r.data.exit_start),
            exit_end:    fmt(r.data.exit_end),
          });
        } else {
          setDateTiming({ entry_start: '', entry_end: '', exit_start: '', exit_end: '' });
        }
      }).catch(() => {});
  }, [dateTimingDate]);

  const saveDateTiming = async () => {
    setDtLoading(true); setDtMsg(null);
    try {
      await axios.post(`${apiUrl}/api/settings/date-timing`, { date: dateTimingDate, ...dateTiming }, { headers });
      setDtMsg({ type: 'ok', text: `✅ Timing saved for ${dateTimingDate}` });
    } catch (e) {
      setDtMsg({ type: 'err', text: e.response?.data?.detail || 'Failed to save timing.' });
    } finally { setDtLoading(false); }
  };

  const clearDateTiming = async () => {
    await axios.delete(`${apiUrl}/api/settings/date-timing?date=${dateTimingDate}`, { headers }).catch(() => {});
    setDateTiming({ entry_start: '', entry_end: '', exit_start: '', exit_end: '' });
    setDtMsg({ type: 'ok', text: `Date timing cleared for ${dateTimingDate}` });
  };

  const saveGeo = async () => {
    if (geo.min_range >= geo.max_range) { alert('Min must be < Max'); return; }
    try {
      await axios.post(`${apiUrl}/api/settings/geofence`, { ...geo, latitude: 0, longitude: 0 }, { headers });
      alert('Geofence updated!');
    } catch { alert('Failed'); }
  };

  const saveTiming = async (t) => {
    try {
      await axios.post(`${apiUrl}/api/settings/timings`, t, { headers });
      alert('Timing updated!');
    } catch { alert('Failed'); }
  };

  const timeFld = (label, key) => (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
      <input type="time" value={dateTiming[key] || ''}
        onChange={e => setDateTiming(p => ({ ...p, [key]: e.target.value }))}
        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── DATE-WISE TIMING (primary feature) ── */}
      <section>
        <h4 style={{ color: 'var(--primary-blue)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={18} /> Date-wise Entry & Exit Timing
        </h4>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
          Set entry/exit windows for a specific date. This overrides the weekly schedule for that day.
        </p>

        {/* date picker */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Select Date</label>
          <input type="date" value={dateTimingDate} onChange={e => setDateTimingDate(e.target.value)}
            style={{ display: 'block', marginTop: '6px', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', cursor: 'pointer' }}
          />
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0' }}>
          {/* Entry row */}
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><LogIn size={15}/> Entry Window</p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {timeFld('Entry Opens (Start)', 'entry_start')}
            {timeFld('Late After (End)', 'entry_end')}
          </div>

          {/* Exit row */}
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}><LogOut size={15}/> Exit Window</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {timeFld('Exit Opens (Start)', 'exit_start')}
            {timeFld('Exit Closes (End)',  'exit_end')}
          </div>
        </div>

        {dtMsg && (
          <div style={{
            marginTop: '12px', padding: '10px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
            background: dtMsg.type === 'ok' ? '#f0fdf4' : '#fff1f2',
            color:      dtMsg.type === 'ok' ? '#16a34a' : '#dc2626',
            border:     `1px solid ${dtMsg.type === 'ok' ? '#86efac' : '#fca5a5'}`,
          }}>{dtMsg.text}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button onClick={saveDateTiming} disabled={dtLoading} className="btn btn-primary" style={{ flex: 2 }}>
            {dtLoading ? 'Saving…' : '💾 Save Date Timing'}
          </button>
          <button onClick={clearDateTiming} className="btn btn-outline" style={{ flex: 1, color: '#ef4444', borderColor: '#fca5a5' }}>
            Clear
          </button>
        </div>
      </section>

      {/* ── DAY-OF-WEEK TIMING ── */}
      <section>
        <h4 style={{ color: 'var(--primary-blue)', marginBottom: '4px' }}>Weekly Schedule (Default)</h4>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>Used when no date-specific timing is set.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day, idx) => {
            const t = timings.find(x => x.day_of_week === idx) || { day_of_week: idx, start_time: '08:00', late_threshold: '09:00' };
            const fmt = (v) => typeof v === 'string' ? v.substring(0,5) : '09:00';
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', flexWrap: 'wrap' }}>
                <span style={{ width: '88px', fontWeight: 700, fontSize: '0.875rem' }}>{day}</span>
                <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '110px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Entry Time</label>
                    <input type="time" value={fmt(t.start_time)}
                      onChange={e => setTimings(prev => [...prev.filter(x => x.day_of_week !== idx), { ...t, start_time: e.target.value }])}
                      style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '110px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Late After</label>
                    <input type="time" value={fmt(t.late_threshold)}
                      onChange={e => setTimings(prev => [...prev.filter(x => x.day_of_week !== idx), { ...t, late_threshold: e.target.value }])}
                      style={{ padding: '6px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <button onClick={() => saveTiming({ day_of_week: idx, start_time: fmt(t.start_time), late_threshold: fmt(t.late_threshold) })}
                  className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Save</button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── GEOFENCE ── */}
      <section>
        <h4 style={{ color: 'var(--primary-blue)', marginBottom: '12px' }}>Geofence Radius</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Min Range (m)</label>
            <input type="number" value={geo.min_range} onChange={e => setGeo(p => ({ ...p, min_range: parseFloat(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label>Max Range (m)</label>
            <input type="number" value={geo.max_range} onChange={e => setGeo(p => ({ ...p, max_range: parseFloat(e.target.value) }))} />
          </div>
        </div>
        <button onClick={saveGeo} className="btn btn-primary" style={{ marginTop: '10px', width: '100%' }}>Update Geofence</button>
      </section>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   STUDENTS MODAL — with full details + search
═══════════════════════════════════════════════════════════ */
const StudentsModal = ({ students, filter, onClose, onResetLate, onDelete }) => {
  const [search, setSearch] = useState('');
  const filtered = students
    .filter(s => filter === 'all' ? true : filter === 'blocked' ? s.is_blocked : !s.is_blocked)
    .filter(s => {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.student_id || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
    });

  const title = filter === 'blocked' ? 'Blocked Students' : filter === 'active' ? 'Active Students' : 'All Registered Students';

  return (
    <Modal title={title} onClose={onClose} maxWidth={900}>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input type="text" placeholder="Search by name, ID or email…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>{filtered.length} students</div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
            <tr>
              {['Student', 'ID / Course', 'Contact', 'Late Count', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={s.face_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`}
                      alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 700 }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'monospace' }}>{s.student_id || '—'}</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.course || '—'} {s.year ? `· Y${s.year}` : ''}</div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} />{s.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><Phone size={12} />{s.mobile || 'N/A'}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontWeight: 800, color: s.late_count >= 3 ? '#ef4444' : '#1e293b' }}>{s.late_count}</span>
                  <span style={{ color: '#94a3b8' }}> / 5</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={`status-badge ${getStatusClasses(s)}`} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                    {getStatusLabel(s)}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => onResetLate(s.student_id)} className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#22c55e', borderColor: '#86efac' }} title="Reset late count">
                      Reset
                    </button>
                    <button onClick={() => onDelete(s.student_id)} className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fca5a5' }} title="Delete student">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No students found.</div>}
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   TODAY ENTRIES MODAL
═══════════════════════════════════════════════════════════ */
const TodayEntriesModal = ({ entries, onClose, onRefresh, titlePrefix = "Today's Entries" }) => {
  const [search, setSearch] = useState('');
  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    return (e.student_name || '').toLowerCase().includes(q) || (e.student_id || '').toLowerCase().includes(q);
  });

  return (
    <Modal title={`${titlePrefix} — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`} onClose={onClose} maxWidth={860}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={onRefresh} className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RotateCcw size={14} /> Refresh
        </button>
        <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{filtered.length} entries</span>
      </div>

      {/* mini stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: entries.length, color: '#3b82f6' },
          { label: 'On-Time', value: entries.filter(e => !e.is_late).length, color: '#22c55e' },
          { label: 'Late', value: entries.filter(e => e.is_late).length, color: '#ef4444' },
          { label: 'Still Inside', value: entries.filter(e => !e.exit_time).length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 100px', background: '#f8fafc', border: `1px solid ${s.color}22`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
            <tr>
              {['Student', 'Roll No.', 'Course', 'Entry Time', 'Exit Time', 'Status', 'By'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '11px 14px', fontWeight: 700 }}>{e.student_name}</td>
                <td style={{ padding: '11px 14px', color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.student_id || '—'}</td>
                <td style={{ padding: '11px 14px', color: '#64748b', fontSize: '0.8rem' }}>{e.course || '—'}</td>
                <td style={{ padding: '11px 14px', fontWeight: 600 }}>{fmtDateTime(e.entry_time)}</td>
                <td style={{ padding: '11px 14px', color: '#475569' }}>
                  {e.exit_time ? fmtDateTime(e.exit_time)
                    : <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>Still Inside</span>}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: e.is_late ? '#fee2e2' : '#dcfce7', color: e.is_late ? '#dc2626' : '#16a34a' }}>
                    {e.is_late ? 'Late' : 'On-Time'}
                  </span>
                </td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: e.marked_by === 'gateman' ? '#fef3c7' : '#f0f9ff', color: e.marked_by === 'gateman' ? '#92400e' : '#0369a1' }}>
                    {e.marked_by === 'gateman' ? 'Gate' : 'Self'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No entries today.</div>}
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   LOGS MODAL  (full attendance history)
═══════════════════════════════════════════════════════════ */
const LogsModal = ({ logs, onClose }) => (
  <Modal title="Full Attendance Logs" onClose={onClose} maxWidth={860}>
    <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
          <tr>
            {['Student ID', 'Entry Time', 'Exit Time', 'Status', 'Source'].map(h => (
              <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
              <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: '#3b82f6' }}>{log.student_id}</td>
              <td style={{ padding: '11px 14px' }}>{fmtDateTime(log.entry_time)}</td>
              <td style={{ padding: '11px 14px', color: '#475569' }}>{log.exit_time ? fmtDateTime(log.exit_time) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}</td>
              <td style={{ padding: '11px 14px' }}>
                <span className={`status-badge ${getLogStatusClass(log.status, log.is_late)}`} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                  {log.status}
                </span>
              </td>
              <td style={{ padding: '11px 14px' }}>
                <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: log.marked_by === 'gateman' ? '#fef3c7' : '#f0f9ff', color: log.marked_by === 'gateman' ? '#92400e' : '#0369a1', fontWeight: 600 }}>
                  {log.marked_by === 'gateman' ? 'Gate Man' : 'Self (App)'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Modal>
);

/* ═══════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
═══════════════════════════════════════════════════════════ */
const AdminDashboard = ({ token }) => {
  const [students,     setStudents]     = useState([]);
  const [stats,        setStats]        = useState({ total_students: 0, blocked_students: 0, active_students: 0, active_today: 0, on_time_today: 0, late_today: 0 });
  const [logs,         setLogs]         = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* modal state */
  const [modal, setModal] = useState(null); // 'students-all' | 'students-active' | 'students-blocked' | 'today' | 'logs' | 'settings'

  const apiUrl = import.meta.env.VITE_API_URL;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const [sRes, stRes, lRes, tRes] = await Promise.all([
        axios.get(`${apiUrl}/api/admin/students`,      { headers }),
        axios.get(`${apiUrl}/api/admin/stats`,         { headers }),
        axios.get(`${apiUrl}/api/admin/logs`,          { headers }),
        axios.get(`${apiUrl}/api/admin/today-entries`, { headers }),
      ]);
      setStudents(sRes.data);
      setStats(stRes.data);
      setLogs(lRes.data);
      setTodayEntries(tRes.data);
    } catch (e) { console.error(e); }
    finally { setIsRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [token]);

  const resetLateCount = async (studentId) => {
    try {
      await axios.post(`${apiUrl}/api/admin/students/${studentId}/reset-late`, {}, { headers });
      fetchData();
    } catch { alert('Failed to reset'); }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(`${apiUrl}/api/admin/students/${studentId}`, { headers });
      fetchData();
      setModal(null);
    } catch { alert('Failed to delete'); }
  };

  const refreshTodayEntries = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/admin/today-entries`, { headers });
      setTodayEntries(res.data);
    } catch { console.error('today refresh failed'); }
  };

  return (
    <div className="main-content animate-fade-in">

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, color: 'var(--primary-blue)' }}>CampusVisionAI Admin</h1>
          <p style={{ color: '#64748b' }}>Comprehensive Control Center</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchData} className="btn btn-outline" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }} disabled={isRefreshing}>
            <RotateCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={() => setModal('settings')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} /> System Settings
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ROW 1: Students ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <StatCard title="All Students" value={stats.total_students || 0} sub="Total registered" color="#3b82f6" icon={Users}
          onClick={() => setModal('students-all')} />
        <StatCard title="Active Students" value={stats.active_students || 0} sub="Non-blocked accounts" color="#22c55e" icon={UserCheck}
          onClick={() => setModal('students-active')} />
        <StatCard title="Blocked Students" value={stats.blocked_students || 0} sub="Exceeded late limit" color="#ef4444" icon={ShieldAlert}
          onClick={() => setModal('students-blocked')} />
      </div>

      {/* ── STAT CARDS ROW 2: Today ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="Today's Entries" value={todayEntries.length} sub="All check-ins today" color="#8b5cf6" icon={CalendarDays}
          onClick={() => setModal('today')} />
        <StatCard title="On Time Today" value={stats.on_time_today || 0} sub="Within entry window" color="#10b981" icon={CheckCircle} />
        <StatCard title="Late Today" value={stats.late_today || 0} sub="After late threshold" color="#f59e0b" icon={AlertCircle}
          onClick={() => setModal('today-late')} />
      </div>

      {/* ── RECENT LOGS PREVIEW ── */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={18} color="#3b82f6" /> Recent Attendance Logs</h4>
          <button onClick={() => setModal('logs')} className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>View All</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ background: '#f8fafc', textAlign: 'left' }}>
              <tr>
                {['Student ID', 'Entry Time', 'Status', 'Source', 'Exit Time'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontWeight: 700, color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 8).map((log, i) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#3b82f6' }}>{log.student_id}</td>
                  <td style={{ padding: '12px 20px' }}>{fmtDateTime(log.entry_time)}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span className={`status-badge ${getLogStatusClass(log.status, log.is_late)}`} style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', background: log.marked_by === 'gateman' ? '#fef3c7' : '#f0f9ff', color: log.marked_by === 'gateman' ? '#92400e' : '#0369a1', fontWeight: 600 }}>
                      {log.marked_by === 'gateman' ? 'Gate Man' : 'Self'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: '#475569' }}>{log.exit_time ? fmtDateTime(log.exit_time) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>In Campus</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No attendance records yet.</div>}
        </div>
      </div>

      {/* ── MODALS ── */}
      {(modal === 'students-all' || modal === 'students-active' || modal === 'students-blocked') && (
        <StudentsModal
          students={students}
          filter={modal === 'students-all' ? 'all' : modal === 'students-active' ? 'active' : 'blocked'}
          onClose={() => setModal(null)}
          onResetLate={resetLateCount}
          onDelete={deleteStudent}
        />
      )}

      {modal === 'today' && (
        <TodayEntriesModal entries={todayEntries} onClose={() => setModal(null)} onRefresh={refreshTodayEntries} />
      )}

      {modal === 'today-late' && (
        <TodayEntriesModal 
          entries={todayEntries.filter(e => e.is_late)} 
          onClose={() => setModal(null)} 
          onRefresh={refreshTodayEntries} 
          titlePrefix="Late Entries Today"
        />
      )}

      {modal === 'logs' && (
        <LogsModal logs={logs} onClose={() => setModal(null)} />
      )}

      {modal === 'settings' && (
        <Modal title="System Settings" onClose={() => setModal(null)} maxWidth={680}>
          <SettingsView token={token} apiUrl={apiUrl} />
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
