import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, FolderClosed, FileText, Sparkles, Terminal, Volume2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioEffects } from '../ui/AudioFeedback';

export const QuickSearchModal = ({ isOpen, onClose, onAiOpen, onUploadTrigger }) => {
  const navigate = useNavigate();
  const { request, lockVault } = useAuth();
  const { playClick, playTick, toggleMute } = useAudioEffects();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ files: [], notes: [] });
  const inputRef = useRef(null);

  // Command palette defaults
  const commands = [
    { name: 'Navigate: Dashboard', action: () => navigate('/'), icon: Terminal },
    { name: 'Navigate: Notes Lab', action: () => navigate('/notes'), icon: FileText },
    { name: 'Navigate: File Storage', action: () => navigate('/files'), icon: FolderClosed },
    { name: 'Action: Mute / Unmute Sounds', action: () => toggleMute(), icon: Volume2 },
    { name: 'Action: Lock Credentials Vault', action: () => lockVault(), icon: KeyRound },
    { name: 'Action: Open AI Assistant', action: () => { onClose(); onAiOpen(); }, icon: Sparkles },
    { name: 'Action: Upload Document', action: () => { onClose(); onUploadTrigger(); }, icon: FolderClosed }
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // Triggers open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ files: [], notes: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ files: [], notes: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const fileRes = await request(`/api/files?search=${query}`);
        const noteRes = await request(`/api/notes?search=${query}`);
        setResults({
          files: fileRes.files || [],
          notes: noteRes.notes || []
        });
      } catch (err) {
        console.error('Search query error:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleCommandRun = (action) => {
    playClick();
    action();
    onClose();
  };

  const filteredCommands = commands.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl overflow-hidden glass-panel-heavy rounded-2xl border border-primary/20 shadow-glow-primary z-10 flex flex-col max-h-[500px]"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-800">
              <Search className="w-5 h-5 text-primary text-glow animate-pulse" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files, notes, or type commands..."
                className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0 text-md font-mono"
              />
              <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded font-mono">ESC</span>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Files results */}
              {results.files.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-widest text-primary uppercase font-cyber px-2 mb-2">Matching Files</h4>
                  <div className="space-y-1">
                    {results.files.map(file => (
                      <button
                        key={file.id}
                        onMouseEnter={playTick}
                        onClick={() => handleCommandRun(() => navigate('/files'))}
                        className="flex items-center justify-between w-full px-3 py-2 hover:bg-primary/5 rounded-xl transition-all text-left text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <FolderClosed className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-slate-200">{file.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{file.folder_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes results */}
              {results.notes.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-widest text-accent uppercase font-cyber px-2 mb-2">Matching Notes</h4>
                  <div className="space-y-1">
                    {results.notes.map(note => (
                      <button
                        key={note.id}
                        onMouseEnter={playTick}
                        onClick={() => handleCommandRun(() => navigate('/notes'))}
                        className="flex items-center justify-between w-full px-3 py-2 hover:bg-accent/5 rounded-xl transition-all text-left text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-200">{note.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{note.folder_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Command options */}
              <div>
                <h4 className="text-[10px] tracking-widest text-slate-500 uppercase font-cyber px-2 mb-2">Vault Commands</h4>
                {filteredCommands.length > 0 ? (
                  <div className="space-y-1">
                    {filteredCommands.map((cmd, idx) => (
                      <button
                        key={idx}
                        onMouseEnter={playTick}
                        onClick={() => handleCommandRun(cmd.action)}
                        className="flex items-center gap-3 w-full px-3 py-2 hover:bg-white/5 rounded-xl transition-all text-left text-sm"
                      >
                        <cmd.icon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                        <span className="font-heading text-slate-300">{cmd.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono italic px-2 py-1">No commands matched "{query}"</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
