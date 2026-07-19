import React, { useState, useEffect } from 'react';
import { X, History, ArrowRightLeft, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const VersionHistory = ({ file, onClose }) => {
  const { request } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [contentA, setContentA] = useState('');
  const [contentB, setContentB] = useState('');
  const [diffMode, setDiffMode] = useState(false);

  useEffect(() => {
    request(`/api/files/${file.id}/history`)
      .then(res => {
        if (res.success) {
          setHistory(res.history);
          // Default: compare A is the latest, compare B is version 1 or the previous version
          if (res.history.length > 0) {
            setCompareA(res.history[0]);
            if (res.history.length > 1) {
              setCompareB(res.history[1]);
            } else {
              setCompareB(res.history[0]);
            }
          }
        }
      })
      .catch(err => {
        toast.error('Failed to load version history.');
      })
      .finally(() => setLoading(false));
  }, [file]);

  // Load content when comparisons change
  useEffect(() => {
    const fetchContents = async () => {
      if (!compareA || !compareB) return;
      try {
        const resA = await request(`/api/files/${compareA.id}/content`);
        const resB = await request(`/api/files/${compareB.id}/content`);
        setContentA(resA.content || '');
        setContentB(resB.content || '');
      } catch (err) {
        // Safe fail for non-text binary files
        setContentA('');
        setContentB('');
      }
    };
    fetchContents();
  }, [compareA, compareB]);

  // Render a simple diff box line by line
  const renderDiff = () => {
    const linesA = contentA.split('\n');
    const linesB = contentB.split('\n');
    const maxLines = Math.max(linesA.length, linesB.length);

    return (
      <div className="grid grid-cols-2 gap-4 h-full overflow-auto font-mono text-xs leading-relaxed p-4 bg-slate-950/60 rounded-xl border border-white/5">
        {/* Left Side: Selected Version B */}
        <div className="border-r border-slate-900 pr-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-cyber mb-2">Version {compareB?.version}</p>
          <div className="space-y-0.5">
            {linesB.map((line, idx) => (
              <div 
                key={idx} 
                className={`px-1 rounded ${
                  !linesA.includes(line) ? 'bg-danger/10 text-danger-400 line-through' : 'text-slate-400'
                }`}
              >
                {line || ' '}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Selected Version A */}
        <div className="pl-4">
          <p className="text-[10px] text-primary uppercase tracking-widest font-cyber mb-2">Version {compareA?.version} (Newer)</p>
          <div className="space-y-0.5">
            {linesA.map((line, idx) => (
              <div 
                key={idx} 
                className={`px-1 rounded ${
                  !linesB.includes(line) ? 'bg-success/10 text-success' : 'text-slate-400'
                }`}
              >
                {line || ' '}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />

      {/* Box */}
      <div className="relative w-full max-w-5xl h-[80vh] glass-panel-heavy rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/40 shadow-glow-accent">
              <History className="w-4.5 h-4.5 text-accent animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-200">VERSION TIMELINE</h3>
              <p className="text-[10px] text-slate-500 font-mono">Trace history & comparisons for: {file.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {history.length > 1 && (
              <button
                onClick={() => setDiffMode(!diffMode)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-heading font-semibold transition-all ${
                  diffMode 
                    ? 'bg-primary/20 border-primary/40 text-primary shadow-glow-primary'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Compare Versions</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 font-mono text-slate-500">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Scanning version trace logs...</span>
            </div>
          ) : (
            <>
              {/* Left Pane: Timeline list */}
              <div className="w-80 border-r border-white/5 overflow-y-auto p-4 space-y-4">
                <h4 className="text-[10px] tracking-widest text-slate-500 uppercase font-cyber px-1">Revision History ({history.length})</h4>
                <div className="relative border-l border-slate-800 ml-3 pl-5 space-y-6 py-2">
                  {history.map((h, idx) => {
                    const isA = compareA?.id === h.id;
                    const isB = compareB?.id === h.id;

                    return (
                      <div key={h.id} className="relative group">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[26px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          isA 
                            ? 'bg-primary border-primary shadow-glow-primary' 
                            : isB 
                              ? 'bg-accent border-accent shadow-glow-accent'
                              : 'bg-slate-900 border-slate-700'
                        }`} />

                        {/* Card */}
                        <div className={`p-3 rounded-xl border transition-all ${
                          isA || isB 
                            ? 'bg-white/5 border-slate-700' 
                            : 'bg-transparent border-transparent hover:bg-white/5'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-200">Version {h.version}</span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">{(h.size / 1024).toFixed(1)} KB</p>

                          {/* Quick selectors for compare */}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => setCompareA(h)}
                              className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                                isA 
                                  ? 'bg-primary/20 border-primary text-primary' 
                                  : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Comp A
                            </button>
                            <button
                              onClick={() => setCompareB(h)}
                              className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                                isB 
                                  ? 'bg-accent/20 border-accent text-accent' 
                                  : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Comp B
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Pane: Main viewer/comparator */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col">
                {diffMode ? (
                  renderDiff()
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-heading font-semibold text-slate-200 text-sm mb-4">Version Properties</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">Version A (Primary Focus)</span>
                          <p className="font-heading font-bold text-slate-200 text-lg mt-1">Version {compareA?.version}</p>
                          <p className="text-xs text-slate-400 font-mono mt-1">Size: {(compareA?.size / 1024).toFixed(1)} KB</p>
                          <p className="text-xs text-slate-500 font-mono mt-1">Uploaded: {new Date(compareA?.created_at).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">Version B (Historical Pivot)</span>
                          <p className="font-heading font-bold text-slate-200 text-lg mt-1">Version {compareB?.version}</p>
                          <p className="text-xs text-slate-400 font-mono mt-1">Size: {(compareB?.size / 1024).toFixed(1)} KB</p>
                          <p className="text-xs text-slate-500 font-mono mt-1">Uploaded: {new Date(compareB?.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center p-8 bg-slate-900/30 border border-slate-800 rounded-xl border-dashed">
                      <div className="text-center max-w-sm">
                        <FileCheck className="w-10 h-10 text-primary mx-auto mb-3 shadow-glow-primary animate-pulse" />
                        <p className="font-heading font-semibold text-slate-200 text-xs">Verify code codebases or essay revisions</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1.5">Click "Compare Versions" at the top right to compare content diffs side-by-side.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
