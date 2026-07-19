import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  History, 
  Clock, 
  Plus, 
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { request, user } = useAuth();
  const { playClick, playTick, playSuccess, playAlert } = useAudioEffects();

  // Widget States
  const [analytics, setAnalytics] = useState(null);
  const [attendance, setAttendance] = useState({ logs: [], stats: [] });
  const [timetable, setTimetable] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [todos, setTodos] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [storageRes, attendRes, schedRes, assignRes, todoRes, timelineRes] = await Promise.all([
        request('/api/files/analytics'),
        request('/api/student/attendance'),
        request('/api/student/timetable'),
        request('/api/student/assignments'),
        request('/api/student/todos'),
        request('/api/student/activity')
      ]);

      setAnalytics(storageRes);
      setAttendance(attendRes);
      setTimetable(schedRes.timetable || []);
      setAssignments(assignRes.assignments || []);
      setTodos(todoRes.todos || []);
      setTimeline(timelineRes.timeline || []);
    } catch (err) {
      console.error('Error fetching dashboard details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      await request('/api/student/todos', {
        method: 'POST',
        body: { task: newTodo }
      });
      playSuccess();
      setNewTodo('');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to create task.');
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      playClick();
      const nextStatus = todo.status === 'completed' ? 'pending' : 'completed';
      await request(`/api/student/todos/${todo.id}`, {
        method: 'PUT',
        body: { status: nextStatus }
      });
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      playAlert();
      await request(`/api/student/todos/${id}`, { method: 'DELETE' });
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  // Helper: Get Day Name
  const getDayOfWeekName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Monday';
  };

  const todayIndex = new Date().getDay();
  const todayClasses = timetable.filter(t => t.day_of_week === todayIndex);

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading Jarvis Core dashboards...</span>
      </div>
    );
  }

  // Calculate Storage Stats
  const usedGB = analytics ? (analytics.total_used / (1024 * 1024 * 1024)).toFixed(2) : '0.00';
  const allowedGB = analytics ? (analytics.total_allowed / (1024 * 1024 * 1024)).toFixed(0) : '5';
  const percentUsed = analytics ? ((analytics.total_used / analytics.total_allowed) * 100).toFixed(1) : '0.0';

  // Calculate Overall Attendance
  let totalPresent = 0;
  let totalLogs = 0;
  attendance.stats.forEach(s => {
    totalPresent += s.present_count;
    totalLogs += s.total_count;
  });
  const overallAttendancePercent = totalLogs > 0 ? Math.round((totalPresent / totalLogs) * 100) : 0;

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 glass-panel border border-white/5 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-100">Welcome back, {user?.name || 'Student'}</h1>
          <p className="text-xs text-slate-400 font-sans mt-1">ECHO systems verify database status as optimal. You have no pending notifications.</p>
        </div>
        <div className="mt-4 md:mt-0 font-mono text-[10px] tracking-widest text-slate-500 uppercase">
          SYS_PING: <span className="text-success text-glow">OK (12ms)</span>
        </div>
      </div>

      {/* Grid Layout of Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDGET 1: Storage Capacity */}
        <GlowCard className="col-span-1 flex flex-col justify-between" glowColor="rgba(0, 245, 255, 0.12)">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cyber font-bold tracking-wider text-xs text-primary uppercase text-glow">Personal Storage</h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">{percentUsed}%</span>
          </div>

          {/* SVG Circular Donut Chart */}
          <div className="flex justify-center py-6 relative">
            <svg width="150" height="150" viewBox="0 0 150 150" className="transform -rotate-90">
              {/* Back track */}
              <circle cx="75" cy="75" r="55" fill="none" stroke="#0F172A" strokeWidth="12" />
              {/* Progress track */}
              <circle 
                cx="75" 
                cy="75" 
                r="55" 
                fill="none" 
                stroke="url(#storageGrad)" 
                strokeWidth="12" 
                strokeDasharray="345.57" 
                strokeDashoffset={345.57 - (345.57 * (parseFloat(percentUsed) || 0)) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="storageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F5FF" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-xl font-bold text-slate-100 leading-none">{usedGB}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-1.5">of {allowedGB} GB used</span>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-2.5 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Documents</span>
              <span>{(analytics?.breakdown?.Documents?.size / (1024 * 1024) || 0).toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Pictures & Videos</span>
              <span>{(((analytics?.breakdown?.Pictures?.size || 0) + (analytics?.breakdown?.Videos?.size || 0)) / (1024 * 1024)).toFixed(1)} MB</span>
            </div>
          </div>
        </GlowCard>

        {/* WIDGET 2: Daily Timetable schedule */}
        <GlowCard className="col-span-1" glowColor="rgba(124, 58, 237, 0.12)">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cyber font-bold tracking-wider text-xs text-accent uppercase text-glow-accent">Today's Lectures</h3>
            <span className="text-[10px] text-slate-500 font-mono">{getDayOfWeekName(todayIndex)}</span>
          </div>

          {todayClasses.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs italic">
              No classes registered for today. Calibration day.
            </div>
          ) : (
            <div className="space-y-4">
              {todayClasses.map((item, idx) => (
                <div key={item.id} className="relative pl-5 border-l border-primary/20 group">
                  {/* Left indicator ring */}
                  <div className="absolute -left-[4.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-900 border border-primary group-hover:bg-primary transition-all" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-heading text-xs font-bold text-slate-200">{item.subject_name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.room} | Prof. {item.teacher}</p>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>{item.start_time} - {item.end_time}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlowCard>

        {/* WIDGET 3: Attendance Analytics overall summary */}
        <GlowCard className="col-span-1" glowColor="rgba(0, 255, 153, 0.12)">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cyber font-bold tracking-wider text-xs text-success uppercase text-glow">Attendance Index</h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              overallAttendancePercent >= 75 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
            }`}>{overallAttendancePercent}%</span>
          </div>

          <div className="flex items-center justify-between gap-6 py-4">
            <div>
              <p className="font-heading text-2xl font-black text-slate-100">{totalPresent} / {totalLogs}</p>
              <p className="text-[10px] text-slate-500 font-mono tracking-wide uppercase mt-1">Total Classes Logged</p>
              <p className="text-[10px] text-slate-400 font-mono mt-3">
                {overallAttendancePercent >= 75 
                  ? 'Operational levels nominal. Good job.'
                  : 'Warning: Below the 75% regulatory requirement.'}
              </p>
            </div>
            
            {/* SVG gauge */}
            <div className="relative shrink-0">
              <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#0F172A" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  fill="none" 
                  stroke={overallAttendancePercent >= 75 ? '#00FF99' : '#FF4D6D'} 
                  strokeWidth="8" 
                  strokeDasharray="238.76" 
                  strokeDashoffset={238.76 - (238.76 * (overallAttendancePercent || 0)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
            </div>
          </div>
        </GlowCard>

      </div>

      {/* Lower Row: Tasks, Assignments & System Log Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDGET 4: Interactive Todo Checklist */}
        <GlowCard className="col-span-1" glowColor="rgba(250, 204, 21, 0.12)">
          <h3 className="font-cyber font-bold tracking-wider text-xs text-warning uppercase text-glow mb-4">Command Queue (Todo)</h3>
          
          {/* Todo Input form */}
          <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Enqueue new task..."
              className="flex-1 bg-white/5 border border-white/5 focus:border-warning/35 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 font-sans"
            />
            <button
              type="submit"
              onMouseEnter={playTick}
              className="p-2 bg-warning hover:bg-yellow-500 text-black rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {todos.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-mono text-xs italic">
              Queue is empty. Systems calm.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {todos.map(todo => {
                const isCompleted = todo.status === 'completed';
                return (
                  <div key={todo.id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-950/20 border border-white/5 rounded-xl hover:border-slate-800 transition-all group">
                    <button
                      onClick={() => handleToggleTodo(todo)}
                      className="flex items-center gap-3 overflow-hidden text-left"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-warning shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className={`text-xs truncate font-heading ${
                        isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'
                      }`}>
                        {todo.task}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </GlowCard>

        {/* WIDGET 5: Deadlines / Pending Assignments */}
        <GlowCard className="col-span-1" glowColor="rgba(0, 245, 255, 0.12)">
          <h3 className="font-cyber font-bold tracking-wider text-xs text-primary uppercase text-glow mb-4">Academic Deadlines</h3>
          
          {assignments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs italic">
              No assignments cataloged in the repository.
            </div>
          ) : (
            <div className="space-y-3.5">
              {assignments.slice(0, 3).map(assign => (
                <div key={assign.id} className="p-3 bg-white/5 border border-white/5 hover:border-slate-800 rounded-xl transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-heading text-xs font-bold text-slate-200 truncate">{assign.title}</h4>
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase ${
                      assign.priority === 'high' ? 'bg-danger/25 text-danger' : 'bg-warning/25 text-warning'
                    }`}>{assign.priority}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-mono">
                    <span>{assign.subject_code}</span>
                    <span className="text-danger/80">Due: {assign.deadline.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlowCard>

        {/* WIDGET 6: Activity Feed Timeline */}
        <GlowCard className="col-span-1" glowColor="rgba(124, 58, 237, 0.12)">
          <h3 className="font-cyber font-bold tracking-wider text-xs text-accent uppercase text-glow-accent mb-4">Chronological Systems Log</h3>
          
          {timeline.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs italic">
              No recent logs recorded in core.
            </div>
          ) : (
            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              {timeline.slice(0, 4).map((log, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <History className="w-3 h-3 text-slate-400" />
                    </div>
                    {idx !== timeline.length - 1 && (
                      <div className="w-[1px] flex-1 bg-slate-800 my-1" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-mono text-xs text-slate-300 truncate">{log.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlowCard>

      </div>
    </div>
  );
};
export default Dashboard;
