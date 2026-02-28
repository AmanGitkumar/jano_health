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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnlyAnomalies, setShowOnlyAnomalies] = useState(false); // NEW FILTER STATE

  useEffect(() => {
    fetchDashboard();
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

  const handleEditNotes = (sessionId: string, currentNotes: string) => {
    const newNotes = window.prompt("Edit Nurse Notes:", currentNotes || "");
    if (newNotes !== null) {
      alert(`In a full implementation, this would send a PATCH request to /api/sessions/${sessionId} with the new notes: "${newNotes}"`);
    }
  };

  const getStatusBadge = (session: Session) => {
    if (session.endTime) return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">COMPLETED</span>;
    if (session.startTime && !session.endTime) return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold animate-pulse">IN PROGRESS</span>;
    return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs font-bold">NOT STARTED</span>;
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><h2 className="text-xl font-semibold text-slate-600 animate-pulse">Loading Dashboard Data...</h2></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><h2 className="text-xl font-semibold text-red-500">{error}</h2></div>;

  // Apply the filter logic
  const displayedSessions = showOnlyAnomalies 
    ? sessions.filter(s => s.isAnomalous) 
    : sessions;

  return (
    <div className="max-w-5xl mx-auto my-10 px-5 font-sans text-slate-800">
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">🏥 Dialysis Intake Dashboard</h1>
          <p className="text-slate-500 font-medium">Real-time schedule and anomaly monitoring</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => alert("This opens the Add Session form modal.")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition">
            + Add Session
          </button>
        </div>
      </div>
      
      {/* FILTER CONTROLS */}
      <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-lg shadow-sm border border-slate-200 w-fit">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 select-none">
          <input 
            type="checkbox" 
            checked={showOnlyAnomalies} 
            onChange={(e) => setShowOnlyAnomalies(e.target.checked)}
            className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
          />
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
              <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 uppercase tracking-wider">{session.machineId}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-slate-600 text-sm">
              <p><strong className="text-slate-900 block mb-1">Start Time</strong> {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <p><strong className="text-slate-900 block mb-1">Pre-Weight</strong> {session.preWeight} kg</p>
              <p><strong className="text-slate-900 block mb-1">Blood Pressure</strong> {session.vitals?.systolicBP}/{session.vitals?.diastolicBP}</p>
              <p><strong className="text-slate-900 block mb-1">Heart Rate</strong> {session.vitals?.heartRate} bpm</p>
            </div>

            <div className="flex justify-between items-start mt-4">
              <div className="text-sm text-slate-500 italic w-2/3">
                <strong>Notes:</strong> {session.nurseNotes || "No notes recorded yet."}
              </div>
              <button onClick={() => handleEditNotes(session._id, session.nurseNotes || "")} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                Edit Notes
              </button>
            </div>
            
            {session.isAnomalous && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-100 mt-4 text-sm shadow-sm">
                <strong className="flex items-center gap-2 text-red-700">
                  ⚠️ SYSTEM WARNINGS
                </strong>
                <ul className="list-disc ml-6 mt-2 space-y-1 text-red-600 font-medium">
                  {session.anomalies.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;