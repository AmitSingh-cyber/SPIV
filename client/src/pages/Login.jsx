import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { motion } from 'framer-motion';
import { Terminal, Lock, Mail, User, ShieldAlert } from 'lucide-react';

export const Login = () => {
  const { login, register } = useAuth();
  const { playClick, playTick, playAlert } = useAudioEffects();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('5'); // Default to 3rd year / Sem 5

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      const ok = await register(name, email, password, rollNumber, branch, semester);
      if (!ok) playAlert();
    } else {
      const ok = await login(email, password);
      if (!ok) playAlert();
    }
    setLoading(false);
  };

  const handleQuickDemoLogin = async () => {
    playClick();
    setLoading(true);
    const ok = await login('tony@echo.edu', 'echo1234');
    if (!ok) playAlert();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative select-none">
      {/* Glass card frame */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-lg glass-panel-heavy border border-primary/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
      >
        {/* Pulsing neon top accent strip */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-accent animate-pulse" />

        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent to-primary shadow-glow-primary mb-4">
            <span className="font-cyber font-black text-2xl text-black">⚡</span>
          </div>
          <h2 className="font-cyber font-extrabold tracking-widest text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-glowColor to-accent uppercase text-glow">
            ECHO VAULT
          </h2>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">The Future of Student Database Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Name */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-primary/45 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-0 font-sans"
                />
              </div>

              {/* Roll Number, Branch & Semester */}
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Roll No"
                  className="w-full px-3.5 py-3 bg-white/5 border border-white/5 focus:border-primary/45 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-0 font-sans"
                />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Major"
                  className="w-full px-3.5 py-3 bg-white/5 border border-white/5 focus:border-primary/45 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-0 font-sans"
                />
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-2.5 py-3 bg-slate-900 border border-white/5 focus:border-primary/45 rounded-xl text-xs text-slate-400 focus:outline-none font-sans"
                >
                  <option value="1" className="bg-slate-950">Sem 1</option>
                  <option value="2" className="bg-slate-950">Sem 2</option>
                  <option value="3" className="bg-slate-950">Sem 3</option>
                  <option value="4" className="bg-slate-950">Sem 4</option>
                  <option value="5" className="bg-slate-950">Sem 5</option>
                  <option value="6" className="bg-slate-950">Sem 6</option>
                  <option value="7" className="bg-slate-950">Sem 7</option>
                  <option value="8" className="bg-slate-950">Sem 8</option>
                </select>
              </div>
            </motion.div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Academic Email Address"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-primary/45 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-0 font-sans"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vault Security Password"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-primary/45 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-0 font-sans"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            onMouseEnter={playTick}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:brightness-110 text-black font-heading font-extrabold text-sm uppercase rounded-xl tracking-wider shadow-glow-primary transition-all disabled:opacity-50"
          >
            {loading ? 'Initializing Access...' : isRegister ? 'Confirm Registration' : 'Decrypt Vault'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              playClick();
              setIsRegister(!isRegister);
            }}
            className="text-xs text-slate-400 hover:text-primary transition-colors font-heading"
          >
            {isRegister ? 'Already registered? Decrypt existing vault' : 'No cryptographic vault? Register Node'}
          </button>
        </div>

        {/* Quick Demo Credentials Panel */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-warning/70 bg-warning/5 border border-warning/10 px-3 py-1 rounded-full mb-4">
            <ShieldAlert className="w-3 h-3 text-warning" />
            <span>Developer Sandbox Environment</span>
          </div>

          <button
            onClick={handleQuickDemoLogin}
            onMouseEnter={playTick}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-slate-800 hover:border-slate-700 text-slate-300 font-heading text-xs font-semibold rounded-xl transition-all"
          >
            <Terminal className="w-4 h-4 text-primary" />
            <span>Access Vault via Demo Protocol (Tony Stark)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
