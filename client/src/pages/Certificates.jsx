import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { Award, ExternalLink, Plus, Calendar, FileCheck, Eye } from 'lucide-react';
import { FileViewer } from '../components/FileExplorer/FileViewer';
import toast from 'react-hot-toast';

export const Certificates = () => {
  const { request } = useAuth();
  const { playClick, playTick, playSuccess } = useAudioEffects();
  
  const [certs, setCerts] = useState([]);
  const [dbFiles, setDbFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [verifyLink, setVerifyLink] = useState('');
  const [linkedFileId, setLinkedFileId] = useState('');
  
  // Preview
  const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const [certRes, filesRes] = await Promise.all([
        request('/api/student/certificates'),
        request('/api/files?folder=Documents') // Load files to link
      ]);
      setCerts(certRes.certificates || []);
      setDbFiles(filesRes.files || []);
      if (filesRes.files.length > 0) {
        setLinkedFileId(filesRes.files[0].id.toString());
      }
    } catch (err) {
      toast.error('Failed to sync certificates registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !issuer || !issueDate) return;

    try {
      await request('/api/student/certificates', {
        method: 'POST',
        body: {
          name,
          issuer,
          issue_date: issueDate,
          credential_id: credentialId,
          verification_link: verifyLink,
          file_id: linkedFileId ? parseInt(linkedFileId) : null
        }
      });
      playSuccess();
      toast.success('Certificate registered.');
      setShowAddForm(false);
      setName('');
      setIssuer('');
      setIssueDate('');
      setCredentialId('');
      setVerifyLink('');
      setLinkedFileId('');
      loadCertificates();
    } catch (err) {
      toast.error('Failed to record credential.');
    }
  };

  const handleLaunchPreview = async (fileId) => {
    try {
      const res = await request(`/api/files/${fileId}`);
      if (res.success) {
        setSelectedFileForPreview(res.file);
      }
    } catch (e) {
      toast.error('Could not fetch linked document details.');
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Parsing secure credentials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Title block */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="font-cyber font-bold tracking-wider text-xs text-slate-500 uppercase">Verification Registry</h2>
          <p className="text-xl font-heading font-extrabold text-slate-200 mt-1">Credentials & Certifications</p>
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
          <span>Add Certificate</span>
        </button>
      </div>

      {/* Add Form Drawer Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-lg glass-panel-heavy rounded-2xl border border-white/10 p-6 shadow-2xl z-10">
            <h3 className="font-cyber font-bold text-sm text-primary mb-4 uppercase">Register Credential Node</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Issuer</label>
                  <input
                    type="text"
                    required
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Credential ID</label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Verification URL</label>
                <input
                  type="url"
                  value={verifyLink}
                  onChange={(e) => setVerifyLink(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Link to Vault Document (Optional)</label>
                <select
                  value={linkedFileId}
                  onChange={(e) => setLinkedFileId(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">No linked document</option>
                  {dbFiles.map(f => (
                    <option key={f.id} value={f.id} className="bg-slate-900">
                      {f.name} (v{f.version})
                    </option>
                  ))}
                </select>
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
                  Commit Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Showcase Grid */}
      {certs.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 font-mono text-xs italic rounded-2xl">
          No certificates registered. Click "Add Certificate" to catalog digital verification codes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map((cert) => (
            <GlowCard key={cert.id} className="flex flex-col justify-between" glowColor="rgba(0, 255, 153, 0.12)">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-success/15 border border-success/20 flex items-center justify-center shadow-glow-success">
                    <Award className="w-5 h-5 text-success" />
                  </div>
                  <span className="font-mono text-[9px] text-slate-500 uppercase">{cert.issue_date}</span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-slate-200 text-sm leading-tight">{cert.name}</h3>
                  <p className="font-mono text-[10px] text-slate-500 mt-1 uppercase">{cert.issuer}</p>
                  
                  {cert.credential_id && (
                    <p className="font-mono text-[9px] text-slate-600 truncate mt-2">ID: {cert.credential_id}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-3.5 border-t border-slate-800/60 flex items-center justify-between gap-3 text-xs font-heading font-bold">
                {cert.file_id ? (
                  <button
                    onClick={() => {
                      playClick();
                      handleLaunchPreview(cert.file_id);
                    }}
                    onMouseEnter={playTick}
                    className="flex items-center gap-1 text-slate-400 hover:text-primary transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Doc</span>
                  </button>
                ) : (
                  <span className="text-[9px] text-slate-600 font-mono select-none">No local attachment</span>
                )}

                {cert.verification_link && (
                  <a
                    href={cert.verification_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-400 hover:text-accent transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Verify Code</span>
                  </a>
                )}
              </div>
            </GlowCard>
          ))}
        </div>
      )}

      {/* OVERLAY: Linked document viewer */}
      {selectedFileForPreview && (
        <FileViewer
          file={selectedFileForPreview}
          onClose={() => setSelectedFileForPreview(null)}
          onSaveContent={() => {}} // No editing support from this link
        />
      )}

    </div>
  );
};
export default Certificates;
