import { useEffect, useState } from 'react';
import axios from 'axios';

interface Patient {
  _id: string;
  name: string;
}

interface Session {
  _id: string;
  patientId: Patient;
  machineId: string;
  startTime: string;
  endTime?: string;
  preWeight: number;
  postWeight?: number;
  vitals: {
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
  };
  nurseNotes?: string;
  isAnomalous: boolean;
  anomalies: string[];
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnlyAnomalies, setShowOnlyAnomalies] = useState(false);
  
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  const [sessionForm, setSessionForm] = useState({
    patientId: '',
    machineId: 'Dialyzer-A1',
    isStartingNow: true,
    preWeight: 70,
    systolicBP: 120,
    diastolicBP: 80,
    heartRate: 75,
    nurseNotes: ''
  });

  const [patientForm, setPatientForm] = useState({
    name: '',
    age: 45,
    gender: 'Male',
    dryWeight: 65,
    unitId: 'Unit-1'
  });

  useEffect(() => {
    fetchDashboard();
    fetchPatients();
  }, []);

  const fetchDashboard = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/sessions/today')
      .then(res => {
        setSessions(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load dashboard. Is the backend running?');
        setLoading(false);
      });
  };

  const fetchPatients = () => {
    axios.get('http://localhost:5000/api/patients')
      .then(res => setPatients(res.data.data || res.data))
      .catch(() => console.log("No GET patients route found, relying on local state."));
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/patients', patientForm);
      
      // Immediately add the new patient to our React state so they show up in the dropdown!
      const newPatient = res.data.data || res.data.patient || res.data;
      if (newPatient && newPatient._id) {
        setPatients(prev => [...prev, newPatient]);
      }

      setShowPatientModal(false);
      setPatientForm({ name: '', age: 45, gender: 'Male', dryWeight: 65, unitId: 'Unit-1' });
      alert("Patient registered successfully! You can now select them when adding a session.");
    } catch (err: any) {
      alert("Error registering patient: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        patientId: sessionForm.patientId,
        date: new Date().toISOString().split('T')[0],
        startTime: sessionForm.isStartingNow ? new Date().toISOString() : null, 
        preWeight: Number(sessionForm.preWeight),
        machineId: sessionForm.machineId,
        vitals: {
          systolicBP: Number(sessionForm.systolicBP),
          diastolicBP: Number(sessionForm.diastolicBP),
          heartRate: Number(sessionForm.heartRate)
        },
        nurseNotes: sessionForm.nurseNotes
      };
      await axios.post('http://localhost:5000/api/sessions', payload);
      setShowSessionModal(false);
      fetchDashboard();
    } catch (err: any) {
      alert("Error saving session: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      setSessions(sessions.map(s => s._id === sessionId ? { ...s, endTime: new Date().toISOString() } : s));
      await axios.patch(`http://localhost:5000/api/sessions/${sessionId}`, { endTime: new Date().toISOString() });
    } catch (err) {
      console.log("Session updated locally.");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if(!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`);
      fetchDashboard(); 
    } catch (err) {
      setSessions(sessions.filter(s => s._id !== sessionId));
    }
  };

  const getStatusBadge = (session: Session) => {
    if (session.endTime) return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">COMPLETED</span>;
    if (session.startTime && !session.endTime) return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold animate-pulse">IN PROGRESS</span>;
    return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs font-bold">NOT STARTED</span>;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><h2 className="text-xl font-semibold text-slate-600 animate-pulse">Loading Dashboard Data...</h2></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><h2 className="text-xl font-semibold text-red-500">{error}</h2></div>;

  const displayedSessions = showOnlyAnomalies ? sessions.filter(s => s.isAnomalous) : sessions;
  
  // MERGE FIX: Combine patients from React state with patients sitting inside existing sessions
  const sessionPatients = sessions.filter(s => s.patientId).map(s => s.patientId);
  const allPatients = [...patients, ...sessionPatients];
  const availablePatients = Array.from(new Map(allPatients.map(p => [p._id, p])).values());

  return (
    <div className="max-w-5xl mx-auto my-10 px-5 font-sans text-slate-800 relative">
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">🏥 Dialysis Intake Dashboard</h1>
          <p className="text-slate-500 font-medium">Real-time schedule and anomaly monitoring</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPatientModal(true)} className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-semibold shadow-sm transition cursor-pointer">
            + Register Patient
          </button>
          <button onClick={() => {
            if(availablePatients.length > 0) setSessionForm({...sessionForm, patientId: availablePatients[0]._id});
            setShowSessionModal(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition cursor-pointer">
            + Add Session
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-lg shadow-sm border border-slate-200 w-fit">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
          <input type="checkbox" checked={showOnlyAnomalies} onChange={(e) => setShowOnlyAnomalies(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer" />
          🚨 Only show patients with anomalies
        </label>
      </div>
      
      <div className="flex flex-col gap-5">
        {displayedSessions.length === 0 ? <p className="text-slate-500 italic bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center">No sessions match your current view.</p> : null}
        
        {displayedSessions.map(session => (
          <div key={session._id} className={`bg-white rounded-xl p-6 shadow-sm border transition duration-200 hover:shadow-md ${session.isAnomalous ? 'border-l-4 border-l-red-500 bg-red-50/20' : 'border-l-4 border-l-emerald-500'}`}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800 m-0">{session.patientId?.name || 'Unknown Patient'}</h3>
                {getStatusBadge(session)}
              </div>
              <div className="flex gap-2 items-center">
                {session.startTime && !session.endTime && (
                   <button onClick={() => handleEndSession(session._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold transition cursor-pointer">Mark Completed</button>
                )}
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 uppercase tracking-wider">{session.machineId}</span>
                <button onClick={() => handleDeleteSession(session._id)} className="text-red-400 hover:text-red-600 ml-2 cursor-pointer" title="Delete Session">🗑️</button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-slate-600 text-sm">
              <p><strong className="text-slate-900 block mb-1">Start Time</strong> {session.startTime ? new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Scheduled'}</p>
              <p><strong className="text-slate-900 block mb-1">Pre-Weight</strong> {session.preWeight || '--'} kg</p>
              <p><strong className="text-slate-900 block mb-1">Blood Pressure</strong> {session.vitals?.systolicBP || '--'}/{session.vitals?.diastolicBP || '--'}</p>
              <p><strong className="text-slate-900 block mb-1">Heart Rate</strong> {session.vitals?.heartRate || '--'} bpm</p>
            </div>

            <div className="flex justify-between items-start mt-4">
              <div className="text-sm text-slate-500 italic w-2/3">
                <strong>Notes:</strong> {session.nurseNotes || "No notes recorded yet."}
              </div>
            </div>
            
            {session.isAnomalous && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-100 mt-4 text-sm shadow-sm">
                <strong className="flex items-center gap-2 text-red-700">⚠️ SYSTEM WARNINGS</strong>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-red-600 font-medium">
                  {session.anomalies.map((warning, idx) => <li key={idx}>{warning}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 1. REGISTER PATIENT MODAL */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Register New Patient</h2>
            <form onSubmit={handleRegisterPatient} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input type="text" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Age</label>
                  <input type="number" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={patientForm.age} onChange={e => setPatientForm({...patientForm, age: e.target.value as any})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Dry Weight (kg)</label>
                  <input type="number" step="0.1" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={patientForm.dryWeight} onChange={e => setPatientForm({...patientForm, dryWeight: e.target.value as any})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2 border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Gender</label>
                  <select required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white" value={patientForm.gender} onChange={e => setPatientForm({...patientForm, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Unit ID</label>
                  <input type="text" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={patientForm.unitId} onChange={e => setPatientForm({...patientForm, unitId: e.target.value})} placeholder="e.g. Unit-A" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowPatientModal(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded cursor-pointer">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD SESSION MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Record New Session</h2>
            <form onSubmit={handleAddSession} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Patient Name</label>
                  <select required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white" value={sessionForm.patientId} onChange={e => setSessionForm({...sessionForm, patientId: e.target.value})}>
                    {availablePatients.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                    {availablePatients.length === 0 && <option value="">No patients found</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-white" value={sessionForm.isStartingNow ? "now" : "later"} onChange={e => setSessionForm({...sessionForm, isStartingNow: e.target.value === "now"})}>
                    <option value="now">Start Now (In Progress)</option>
                    <option value="later">Schedule (Not Started)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pre-Weight (kg)</label>
                  <input type="number" step="0.1" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={sessionForm.preWeight} onChange={e => setSessionForm({...sessionForm, preWeight: e.target.value as any})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Machine ID</label>
                  <input type="text" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={sessionForm.machineId} onChange={e => setSessionForm({...sessionForm, machineId: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-b py-4 my-2 border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sys BP</label>
                  <input type="number" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={sessionForm.systolicBP} onChange={e => setSessionForm({...sessionForm, systolicBP: e.target.value as any})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Dia BP</label>
                  <input type="number" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={sessionForm.diastolicBP} onChange={e => setSessionForm({...sessionForm, diastolicBP: e.target.value as any})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Heart Rate</label>
                  <input type="number" required className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" value={sessionForm.heartRate} onChange={e => setSessionForm({...sessionForm, heartRate: e.target.value as any})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nurse Notes</label>
                <textarea className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-emerald-500 outline-none" rows={2} value={sessionForm.nurseNotes} onChange={e => setSessionForm({...sessionForm, nurseNotes: e.target.value})}></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowSessionModal(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer">Save Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;