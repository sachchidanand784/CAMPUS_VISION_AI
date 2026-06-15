import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, UserCheck, ShieldAlert, Navigation, Search, Monitor, Terminal } from 'lucide-react';

const LiveGate = () => {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [gateMode, setGateMode] = useState('face'); // 'face', 'manual'
  const apiUrl = import.meta.env.VITE_API_URL;

  const [showWebcam, setShowWebcam] = useState(false);
  const [activeMode, setActiveMode] = useState('entry'); // 'entry' or 'exit'

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, (err) => console.warn("Location blocked, geofencing might fail if enforced."));
  }, []);

  const captureFace = useCallback(async (mode = activeMode) => {
    setStatus('scanning');
    setMessage(`Biometric ${mode === 'entry' ? 'Entry' : 'Exit'} scan in progress...`);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
          setStatus('idle');
          return;
      }
      
      const res = await axios.post(`${apiUrl}/api/attendance/gate/scan`, {
        image_base64: imageSrc,
        lat: coords.lat,
        lon: coords.lon,
        mode: mode
      });

      setStatus('success');
      setShowWebcam(false);
      let detail = 'Authorized';
      if (res.data.status === 'EarlyExit') detail = 'Early Exit';
      else if (res.data.status === 'Re-entered') detail = 'Re-entered';
      else if (res.data.status === 'Re-exited') detail = 'Re-exited';
      else if (res.data.status === 'LateEntry' || res.data.is_late) detail = 'Late Entry';
      else detail = 'On Time';
      setMessage(`${mode === 'entry' ? 'Entry' : 'Exit'} Authorized: ${detail}`);
      setTimeout(() => {
        setStatus('idle');
        setMessage('System ready for next scan');
      }, 4000);
    } catch (err) {
      setStatus('error');
      setShowWebcam(false);
      setMessage(err.response?.data?.detail || 'Analyzing environment...');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [webcamRef, coords, apiUrl, activeMode]);

  const initiateScan = (mode) => {
    setActiveMode(mode);
    setShowWebcam(true);
    setStatus('ready');
    setMessage(`Position face for ${mode.toUpperCase()} scan...`);
  };

  const [manualId, setManualId] = useState('');
  const [manualMode, setManualMode] = useState('entry');
  const handleIdSubmit = async (e) => {
    e.preventDefault();
    if (!manualId) return;
    setStatus('scanning');
    setMessage(`Verifying ID: ${manualId}...`);
    try {
      const res = await axios.post(`${apiUrl}/api/attendance/mark/id`, {
        student_id: manualId,
        lat: coords.lat,
        lon: coords.lon,
        mode: manualMode
      });
      setStatus('success');
      let detail = 'Authorized';
      if (res.data.status === 'EarlyExit') detail = 'Early Exit';
      else if (res.data.status === 'Re-entered') detail = 'Re-entered';
      else if (res.data.status === 'Re-exited') detail = 'Re-exited';
      else if (res.data.status === 'LateEntry' || res.data.is_late) detail = 'Late Entry';
      else detail = 'On Time';
      setMessage(`Manual ${manualMode === 'entry' ? 'Entry' : 'Exit'} Authorized for ${manualId}: ${detail}`);
      setTimeout(() => {
        setStatus('idle');
        setManualId('');
      }, 5000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'ID verification failed');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="main-content animate-fade-in">
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Side: Monitor */}
        <div style={{ flex: '1.5', minWidth: '280px' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', position: 'relative' }}>
                <div style={{ 
                    position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10,
                    padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.5)',
                    color: 'white', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(4px)'
                }}>
                    <Monitor size={18} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>GATE MONITOR ALPHA</span>
                </div>

                <div className="live-gate-monitor">
                    {showWebcam ? (
                        <>
                            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: '2rem', zIndex: 20 }}>
                                <button onClick={() => captureFace()} className="btn btn-primary" style={{ padding: '1rem 2rem', boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                                    <Camera size={20} /> CAPTURE & VERIFY
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#64748b' }}>
                            <div style={{ padding: '20px', borderRadius: '50%', background: '#1e293b', display: 'inline-block', marginBottom: '1rem' }}>
                                <Camera size={48} />
                            </div>
                            <h3>Privacy Active</h3>
                            <p>Select scan mode below to initialize biometric gate.</p>
                        </div>
                    )}
                    
                    {/* Status Overlays */}
                    <div style={{ 
                        position: 'absolute', inset: 0, border: '8px solid',
                        borderColor: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'transparent',
                        pointerEvents: 'none', transition: 'all 0.4s ease'
                    }}></div>

                    {status === 'scanning' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.1)' }}>
                            <div className="pulse-primary" style={{ width: '150px', height: '150px', border: '2px solid #3b82f6', borderRadius: '50%' }}></div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', background: '#0f172a', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {status === 'success' ? <UserCheck color="#22c55e" /> : <ShieldAlert color={status === 'error' ? '#ef4444' : '#3b82f6'} />}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Status</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{message || 'Awaiting entry...'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>GATE LOCATION</div>
                            <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Navigation size={12} /> {coords.lat ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Controls */}
        <div style={{ flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card glass-effect" style={{ borderTop: '4px solid #3b82f6' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={24} color="#3b82f6" /> Student Attendance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => initiateScan('entry')} disabled={showWebcam} className={`btn ${activeMode === 'entry' && showWebcam ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>MARK</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>ENTRY</div>
                    </button>
                    <button onClick={() => initiateScan('exit')} disabled={showWebcam} className={`btn ${activeMode === 'exit' && showWebcam ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>MARK</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>EXIT</div>
                    </button>
                </div>
                {showWebcam && (
                    <button onClick={() => setShowWebcam(false)} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', color: '#ef4444' }}>
                        CANCEL SCAN
                    </button>
                )}
            </div>

            <div className="card glass-effect">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <Terminal size={24} color="#3b82f6" />
                    <h3 style={{ margin: 0 }}>Manual Override</h3>
                </div>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>Use Student ID when biometric mismatch occurs or device is missing.</p>
                
                {/* Mode Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    <button 
                        type="button" 
                        onClick={() => setManualMode('entry')}
                        className={`btn ${manualMode === 'entry' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, padding: '10px 8px', fontSize: '0.85rem' }}
                    >
                        Entry
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setManualMode('exit')}
                        className={`btn ${manualMode === 'exit' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, padding: '10px 8px', fontSize: '0.85rem' }}
                    >
                        Exit
                    </button>
                </div>

                <form onSubmit={handleIdSubmit}>
                    <div className="form-group">
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '1rem', color: '#94a3b8' }} size={20} />
                            <input 
                                type="text" 
                                placeholder="Universal Student ID" 
                                value={manualId}
                                onChange={e => setManualId(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                        {manualMode === 'entry' ? 'AUTHORIZE ENTRY' : 'AUTHORIZE EXIT'}
                    </button>
                </form>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LiveGate;
