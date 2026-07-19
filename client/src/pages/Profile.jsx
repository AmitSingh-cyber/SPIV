import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { User, Award, Shield, FileOutput, FileInput, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, request, updateProfileState } = useAuth();
  const { playClick, playTick, playSuccess, playAlert } = useAudioEffects();

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [rollNumber, setRollNumber] = useState(user?.roll_number || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [semester, setSemester] = useState(user?.semester || 1);
  const [cgpa, setCgpa] = useState(user?.cgpa || 0.0);
  const [achievements, setAchievements] = useState(user?.achievements || '');

  // DB Backup file state
  const [importFile, setImportFile] = useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      toast.loading('Writing variables...', { id: 'prof' });
      const res = await request('/api/student/profile', {
        method: 'PUT',
        body: {
          name,
          roll_number: rollNumber,
          branch,
          semester: parseInt(semester),
          cgpa: parseFloat(cgpa),
          achievements
        }
      });
      playSuccess();
      updateProfileState(res.user);
      setIsEditing(false);
      toast.success('Core matrix variables synchronized.', { id: 'prof' });
    } catch (err) {
      toast.error('Update failed.', { id: 'prof' });
    }
  };

  const handleExportDB = async () => {
    playClick();
    try {
      toast.loading('Packing database streams...', { id: 'dbexp' });
      const res = await request('/api/db/export');
      
      // Save as JSON file download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `echovault_db_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      playSuccess();
      toast.success('Backup export ready for download.', { id: 'dbexp' });
    } catch (err) {
      toast.error('Backup compile failed.', { id: 'dbexp' });
    }
  };

  const handleImportDB = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error('Choose a backup file first.');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        toast.loading('Injecting backup packets...', { id: 'dbimp' });
        const parsed = JSON.parse(event.target.result);
        
        if (!parsed.database || parsed.database !== 'ECHO_VAULT_SQLITE') {
          playAlert();
          return toast.error('Invalid backup signature.', { id: 'dbimp' });
        }

        await request('/api/db/import', {
          method: 'POST',
          body: { data: parsed.data }
        });
        
        playSuccess();
        toast.success('Database payload sync completed. Refresh page.', { id: 'dbimp' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error('Parse error or invalid JSON.', { id: 'dbimp' });
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Title */}
      <div className="px-2">
        <h2 className="font-cyber font-bold tracking-wider text-xs text-slate-500 uppercase">Vault Node Identity</h2>
        <p className="text-xl font-heading font-extrabold text-slate-200 mt-1">Digital Student ID</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Hologram Digital ID Card */}
        <div className="col-span-1 lg:col-span-1 flex flex-col justify-between p-6 glass-panel-glow border-primary/20 rounded-2xl relative overflow-hidden h-[380px] shadow-glow-primary group">
          {/* Animated corner scan lines */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr group-hover:scale-105 transition-all" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl group-hover:scale-105 transition-all" />

          {/* Holographic glowing orb background */}
          <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none animate-pulse-slow" />

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-cyber font-black tracking-widest text-primary text-sm text-glow">ECHO CARD</h3>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Verification Node ID</span>
              </div>
              <Shield className="w-5 h-5 text-primary text-glow animate-pulse" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-accent/20 to-primary/20 border border-slate-700/80 flex items-center justify-center font-cyber font-bold text-2xl text-primary text-glow shrink-0">
                {user?.name ? user.name[0] : 'T'}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-heading font-bold text-slate-100 text-base leading-tight truncate">{user?.name}</h4>
                <p className="font-mono text-[10px] text-slate-500 mt-1 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-800/40 pt-4 font-mono text-[10px] text-slate-400">
              <div>
                <span className="text-slate-500 block uppercase">Roll ID</span>
                <span className="text-slate-300 font-semibold">{user?.roll_number || 'ST-2026-007'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase">Specialization</span>
                <span className="text-slate-300 font-semibold truncate block">{user?.branch || 'Robotics & AI'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-[10px] text-slate-400">
              <div>
                <span className="text-slate-500 block uppercase">Active Semester</span>
                <span className="text-slate-300 font-semibold">Sem {user?.semester || 1}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase">CGPA Matrix</span>
                <span className="text-primary text-glow font-bold">{user?.cgpa?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 flex justify-between font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none">
            <span>SYS_KEY: {user?.id}</span>
            <span>SECURE PAYLOAD</span>
          </div>
        </div>

        {/* Right Card: Matrix Editor & Configuration */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <GlowCard glowColor="rgba(124, 58, 237, 0.12)">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-accent shadow-glow-accent animate-pulse" />
                <h3 className="font-cyber font-bold tracking-wider text-xs text-accent uppercase text-glow-accent">Identity Variables</h3>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-heading font-semibold"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Roll ID</label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Branch / Major</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">CGPA Value</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Notable achievements</label>
                    <input
                      type="text"
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-heading font-semibold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-purple-600 text-white rounded-xl text-xs font-heading font-bold shadow-glow-accent transition-all animate-pulse"
                  >
                    <Save className="w-4 h-4" />
                    <span>Synchronize Matrix</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 font-mono text-xs text-slate-400 leading-relaxed">
                <div>
                  <span className="text-slate-500 uppercase tracking-widest text-[9px]">Roll ID Node</span>
                  <p className="text-slate-200 font-medium text-sm mt-0.5">{user?.roll_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-widest text-[9px]">Major Specification</span>
                  <p className="text-slate-200 font-medium text-sm mt-0.5">{user?.branch || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-widest text-[9px]">Academic Achievements</span>
                  <div className="flex items-start gap-2 mt-1.5 p-3 bg-slate-950/40 rounded-xl border border-white/5 text-slate-300">
                    <Award className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{user?.achievements || 'No achievement records cataloged in identity matrix.'}</span>
                  </div>
                </div>
              </div>
            )}
          </GlowCard>

          {/* WIDGET: Database Import/Export backup center */}
          <GlowCard glowColor="rgba(0, 255, 153, 0.12)">
            <h3 className="font-cyber font-bold tracking-wider text-xs text-success uppercase text-glow mb-4">Database Backup Stream Center</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Export */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Compile Backup Payload</span>
                <p className="text-xs text-slate-400 leading-relaxed">Extract and compile all SQLite database entries (users, notes, timetable, passwords) into a unified backup JSON stream.</p>
                
                <button
                  onClick={handleExportDB}
                  onMouseEnter={playTick}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-success/20 hover:bg-success/30 border border-success/30 hover:border-success/50 text-success font-heading font-extrabold text-xs uppercase rounded-xl tracking-wider shadow-glow-success transition-all"
                >
                  <FileOutput className="w-4 h-4" />
                  <span>Export Backup (JSON)</span>
                </button>
              </div>

              {/* Import */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Restore Node Parameters</span>
                <p className="text-xs text-slate-400 leading-relaxed">Inject a previously compiled JSON database stream to restore variables. This completely overrides existing data tables.</p>

                <form onSubmit={handleImportDB} className="space-y-3">
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-heading file:font-extrabold file:bg-white/5 file:text-slate-300 hover:file:bg-white/10 file:cursor-pointer"
                  />
                  <button
                    type="submit"
                    onMouseEnter={playTick}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-heading font-extrabold text-xs uppercase rounded-xl tracking-wider transition-all"
                  >
                    <FileInput className="w-4 h-4 text-primary" />
                    <span>Upload & Restore Database</span>
                  </button>
                </form>
              </div>
            </div>
          </GlowCard>
        </div>

      </div>

    </div>
  );
};
export default Profile;
