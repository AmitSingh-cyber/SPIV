import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { Cpu, Github, ExternalLink, Plus, Calendar, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const Projects = () => {
  const { request } = useAuth();
  const { playClick, playTick, playSuccess } = useAudioEffects();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [technology, setTechnology] = useState('');
  const [github, setGithub] = useState('');
  const [live, setLive] = useState('');
  const [status, setStatus] = useState('planning');
  const [deadline, setDeadline] = useState('');
  const [progress, setProgress] = useState(0);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await request('/api/student/projects');
      setProjects(res.projects || []);
    } catch (err) {
      toast.error('Failed to load project database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      await request('/api/student/projects', {
        method: 'POST',
        body: {
          name,
          description,
          technology,
          github_link: github,
          live_link: live,
          status,
          deadline,
          progress: parseInt(progress)
        }
      });
      playSuccess();
      toast.success('Project index created.');
      setShowAddForm(false);
      setName('');
      setDescription('');
      setTechnology('');
      setGithub('');
      setLive('');
      setStatus('planning');
      setDeadline('');
      setProgress(0);
      loadProjects();
    } catch (err) {
      toast.error('Failed to register project.');
    }
  };

  const handleProgressChange = async (id, val) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    try {
      await request(`/api/student/projects/${id}`, {
        method: 'PUT',
        body: {
          ...proj,
          progress: parseInt(val),
          status: parseInt(val) === 100 ? 'completed' : parseInt(val) > 0 ? 'development' : 'planning'
        }
      });
      // Quick local update
      setProjects(prev => prev.map(p => p.id === id ? { 
        ...p, 
        progress: parseInt(val), 
        status: parseInt(val) === 100 ? 'completed' : parseInt(val) > 0 ? 'development' : 'planning'
      } : p));
    } catch (err) {
      toast.error('Failed to sync progress.');
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Syncing repositories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header and Toggle */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="font-cyber font-bold tracking-wider text-xs text-slate-500 uppercase">Hardware & Software Repositories</h2>
          <p className="text-xl font-heading font-extrabold text-slate-200 mt-1">Academic Labs & Innovation Stack</p>
        </div>

        <button
          onClick={() => {
            playClick();
            setShowAddForm(!showAddForm);
          }}
          onMouseEnter={playTick}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-glowColor text-black rounded-xl text-xs font-heading font-bold transition-all shadow-glow-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Catalog Project</span>
        </button>
      </div>

      {/* Catalog Form Drawer Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-lg glass-panel-heavy rounded-2xl border border-white/10 p-6 shadow-2xl z-10">
            <h3 className="font-cyber font-bold text-sm text-primary mb-4 uppercase">Initialize Project Directory</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="planning" className="bg-slate-900">Planning</option>
                    <option value="development" className="bg-slate-900">In Development</option>
                    <option value="completed" className="bg-slate-900">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Tech Stack (comma tags)</label>
                  <input
                    type="text"
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    placeholder="React, C++, PyTorch"
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Live URL</label>
                  <input
                    type="url"
                    value={live}
                    onChange={(e) => setLive(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Progress Percentage ({progress}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  className="w-full accent-primary bg-slate-900 py-2.5"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-heading font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-glowColor text-black rounded-xl text-xs font-heading font-bold shadow-glow-primary"
                >
                  Initialize Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 font-mono text-xs italic rounded-2xl">
          No projects registered. Click "Catalog Project" to upload parameters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const techList = proj.technology ? proj.technology.split(',').map(t => t.trim()) : [];
            return (
              <GlowCard key={proj.id} className="flex flex-col justify-between" glowColor="rgba(124, 58, 237, 0.12)">
                <div className="space-y-4">
                  {/* Status & Name */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase ${
                      proj.status === 'completed' ? 'bg-success/20 text-success' :
                      proj.status === 'development' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
                    }`}>
                      {proj.status}
                    </span>
                    <Cpu className="w-4.5 h-4.5 text-slate-500" />
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-slate-200 text-base">{proj.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{proj.description}</p>
                  </div>

                  {/* Tech stack */}
                  {techList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {techList.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[9px] text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress bar and links */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-4">
                  {/* Progress slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px] text-slate-500">
                      <span>Development State</span>
                      <span>{proj.progress}%</span>
                    </div>
                    
                    {/* Visual bar */}
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    
                    {/* Live editing slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={proj.progress}
                      onChange={(e) => handleProgressChange(proj.id, e.target.value)}
                      className="w-full opacity-0 hover:opacity-100 transition-opacity absolute bottom-12 left-0 right-0 py-1 accent-primary cursor-ew-resize"
                      title="Adjust project progress"
                    />
                  </div>

                  {/* Links */}
                  <div className="flex gap-3 justify-end text-xs font-heading font-bold">
                    {proj.github_link && (
                      <a
                        href={proj.github_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        <span>Source</span>
                      </a>
                    )}
                    {proj.live_link && (
                      <a
                        href={proj.live_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-slate-400 hover:text-accent transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}

    </div>
  );
};
export default Projects;
