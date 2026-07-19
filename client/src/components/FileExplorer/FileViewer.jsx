import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Play, FileText, Music, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const FileViewer = ({ file, onClose, onSaveContent }) => {
  const { request } = useAuth();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isTextFile = 
    file.type.startsWith('text/') || 
    file.name.endsWith('.js') || 
    file.name.endsWith('.jsx') || 
    file.name.endsWith('.css') || 
    file.name.endsWith('.json') || 
    file.name.endsWith('.md') ||
    file.name.endsWith('.html');

  useEffect(() => {
    if (isTextFile) {
      setLoading(true);
      request(`/api/files/${file.id}/content`)
        .then(res => {
          if (res.success) {
            setContent(res.content);
          }
        })
        .catch(err => {
          toast.error('Failed to load file contents.');
        })
        .finally(() => setLoading(false));
    }
  }, [file, isTextFile]);

  const handleSave = () => {
    onSaveContent(file.id, content);
    setIsEditing(false);
  };

  const getMediaUrl = () => {
    return `http://localhost:5000/${file.path}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />

      {/* Frame */}
      <div className="relative w-full max-w-4xl h-[80vh] glass-panel-heavy rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl z-10">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <FileText className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md">{file.name}</h3>
              <p className="text-[10px] text-slate-500 font-mono">Size: {(file.size / 1024).toFixed(1)} KB | Version {file.version}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTextFile && (
              isEditing ? (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-1.5 bg-success/20 border border-success/30 hover:border-success/60 text-success rounded-xl text-xs font-heading font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Version</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-heading font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit File</span>
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto bg-slate-950/20 p-6 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 font-mono text-slate-500">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Decrypting payload...</span>
            </div>
          ) : (
            <>
              {/* Image Previewer */}
              {file.type.startsWith('image/') && (
                <img
                  src={getMediaUrl()}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg border border-white/5"
                />
              )}

              {/* Video Player */}
              {file.type.startsWith('video/') && (
                <video
                  src={getMediaUrl()}
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-lg border border-white/5"
                />
              )}

              {/* Audio Player */}
              {file.type.startsWith('audio/') && (
                <div className="flex flex-col items-center gap-6 p-8 glass-panel rounded-2xl w-full max-w-sm border border-white/5">
                  <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center shadow-glow-primary">
                    <Music className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-heading font-bold text-slate-200 text-sm">{file.name}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-1 uppercase">Audio Waveform Mode</p>
                  </div>
                  <audio src={getMediaUrl()} controls className="w-full mt-4" />
                </div>
              )}

              {/* Text / Code File Editor */}
              {isTextFile && (
                <div className="w-full h-full font-mono text-sm">
                  {isEditing ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-full bg-slate-900/50 border border-white/5 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-0 resize-none font-mono"
                    />
                  ) : (
                    <pre className="w-full h-full bg-slate-950/60 border border-white/5 rounded-xl p-4 overflow-auto text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
                      {content || 'Empty File.'}
                    </pre>
                  )}
                </div>
              )}

              {/* PDF Previewer Fallback */}
              {file.type.includes('pdf') && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <FileText className="w-16 h-16 text-primary shadow-glow-primary" />
                  <div>
                    <p className="font-heading font-bold text-slate-200">Portable Document Format (PDF)</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">Direct embedded rendering requires PDF engine</p>
                  </div>
                  <a
                    href={getMediaUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded-xl font-heading text-xs font-semibold shadow-glow-primary"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Open in Web Tab</span>
                  </a>
                </div>
              )}

              {/* Unsupported binary format placeholder */}
              {!file.type.startsWith('image/') &&
               !file.type.startsWith('video/') &&
               !file.type.startsWith('audio/') &&
               !file.type.includes('pdf') &&
               !isTextFile && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-slate-300">Binary Payload</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">Unsupported online preview format ({file.type})</p>
                  </div>
                  <a
                    href={getMediaUrl()}
                    download
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-200 rounded-xl font-heading text-xs font-semibold"
                  >
                    <span>Download Payload</span>
                  </a>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
