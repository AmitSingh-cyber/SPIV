import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderClosed, 
  FileText, 
  Search, 
  Star, 
  Trash2, 
  UploadCloud, 
  History, 
  Undo2, 
  Plus,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAudioEffects } from '../ui/AudioFeedback';
import { FileViewer } from './FileViewer';
import { VersionHistory } from './VersionHistory';
import toast from 'react-hot-toast';

export const FloatingExplorer = ({ isPickerMode = false, onSelectFile, onClosePicker }) => {
  const { request } = useAuth();
  const { playClick, playTick, playSuccess, playAlert } = useAudioEffects();
  const [files, setFiles] = useState([]);
  const [folder, setFolder] = useState('Documents'); // Desktop, Downloads, Documents, Pictures, Videos, Trash
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals / Overlays
  const [previewFile, setPreviewFile] = useState(null);
  const [historyFile, setHistoryFile] = useState(null);
  
  // Custom folder creation
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fileInputRef = useRef(null);
  const fileVersionInputRef = useRef(null);
  const activeVersionFileIdRef = useRef(null);
  const dropZoneRef = useRef(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const isTrash = folder === 'Trash';
      const folderParam = isTrash ? '' : `folder=${folder}`;
      const searchParam = search ? `&search=${search}` : '';
      const trashParam = isTrash ? 'is_deleted=1' : 'is_deleted=0';

      const url = `/api/files?${folderParam}${searchParam}&${trashParam}`;
      const data = await request(url);
      setFiles(data.files || []);
    } catch (err) {
      toast.error('Failed to sync files list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [folder, search]);

  const handleUpload = async (fileObj) => {
    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('folder_name', folder === 'Trash' ? 'Documents' : folder);

    try {
      toast.loading('Uploading payload...', { id: 'upload' });
      await request('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      playSuccess();
      toast.success('File stored securely in cloud.', { id: 'upload' });
      loadFiles();
    } catch (err) {
      toast.error('Upload failed.', { id: 'upload' });
    }
  };

  const handleUploadVersion = async (fileObj, fileId) => {
    const formData = new FormData();
    formData.append('file', fileObj);

    try {
      toast.loading('Uploading revision...', { id: 'upload-ver' });
      await request(`/api/files/upload-version/${fileId}`, {
        method: 'POST',
        body: formData
      });
      playSuccess();
      toast.success('Version history updated.', { id: 'upload-ver' });
      loadFiles();
    } catch (err) {
      toast.error('Revision upload failed.', { id: 'upload-ver' });
    }
  };

  const handleFilePickerClick = async () => {
    if (window.showOpenFilePicker) {
      try {
        const [fileHandle] = await window.showOpenFilePicker();
        const fileObj = await fileHandle.getFile();
        handleUpload(fileObj);
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('System picker failed.');
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const triggerUploadVersionInput = (fileId) => {
    activeVersionFileIdRef.current = fileId;
    fileVersionInputRef.current?.click();
  };

  const handleTextFileEditSave = async (fileId, newContent) => {
    try {
      await request(`/api/files/text-save/${fileId}`, {
        method: 'POST',
        body: { content: newContent }
      });
      playSuccess();
      toast.success('Changes committed as new version.');
      loadFiles();
    } catch (err) {
      toast.error('Failed to save file changes.');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleUpload(droppedFiles[0]);
    }
  };

  // Actions
  const handleToggleFavorite = async (id) => {
    try {
      const res = await request(`/api/files/${id}/favorite`, { method: 'PUT' });
      toast.success(res.is_favorite ? 'Added to favorites.' : 'Removed from favorites.');
      loadFiles();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  const handleTrash = async (id) => {
    try {
      await request(`/api/files/${id}/trash`, { method: 'PUT' });
      playAlert();
      toast.success('Sent to Trash Bin.');
      loadFiles();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  const handleRestore = async (id) => {
    try {
      await request(`/api/files/${id}/restore`, { method: 'PUT' });
      playSuccess();
      toast.success('File restored successfully.');
      loadFiles();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this file and all revision logs? This is irreversible.')) return;
    try {
      await request(`/api/files/${id}/permanent`, { method: 'DELETE' });
      playAlert();
      toast.success('Permanently purged.');
      loadFiles();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  const folders = [
    { name: 'Documents', count: 0 },
    { name: 'Pictures', count: 0 },
    { name: 'Videos', count: 0 },
    { name: 'Music', count: 0 },
    { name: 'Downloads', count: 0 },
    { name: 'Trash', count: 0 }
  ];

  return (
    <div 
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full flex-1 flex flex-col md:flex-row glass-panel border border-white/5 rounded-2xl overflow-hidden min-h-[70vh] shadow-glass ${
        isPickerMode ? 'border-primary/20 shadow-glow-primary' : ''
      }`}
    >
      {/* Hidden standard input fallback */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} 
      />
      <input 
        type="file" 
        ref={fileVersionInputRef} 
        className="hidden" 
        onChange={(e) => e.target.files?.[0] && handleUploadVersion(e.target.files[0], activeVersionFileIdRef.current)} 
      />

      {/* Explorer Left Pane */}
      <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/5 bg-slate-950/20 p-4 space-y-4 select-none shrink-0">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-[10px] text-slate-500 font-cyber font-bold tracking-widest uppercase">Drive Directory</span>
          <HardDrive className="w-3.5 h-3.5 text-primary text-glow animate-pulse" />
        </div>

        <div className="space-y-1">
          {folders.map((f) => {
            const isSelected = folder === f.name;
            return (
              <button
                key={f.name}
                onMouseEnter={playTick}
                onClick={() => {
                  playClick();
                  setFolder(f.name);
                }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-heading font-medium transition-all group ${
                  isSelected 
                    ? 'bg-primary/10 border border-primary/20 text-primary shadow-glow-primary' 
                    : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {f.name === 'Trash' ? (
                    <Trash2 className="w-4 h-4" />
                  ) : (
                    <FolderClosed className="w-4 h-4 group-hover:scale-105 transition-transform" />
                  )}
                  <span>{f.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explorer Main Content Area */}
      <div className="flex-1 flex flex-col bg-slate-900/10">
        
        {/* Top Operations Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-white/5 bg-slate-950/20 gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file index..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-800 focus:ring-0 font-sans"
            />
          </div>

          {/* Action trigger */}
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {folder !== 'Trash' && (
              <button
                onClick={handleFilePickerClick}
                onMouseEnter={playTick}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-glowColor text-black rounded-xl text-xs font-heading font-bold transition-all w-full sm:w-auto shadow-glow-primary"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            )}
            {isPickerMode && (
              <button
                onClick={onClosePicker}
                className="px-4 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-heading font-semibold"
              >
                Close Picker
              </button>
            )}
          </div>
        </div>

        {/* Files Grid / List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 font-mono text-slate-500 py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Gathering files trace...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center py-16">
              <FolderClosed className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <p className="font-heading font-bold text-slate-400 text-sm">Directory is empty</p>
              <p className="text-xs text-slate-600 font-mono mt-1">Drag files here to upload instantly</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group relative flex flex-col justify-between p-4 rounded-xl border border-white/5 hover:border-slate-800 bg-slate-950/20 hover:bg-slate-950/40 transition-all select-none"
                >
                  {/* Card Main */}
                  <div 
                    onClick={() => {
                      playClick();
                      if (isPickerMode) {
                        onSelectFile(file);
                      } else {
                        setPreviewFile(file);
                      }
                    }}
                    className="cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:shadow-glow-primary transition-all">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      
                      {/* Version Stamp */}
                      <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[9px] text-slate-400">
                        v{file.version}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-mono text-xs text-slate-200 truncate pr-4" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[9px] text-slate-600 font-mono uppercase mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    {folder === 'Trash' ? (
                      <>
                        <button
                          onClick={() => handleRestore(file.id)}
                          onMouseEnter={playTick}
                          className="flex items-center gap-1.5 text-xs text-success hover:underline font-heading font-medium"
                          title="Restore file"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(file.id)}
                          onMouseEnter={playTick}
                          className="text-xs text-danger/80 hover:text-danger font-heading font-medium"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleFavorite(file.id)}
                            onMouseEnter={playTick}
                            className={`p-1 rounded hover:bg-white/5 transition-all ${
                              file.is_favorite ? 'text-warning shadow-glow-accent' : 'text-slate-500 hover:text-slate-300'
                            }`}
                            title="Favorite"
                          >
                            <Star className="w-3.5 h-3.5" fill={file.is_favorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => setHistoryFile(file)}
                            onMouseEnter={playTick}
                            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all"
                            title="Version History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerUploadVersionInput(file.id)}
                            onMouseEnter={playTick}
                            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all font-mono text-[9px] font-semibold border border-transparent hover:border-slate-800"
                            title="Upload New Version"
                          >
                            +REV
                          </button>
                        </div>
                        <button
                          onClick={() => handleTrash(file.id)}
                          onMouseEnter={playTick}
                          className="p-1 rounded hover:bg-white/5 text-slate-600 hover:text-danger transition-all"
                          title="Send to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* OVERLAY: File Previews */}
      {previewFile && (
        <FileViewer
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onSaveContent={handleTextFileEditSave}
        />
      )}

      {/* OVERLAY: Version History Comparative Diff */}
      {historyFile && (
        <VersionHistory
          file={historyFile}
          onClose={() => setHistoryFile(null)}
        />
      )}
    </div>
  );
};
export default FloatingExplorer;
