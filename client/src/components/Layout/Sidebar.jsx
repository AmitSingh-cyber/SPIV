import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FolderClosed, 
  BookOpen, 
  CalendarClock, 
  Cpu, 
  Award, 
  KeyRound, 
  User, 
  LogOut, 
  Volume2, 
  VolumeX,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioEffects } from '../ui/AudioFeedback';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const { muted, toggleMute, playClick, playTick } = useAudioEffects();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Echo Storage', path: '/files', icon: FolderClosed },
    { name: 'Notes Lab', path: '/notes', icon: BookOpen },
    { name: 'Attendance', path: '/attendance', icon: CalendarClock },
    { name: 'Projects', path: '/projects', icon: Cpu },
    { name: 'Credentials', path: '/certificates', icon: Award },
    { name: 'Vault Lock', path: '/vault', icon: KeyRound },
    { name: 'Digital ID', path: '/profile', icon: User },
  ];

  if (user?.email === 'tony@echo.edu') {
    menuItems.push({ name: 'Host Command', path: '/admin', icon: ShieldAlert });
  }

  return (
    <aside className="fixed left-5 top-5 bottom-5 w-64 glass-panel rounded-2xl flex flex-col justify-between py-6 px-4 border border-white/5 z-30 select-none shadow-glass">
      {/* Branding */}
      <div>
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-primary shadow-glow-primary overflow-hidden">
            <span className="font-cyber font-bold text-xl text-black">⚡</span>
            {/* Spinning pulse border */}
            <div className="absolute inset-0 border border-white/20 rounded-xl animate-pulse" />
          </div>
          <div>
            <h1 className="font-cyber font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-glowColor leading-none">ECHO VAULT</h1>
            <span className="text-[9px] text-slate-500 tracking-widest font-mono uppercase">System Core v2.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onMouseEnter={playTick}
              onClick={playClick}
              className={({ isActive }) => 
                `relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'text-primary bg-primary/5 font-medium' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary shadow-glow-primary' : 'text-slate-400 group-hover:text-slate-300'}`} />
                  <span className="font-heading text-sm tracking-wide">{item.name}</span>
                  
                  {/* Sliding glow track for active path */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-[3px] top-2 bottom-2 bg-gradient-to-b from-primary to-accent rounded-r"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* System Status & Sound Controls */}
      <div className="space-y-3 pt-6 border-t border-white/5">
        {/* Audio Toggle */}
        <button
          onClick={() => {
            toggleMute();
          }}
          onMouseEnter={playTick}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
        >
          <span className="font-heading text-xs uppercase tracking-wider font-semibold">Sound Feed</span>
          {muted ? (
            <VolumeX className="w-4 h-4 text-danger/80" />
          ) : (
            <Volume2 className="w-4 h-4 text-success" />
          )}
        </button>

        {/* Log Out */}
        <button
          onClick={() => {
            playClick();
            logout();
          }}
          onMouseEnter={playTick}
          className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-danger/80 hover:text-danger hover:bg-danger/5 transition-all group font-heading text-sm"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
};
