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
  preWeight: number;
  vitals: {
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
  };
  isAnomalous: boolean;
  anomalies: string[];
}

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><h2 className="text-xl font-semibold text-slate-600 animate-pulse">Loading Dashboard Data...</h2></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><h2 className="text-xl font-semibold text-red-500">{error}</h2></div>;

  return (
    <div className="max-w-4xl mx-auto my-10 px-5 font-sans text-slate-800">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-1">🏥 Dialysis Anomaly Dashboard</h1>
      <p className="text-slate-500 mb-8 font-medium">Today's Schedule & Live Monitoring</p>
      
      <div className="flex flex-col gap-5">
        {sessions.length === 0 ? <p className="text-slate-500 italic">No sessions recorded for today.</p> : null}
        
        {sessions.map(session => (
          <div key={session._id} className={`bg-white rounded-xl p-6 shadow-sm border transition duration-200 hover:-translate-y-1 hover:shadow-md ${session.isAnomalous ? 'border-l-4 border-l-red-500 bg-red-50/20' : 'border-l-4 border-l-emerald-500'}`}>
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xl font-bold text-slate-800 m-0">{session.patientId?.name || 'Unknown Patient'}</h3>
              <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 uppercase tracking-wider">{session.machineId}</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2 text-slate-600 text-sm">
              <p><strong className="text-slate-900 block mb-1">Start Time</strong> {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <p><strong className="text-slate-900 block mb-1">Pre-Weight</strong> {session.preWeight} kg</p>
              <p><strong className="text-slate-900 block mb-1">Blood Pressure</strong> {session.vitals?.systolicBP}/{session.vitals?.diastolicBP}</p>
              <p><strong className="text-slate-900 block mb-1">Heart Rate</strong> {session.vitals?.heartRate} bpm</p>
            </div>
            
            {session.isAnomalous && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-100 mt-4 text-sm">
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