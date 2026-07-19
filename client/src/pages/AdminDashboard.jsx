import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { 
  ShieldAlert, 
  Users, 
  FolderClosed, 
  FileText, 
  Cpu, 
  Eye, 
  X, 
  Award,
  Terminal
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
  const { request } = useAuth();
  const { playClick, playTick, playSuccess } = useAudioEffects();

  // Data States
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total_students: 0, total_files: 0, total_notes: 0, total_projects: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Student Detail Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await request('/api/student/admin/overview');
      if (res.success) {
        setStudents(res.students || []);
        setStats(res.stats || { total_students: 0, total_files: 0, total_notes: 0, total_projects: 0 });
      }
    } catch (err) {
      toast.error('Failed to load administrative database oversight.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleInspectStudent = async (student) => {
    playClick();
    setSelectedStudent(student);
    setDetailsLoading(true);
    try {
      const res = await request(`/api/student/admin/student/${student.id}`);
      if (res.success) {
        setStudentDetails(res);
      }
    } catch (err) {
      toast.error('Failed to inspect database node.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Syncing Administrative Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Alert Header */}
      <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
        <ShieldAlert className="w-5 h-5 text-primary animate-pulse" />
        <div>
          <h2 className="font-cyber font-bold text-xs text-primary uppercase tracking-widest text-glow">Host Command Console</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Central supervisor node active. Viewing records of all registered database pods.</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <GlowCard className="p-4" glowColor="rgba(0, 245, 255, 0.12)">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Active Student Nodes</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="font-heading font-black text-2xl text-slate-200 mt-3">{stats.total_students}</p>
        </GlowCard>

        <GlowCard className="p-4" glowColor="rgba(124, 58, 237, 0.12)">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Total Cached Files</span>
            <FolderClosed className="w-4 h-4 text-accent" />
          </div>
          <p className="font-heading font-black text-2xl text-slate-200 mt-3">{stats.total_files}</p>
        </GlowCard>

        <GlowCard className="p-4" glowColor="rgba(0, 255, 153, 0.12)">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Global Notes Saved</span>
            <FileText className="w-4 h-4 text-success" />
          </div>
          <p className="font-heading font-black text-2xl text-slate-200 mt-3">{stats.total_notes}</p>
        </GlowCard>

        <GlowCard className="p-4" glowColor="rgba(250, 204, 21, 0.12)">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Innovation Projects</span>
            <Cpu className="w-4 h-4 text-warning" />
          </div>
          <p className="font-heading font-black text-2xl text-slate-200 mt-3">{stats.total_projects}</p>
        </GlowCard>
      </div>

      {/* Main Database Students List Table */}
      <div className="glass-panel p-6 border border-white/5 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-cyber font-bold text-xs text-slate-400 uppercase tracking-widest">Registered User Nodes</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student profile logs..."
            className="bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600 w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[11px] text-slate-400 text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-2">Student Node</th>
                <th className="py-3 px-2">Roll Number</th>
                <th className="py-3 px-2">Branch / Major</th>
                <th className="py-3 px-2">Semester</th>
                <th className="py-3 px-2">CGPA</th>
                <th className="py-3 px-2 text-right">Oversight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-white/5 transition-all group">
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 text-xs">{student.name}</span>
                      <span className="text-[10px] text-slate-500">{student.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-slate-300">{student.roll_number || 'N/A'}</td>
                  <td className="py-3 px-2 truncate max-w-[150px]">{student.branch || 'N/A'}</td>
                  <td className="py-3 px-2 text-slate-300">Sem {student.semester}</td>
                  <td className="py-3 px-2">
                    <span className="text-primary text-glow font-bold">{student.cgpa?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => handleInspectStudent(student)}
                      onMouseEnter={playTick}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 hover:border-primary/50 text-primary text-[10px] font-heading font-bold rounded-lg transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Node</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY: Inspect student node detail parameters */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-full max-w-2xl h-[75vh] glass-panel-heavy rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl z-10">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-primary text-glow animate-pulse" />
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-200">INSPECTING POD ID: {selectedStudent.id}</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">{selectedStudent.name} | {selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailsLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-16">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Intercepting profile payload stream...</span>
                </div>
              ) : studentDetails && (
                <div className="space-y-6">
                  
                  {/* Row 1: Academic details card */}
                  <div className="grid grid-cols-2 gap-4 font-mono text-[11px] text-slate-400 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div>
                      <span className="text-slate-500 uppercase tracking-widest text-[9px] block">Specialization / branch</span>
                      <span className="text-slate-200 font-semibold text-xs mt-1 block">{studentDetails.student.branch || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-widest text-[9px] block">Achievements metadata</span>
                      <span className="text-slate-200 font-semibold text-xs mt-1 block">{studentDetails.student.achievements || 'None registered.'}</span>
                    </div>
                  </div>

                  {/* Row 2: Subjects & Attendance logs inspect list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] tracking-widest text-primary uppercase font-cyber px-1">Curriculum & Attendance Matrix</h4>
                    {studentDetails.subjects.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-white/5">No cataloged subjects for this node.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {studentDetails.subjects.map(s => {
                          const attendInfo = studentDetails.attendance.find(a => a.subject_name === s.name) || {
                            present_count: 0,
                            total_count: 0
                          };
                          const percent = attendInfo.total_count > 0 ? Math.round((attendInfo.present_count / attendInfo.total_count) * 100) : 0;
                          
                          return (
                            <div key={s.id} className="p-3 bg-slate-950/40 rounded-xl border border-white/5 flex justify-between items-center">
                              <div>
                                <p className="font-heading text-xs font-bold text-slate-200">{s.name}</p>
                                <p className="font-mono text-[9px] text-slate-500 uppercase mt-0.5">{s.code} | {attendInfo.present_count}/{attendInfo.total_count} Classes</p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                                percent >= 75 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                              }`}>{percent}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Row 3: Notes & Projects Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notes */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] tracking-widest text-accent uppercase font-cyber px-1">Active Notes drafts ({studentDetails.notes.length})</h4>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {studentDetails.notes.length === 0 ? (
                          <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-white/5">No active notes.</p>
                        ) : (
                          studentDetails.notes.map(n => (
                            <div key={n.id} className="p-2.5 bg-slate-950/30 border border-white/5 rounded-xl text-xs flex justify-between">
                              <span className="font-heading text-slate-300 truncate flex-1">{n.title}</span>
                              <span className="font-mono text-[9px] text-slate-500 uppercase shrink-0">{n.folder_name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] tracking-widest text-warning uppercase font-cyber px-1">Innovation Projects ({studentDetails.projects.length})</h4>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {studentDetails.projects.length === 0 ? (
                          <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-white/5">No active projects.</p>
                        ) : (
                          studentDetails.projects.map(p => (
                            <div key={p.id} className="p-2.5 bg-slate-950/30 border border-white/5 rounded-xl text-xs flex justify-between items-center">
                              <span className="font-heading text-slate-300 truncate flex-1">{p.name}</span>
                              <span className="font-mono text-[9px] text-warning uppercase shrink-0">{p.progress}% Complete</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminDashboard;
