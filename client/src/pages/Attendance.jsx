import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { Calendar, Plus, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Attendance = () => {
  const { request } = useAuth();
  const { playClick, playTick, playSuccess } = useAudioEffects();

  // Data States
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState({ logs: [], stats: [] });
  const [loading, setLoading] = useState(true);

  // Form States
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const [subRes, attendRes] = await Promise.all([
        request('/api/student/subjects'),
        request('/api/student/attendance')
      ]);
      setSubjects(subRes.subjects || []);
      setAttendance(attendRes);
      if (subRes.subjects.length > 0) {
        setSubjectId(subRes.subjects[0].id.toString());
      }
    } catch (err) {
      toast.error('Failed to load academic schedule logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const handleLogAttendance = async (e) => {
    e.preventDefault();
    if (!subjectId) return toast.error('Create a subject first.');

    try {
      await request('/api/student/attendance', {
        method: 'POST',
        body: {
          subject_id: parseInt(subjectId),
          date,
          status,
          notes
        }
      });
      playSuccess();
      toast.success('Attendance session logged.');
      setNotes('');
      loadAttendanceData();
    } catch (err) {
      toast.error('Failed to record attendance.');
    }
  };

  const handleQuickLog = async (subId, statusVal) => {
    try {
      playClick();
      await request('/api/student/attendance', {
        method: 'POST',
        body: {
          subject_id: subId,
          date: new Date().toISOString().split('T')[0],
          status: statusVal,
          notes: 'Logged via Quick Operations Portal'
        }
      });
      toast.success(`Logged class as ${statusVal}.`);
      loadAttendanceData();
    } catch (err) {
      toast.error('Failed to log attendance.');
    }
  };

  // Bunk Calculator Logic
  const getBunkRecommendation = (present, total) => {
    if (total === 0) return { type: 'neutral', text: 'No logs recorded.' };
    const pct = (present / total) * 100;
    
    if (pct >= 75) {
      // safe bunk calculation
      // P / (T + x) >= 0.75  => x <= P/0.75 - T
      const maxBunks = Math.floor(present / 0.75 - total);
      if (maxBunks > 0) {
        return {
          type: 'success',
          text: `Safe state. You can skip the next ${maxBunks} lecture(s) safely.`
        };
      } else {
        return {
          type: 'warning',
          text: 'Perfect threshold. Skipping the next class will drop you below 75%.'
        };
      }
    } else {
      // classes to attend calculation
      // (P + y) / (T + y) >= 0.75 => y >= 3T - 4P
      const needAttend = Math.ceil(3 * total - 4 * present);
      return {
        type: 'danger',
        text: `Attendance deficit. You must attend the next ${needAttend} lecture(s) consecutively.`
      };
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading attendance gauges...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Upper Grid: Overview & Quick Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Quick Logger Form */}
        <GlowCard className="col-span-1" glowColor="rgba(0, 245, 255, 0.12)">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-primary text-glow animate-pulse" />
            <h3 className="font-cyber font-bold tracking-wider text-xs text-primary uppercase text-glow">Session Log Registry</h3>
          </div>

          <form onSubmit={handleLogAttendance} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="present" className="bg-slate-900 text-slate-200">Present</option>
                  <option value="absent" className="bg-slate-900 text-slate-200">Absent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1.5">Session Remarks</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Topic / Quiz / Calibrations..."
                className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              onMouseEnter={playTick}
              className="w-full py-2.5 bg-primary hover:bg-glowColor text-black font-heading font-extrabold text-xs uppercase rounded-xl tracking-wider shadow-glow-primary transition-all"
            >
              Commit Session Log
            </button>
          </form>
        </GlowCard>

        {/* Right Cards: Subject list progress rings */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h3 className="font-cyber font-bold tracking-wider text-xs text-slate-500 uppercase px-2">Academic Course Statistics</h3>
          
          {subjects.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-500 font-mono text-xs italic rounded-2xl">
              No subjects registered. Complete Course initialization.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(sub => {
                const stat = attendance.stats.find(s => s.subject_id === sub.id) || {
                  present_count: 0,
                  absent_count: 0,
                  total_count: 0
                };
                
                const present = stat.present_count;
                const total = stat.total_count;
                const percent = total > 0 ? Math.round((present / total) * 100) : 0;
                const recommendation = getBunkRecommendation(present, total);

                return (
                  <div key={sub.id} className="p-5 glass-panel border border-white/5 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-heading text-sm font-bold text-slate-200">{sub.name}</h4>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">{sub.code} | Credits: {sub.credit_hours}</p>
                      </div>
                      
                      {/* Percent badge */}
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                        percent >= 75 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                      }`}>
                        {percent}%
                      </span>
                    </div>

                    {/* Progress details */}
                    <div className="flex justify-between items-center gap-4 mt-4 pt-3 border-t border-white/5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickLog(sub.id, 'present')}
                          className="px-2.5 py-1 bg-success/20 hover:bg-success/30 border border-success/30 text-success text-[10px] font-heading font-bold rounded-lg transition-all"
                        >
                          + Present
                        </button>
                        <button
                          onClick={() => handleQuickLog(sub.id, 'absent')}
                          className="px-2.5 py-1 bg-danger/20 hover:bg-danger/30 border border-danger/30 text-danger text-[10px] font-heading font-bold rounded-lg transition-all"
                        >
                          + Absent
                        </button>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{present} P / {total} Total</span>
                    </div>

                    {/* Bunk Advisory */}
                    <div className="mt-3.5 flex items-start gap-2 p-2.5 bg-slate-950/40 rounded-xl text-[10px] font-mono leading-relaxed">
                      {recommendation.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />}
                      {recommendation.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />}
                      {recommendation.type === 'danger' && <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />}
                      {recommendation.type === 'neutral' && <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />}
                      <span className={`${
                        recommendation.type === 'success' ? 'text-slate-300' :
                        recommendation.type === 'warning' ? 'text-warning/90' :
                        recommendation.type === 'danger' ? 'text-danger/90' : 'text-slate-500'
                      }`}>
                        {recommendation.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Raw Attendance Logs */}
      {attendance.logs.length > 0 && (
        <div className="glass-panel p-6 border border-white/5 rounded-2xl">
          <h3 className="font-cyber font-bold tracking-wider text-xs text-slate-400 uppercase mb-4">Historical Class Logs</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px] text-slate-400 text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2">Subject</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {attendance.logs.slice(0, 15).map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-all">
                    <td className="py-2.5 px-2 font-bold text-slate-300">{log.date}</td>
                    <td className="py-2.5 px-2">{log.subject_name}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        log.status === 'present' ? 'text-success bg-success/15' : 'text-danger bg-danger/15'
                      }`}>{log.status}</span>
                    </td>
                    <td className="py-2.5 px-2 italic text-slate-500">{log.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
export default Attendance;
