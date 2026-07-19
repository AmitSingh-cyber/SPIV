import React, { useState, useEffect } from 'react';
import { Search, Sparkles, UploadCloud, Terminal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioEffects } from '../ui/AudioFeedback';

export const Header = ({ onSearchClick, onAiClick, onUploadClick, title = "SYSTEM CENTRAL" }) => {
  const { user } = useAuth();
  const { playClick, playTick } = useAudioEffects();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <header className="flex items-center justify-between w-full h-20 px-8 glass-panel border border-white/5 rounded-2xl mb-6 shadow-glass z-20">
      {/* Page Context and Live clock */}
      <div className="flex items-center gap-6">
        <div>
          <h2 className="font-cyber font-bold tracking-wider text-primary text-lg text-glow uppercase">{title}</h2>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Operational State: NOMINAL</p>
        </div>

        {/* Digital Time Panel */}
        <div className="hidden md:flex flex-col px-4 py-1.5 border-l border-slate-800 font-mono">
          <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent tracking-widest">{formatTime(time)}</span>
          <span className="text-[9px] text-slate-500 tracking-wider uppercase">{formatDate(time)}</span>
        </div>
      </div>

      {/* Control Widgets */}
      <div className="flex items-center gap-3">
        {/* Raycast Console Button */}
        <button
          onClick={() => {
            playClick();
            onSearchClick();
          }}
          onMouseEnter={playTick}
          className="flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-slate-200 hover:border-slate-700/80 transition-all text-xs font-mono"
        >
          <Search className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Search Vault</span>
          <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-[9px] text-slate-500">⌘K</span>
        </button>

        {/* Upload Action */}
        <button
          onClick={() => {
            playClick();
            onUploadClick();
          }}
          onMouseEnter={playTick}
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all relative group"
          title="Upload new file"
        >
          <UploadCloud className="w-5 h-5 text-primary group-hover:scale-105 transition-transform" />
        </button>

        {/* AI Co-Pilot Toggle */}
        <button
          onClick={() => {
            playClick();
            onAiClick();
          }}
          onMouseEnter={playTick}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 border border-accent/20 hover:border-accent/40 rounded-xl text-accent hover:text-purple-300 transition-all font-heading text-xs font-semibold relative overflow-hidden group shadow-glow-accent"
        >
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          <span>AI Assistant</span>
          {/* Subtle neon slide layer */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-heading text-xs font-bold leading-tight">{user?.name || "Tony Stark"}</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider leading-none">{user?.roll_number || "ST-2026-007"}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-slate-700/50 flex items-center justify-center font-cyber font-bold text-primary text-glow">
            {user?.name ? user.name[0] : "T"}
          </div>
        </div>
      </div>
    </header>
  );
};
