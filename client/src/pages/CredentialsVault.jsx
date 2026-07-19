import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { KeyRound, ShieldCheck, Eye, EyeOff, Plus, Trash2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

// Client-side cipher utility using the Master PIN key
const encryptPassword = (plaintext, pin) => {
  const shift = parseInt(pin) || 7777;
  const cipher = plaintext.split('').map(c => String.fromCharCode(c.charCodeAt(0) + (shift % 13) + 1)).join('');
  return btoa(cipher);
};

const decryptPassword = (ciphertext, pin) => {
  try {
    const shift = parseInt(pin) || 7777;
    const rawCipher = atob(ciphertext);
    return rawCipher.split('').map(c => String.fromCharCode(c.charCodeAt(0) - (shift % 13) - 1)).join('');
  } catch (e) {
    return '*********';
  }
};

export const CredentialsVault = () => {
  const { request, isVaultLocked, unlockVault, lockVault } = useAuth();
  const { playClick, playTick, playSuccess, playAlert } = useAudioEffects();

  // PIN inputs
  const [pin, setPin] = useState('');
  
  // Data states
  const [credentials, setCredentials] = useState([]);
  const [revealedIds, setRevealedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('General');
  const [notes, setNotes] = useState('');
  const [activePinInput, setActivePinInput] = useState(''); // Keep track of PIN for encryption

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const res = await request('/api/student/passwords');
      setCredentials(res.passwords || []);
    } catch (err) {
      toast.error('Failed to decrypt vault records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isVaultLocked) {
      loadCredentials();
    }
  }, [isVaultLocked]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!pin) return;

    const ok = unlockVault(pin);
    if (ok) {
      setActivePinInput(pin);
      playSuccess();
      setPin('');
    } else {
      playAlert();
    }
  };

  const handleCreateCredential = async (e) => {
    e.preventDefault();
    if (!serviceName || !username || !password) return;

    try {
      // Encrypt the password client-side using the unlocked pin as seed
      const cipherText = encryptPassword(password, activePinInput);

      await request('/api/student/passwords', {
        method: 'POST',
        body: {
          service_name: serviceName,
          username,
          encrypted_password: cipherText,
          category,
          notes
        }
      });
      playSuccess();
      toast.success('Credentials secured in database.');
      setShowAddForm(false);
      setServiceName('');
      setUsername('');
      setPassword('');
      setCategory('General');
      setNotes('');
      loadCredentials();
    } catch (err) {
      toast.error('Failed to secure credentials.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Purge this credential record permanently?')) return;
    try {
      playAlert();
      await request(`/api/student/passwords/${id}`, { method: 'DELETE' });
      toast.success('Record purged.');
      loadCredentials();
    } catch (err) {
      toast.error('Failed to remove record.');
    }
  };

  const toggleRevealPassword = (id) => {
    playClick();
    setRevealedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // RENDER: Lock screen
  if (isVaultLocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm glass-panel border border-primary/20 rounded-2xl p-6 text-center shadow-glow-primary"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 mx-auto mb-4 animate-pulse">
            <Lock className="w-5 h-5 text-primary text-glow" />
          </div>

          <h3 className="font-cyber font-bold text-sm text-slate-200 uppercase tracking-widest text-glow">Decrypt Vault Node</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Accessing protected credential schemas</p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <input
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Master PIN"
              className="w-full text-center tracking-[1em] text-lg bg-white/5 border border-white/5 focus:border-primary/40 rounded-xl py-2.5 text-slate-200 focus:outline-none focus:ring-0 font-mono"
            />
            
            <button
              type="submit"
              onMouseEnter={playTick}
              className="w-full py-2.5 bg-primary hover:bg-glowColor text-black font-heading font-extrabold text-xs uppercase rounded-xl tracking-wider shadow-glow-primary transition-all"
            >
              Verify PIN
            </button>
          </form>

          <p className="text-[9px] text-slate-500 font-mono mt-4">Sandbox Default Master PIN: <span className="text-primary">7777</span></p>
        </motion.div>
      </div>
    );
  }

  // RENDER: Unlocked dashboard view
  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Upper header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-success bg-success/5 border border-success/15 px-3 py-1 rounded-full w-max">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Vault Decrypted & Active</span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-slate-200 mt-2">Credentials & Passwords Vault</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              playClick();
              setShowAddForm(true);
            }}
            onMouseEnter={playTick}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-glowColor text-black rounded-xl text-xs font-heading font-bold transition-all shadow-glow-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Secure Password</span>
          </button>
          <button
            onClick={() => {
              playClick();
              lockVault();
              setActivePinInput('');
            }}
            className="px-4 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-heading font-semibold"
          >
            Encrypt Vault
          </button>
        </div>
      </div>

      {/* Add password form modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowAddForm(false)} />
          <div className="relative w-full max-w-lg glass-panel-heavy rounded-2xl border border-white/10 p-6 shadow-2xl z-10">
            <h3 className="font-cyber font-bold text-sm text-primary mb-4 uppercase">Encrypt Credentials Payload</h3>
            
            <form onSubmit={handleCreateCredential} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Service Name</label>
                  <input
                    type="text"
                    required
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="GitHub, Portal, AWS..."
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="General" className="bg-slate-900">General</option>
                    <option value="Academic" className="bg-slate-900">Academic Portal</option>
                    <option value="Social" className="bg-slate-900">Developer Account</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Username / ID</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Secret Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase mb-1">Additional Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Recovery keys, MFA, codes..."
                  className="w-full bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-600"
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
                  Encrypt & Secure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Database listings */}
      {loading ? (
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Decrypting catalog nodes...</span>
        </div>
      ) : credentials.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 font-mono text-xs italic rounded-2xl">
          Vault is empty. Click "Secure Password" to create ciphertext assets.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((cred) => {
            const isRevealed = revealedIds.includes(cred.id);
            const decryptedVal = decryptPassword(cred.encrypted_password, activePinInput);

            return (
              <GlowCard key={cred.id} glowColor="rgba(0, 245, 255, 0.12)">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-mono text-[9px] uppercase bg-slate-900 border border-slate-800 text-slate-400">
                      {cred.category}
                    </span>
                    <KeyRound className="w-4 h-4 text-slate-500" />
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-slate-200 text-sm leading-tight">{cred.service_name}</h3>
                    <p className="font-mono text-[10px] text-slate-500 mt-1">{cred.username}</p>
                  </div>

                  {/* Password Display box */}
                  <div className="flex items-center justify-between bg-slate-950/60 border border-white/5 rounded-xl px-3 py-2">
                    <span className="font-mono text-xs text-primary text-glow">
                      {isRevealed ? decryptedVal : '••••••••••••'}
                    </span>

                    <button
                      onClick={() => toggleRevealPassword(cred.id)}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {cred.notes && (
                    <p className="text-[10px] text-slate-500 font-mono italic leading-relaxed">Notes: {cred.notes}</p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex justify-end">
                  <button
                    onClick={() => handleDelete(cred.id)}
                    className="p-1 text-slate-600 hover:text-danger transition-colors"
                    title="Purge credential"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}

    </div>
  );
};
export default CredentialsVault;
