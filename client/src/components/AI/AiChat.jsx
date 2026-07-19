import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, FolderClosed, FileText, Calendar, CheckSquare, BrainCircuit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioEffects } from '../ui/AudioFeedback';

export const AiChat = ({ isOpen, onClose }) => {
  const { request } = useAuth();
  const { playClick, playTick, playSuccess } = useAudioEffects();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Greetings. I am the ECHO VAULT Co-Pilot. I have indexing access to your academic database. You can ask me to find notes, check attendance status, summarize assignments, or inspect code projects.',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const processQuery = async (query) => {
    setIsTyping(true);
    const cleaned = query.toLowerCase().trim();

    // Default reply template
    let reply = {
      sender: 'ai',
      text: "I couldn't locate specific records for that query. Try asking 'Where are my DBMS Notes?', 'Show my attendance stats', or 'What assignments are due?'",
      timestamp: new Date()
    };

    try {
      if (cleaned.includes('dbms note') || cleaned.includes('database note') || cleaned.includes('dbms')) {
        // Query database notes for DBMS
        const res = await request('/api/notes?search=DBMS');
        const notes = res.notes || [];

        if (notes.length > 0) {
          reply = {
            sender: 'ai',
            text: 'I found matching DBMS documents in your repository. Here are the index details:',
            widgetType: 'notes',
            data: notes,
            timestamp: new Date()
          };
        } else {
          reply = {
            sender: 'ai',
            text: 'No notes with "DBMS" were found in the database. Would you like to create one now?',
            timestamp: new Date()
          };
        }
      } else if (cleaned.includes('attendance') || cleaned.includes('present') || cleaned.includes('absent')) {
        // Query attendance
        const res = await request('/api/student/attendance');
        const stats = res.stats || [];

        if (stats.length > 0) {
          reply = {
            sender: 'ai',
            text: 'Here is your current subject-wise attendance analytics:',
            widgetType: 'attendance',
            data: stats,
            timestamp: new Date()
          };
        } else {
          reply = {
            sender: 'ai',
            text: 'No attendance logs found. Log attendance sessions in the Attendance Lab first.',
            timestamp: new Date()
          };
        }
      } else if (cleaned.includes('assignment') || cleaned.includes('homework') || cleaned.includes('due')) {
        // Query assignments
        const res = await request('/api/student/assignments');
        const assignments = (res.assignments || []).filter(a => a.status !== 'done');

        if (assignments.length > 0) {
          reply = {
            sender: 'ai',
            text: 'You have pending academic assignments. Here are the upcoming deadlines:',
            widgetType: 'assignments',
            data: assignments,
            timestamp: new Date()
          };
        } else {
          reply = {
            sender: 'ai',
            text: 'Splendid! You have zero pending assignments in your queue.',
            timestamp: new Date()
          };
        }
      } else if (cleaned.includes('project') || cleaned.includes('git')) {
        // Query projects
        const res = await request('/api/student/projects');
        const projects = res.projects || [];

        if (projects.length > 0) {
          reply = {
            sender: 'ai',
            text: 'Retrieving your active engineering milestones and development progress:',
            widgetType: 'projects',
            data: projects,
            timestamp: new Date()
          };
        } else {
          reply = {
            sender: 'ai',
            text: 'No projects cataloged in the repository.',
            timestamp: new Date()
          };
        }
      }
    } catch (err) {
      reply = {
        sender: 'ai',
        text: 'Error accessing database query logs. Please check server connection.',
        timestamp: new Date()
      };
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, reply]);
      playSuccess();
    }, 800);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    playClick();
    const userMsg = {
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const userQuery = input;
    setInput('');
    processQuery(userQuery);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/30 backdrop-blur-sm pointer-events-auto"
          />

          {/* Chat drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-secondaryBg/95 backdrop-blur-md border-l border-white/5 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 shadow-glow-accent">
                  <BrainCircuit className="w-4.5 h-4.5 text-accent animate-pulse" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm tracking-wide text-white">ECHO CO-PILOT</h3>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Direct Index Retrieval</span>
                </div>
              </div>
              <button
                onClick={() => {
                  playClick();
                  onClose();
                }}
                onMouseEnter={playTick}
                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm font-sans ${
                    msg.sender === 'user'
                      ? 'bg-accent/15 border border-accent/30 text-slate-200 rounded-tr-none'
                      : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
                  }`}>
                    {msg.text}

                    {/* RENDER DYNAMIC WIDGETS IF APPLICABLE */}
                    {msg.widgetType === 'notes' && (
                      <div className="mt-4 space-y-3">
                        {msg.data.map(note => (
                          <div key={note.id} className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <div className="overflow-hidden">
                                <p className="font-mono text-xs text-slate-200 truncate">{note.title}</p>
                                <p className="text-[10px] text-slate-500 truncate">Folder: {note.folder_name}</p>
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono shrink-0">Sem {note.subject_id ? 5 : 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.widgetType === 'attendance' && (
                      <div className="mt-4 space-y-3">
                        {msg.data.map((stat, idx) => (
                          <div key={idx} className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-between">
                            <span className="font-heading text-xs text-slate-200">Sub ID {stat.subject_id}</span>
                            <span className="font-mono text-xs text-primary font-bold">
                              {Math.round((stat.present_count / stat.total_count) * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.widgetType === 'assignments' && (
                      <div className="mt-4 space-y-2">
                        {msg.data.map(assign => (
                          <div key={assign.id} className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                            <div className="overflow-hidden">
                              <p className="font-heading text-xs text-slate-200 truncate">{assign.title}</p>
                              <p className="text-[10px] text-danger/80 truncate">Due: {assign.deadline.split(' ')[0]}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] ${
                              assign.priority === 'high' ? 'bg-danger/25 text-danger' : 'bg-warning/25 text-warning'
                            }`}>{assign.priority}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-600 font-mono mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-6 border-t border-white/5 bg-slate-950/40 flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Co-Pilot..."
                className="flex-1 bg-white/5 border border-white/5 focus:border-accent/40 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 font-sans"
              />
              <button
                type="submit"
                onMouseEnter={playTick}
                className="p-3 bg-accent hover:bg-purple-600 rounded-xl text-white transition-all shadow-glow-accent"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
