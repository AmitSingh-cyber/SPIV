import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAudioEffects } from '../components/ui/AudioFeedback';
import { GlowCard } from '../components/ui/GlowCard';
import { 
  FolderClosed, 
  FileText, 
  Search, 
  Star, 
  Trash2, 
  Plus, 
  Save, 
  Eye, 
  Edit3,
  Tags,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Notes = () => {
  const { request } = useAuth();
  const { playClick, playTick, playSuccess, playAlert } = useAudioEffects();

  // Data State
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState(['All Notes']);
  const [tags, setTags] = useState([]);
  
  // Selection/Filter States
  const [selectedNote, setSelectedNote] = useState(null);
  const [activeFolder, setActiveFolder] = useState('All Notes');
  const [activeTag, setActiveTag] = useState('');
  const [search, setSearch] = useState('');
  
  // Editor State
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorFolder, setEditorFolder] = useState('All Notes');
  const [editorTags, setEditorTags] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const loadNotesData = async () => {
    try {
      const notesUrl = `/api/notes?search=${search}`;
      const [notesRes, foldersRes, tagsRes] = await Promise.all([
        request(notesUrl),
        request('/api/notes/folders'),
        request('/api/notes/tags')
      ]);

      let list = notesRes.notes || [];
      if (activeFolder !== 'All Notes') {
        list = list.filter(n => n.folder_name === activeFolder);
      }
      if (activeTag) {
        list = list.filter(n => {
          try {
            const parsed = JSON.parse(n.tags || '[]');
            return parsed.includes(activeTag);
          } catch {
            return false;
          }
        });
      }

      setNotes(list);
      setFolders(foldersRes.folders || ['All Notes']);
      setTags(tagsRes.tags || []);
    } catch (err) {
      toast.error('Failed to load notes data.');
    }
  };

  useEffect(() => {
    loadNotesData();
  }, [activeFolder, activeTag, search]);

  const handleSelectNote = (note) => {
    playClick();
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content || '');
    setEditorFolder(note.folder_name || 'All Notes');
    
    // Parse tags back to string list
    try {
      const parsed = JSON.parse(note.tags || '[]');
      setEditorTags(parsed.join(', '));
    } catch {
      setEditorTags('');
    }
    setPreviewMode(false);
  };

  const handleCreateNote = async () => {
    try {
      playClick();
      const res = await request('/api/notes', {
        method: 'POST',
        body: {
          title: 'Untitled Note',
          content: '# New Note\n\nWrite markdown payload here...',
          folder_name: activeFolder === 'All Notes' ? 'All Notes' : activeFolder
        }
      });
      playSuccess();
      toast.success('Note record initialized.');
      loadNotesData();
      if (res.note) {
        handleSelectNote(res.note);
      }
    } catch (err) {
      toast.error('Failed to create note.');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

    // Convert comma tags into array
    const tagArray = editorTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      toast.loading('Saving updates...', { id: 'notesave' });
      await request(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        body: {
          title: editorTitle,
          content: editorContent,
          folder_name: editorFolder,
          tags: tagArray
        }
      });
      playSuccess();
      toast.success('Note committed securely.', { id: 'notesave' });
      loadNotesData();
      
      // Update local state copy
      setSelectedNote(prev => ({
        ...prev,
        title: editorTitle,
        content: editorContent,
        folder_name: editorFolder,
        tags: JSON.stringify(tagArray)
      }));
    } catch (err) {
      toast.error('Save failed.', { id: 'notesave' });
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedNote) return;
    try {
      const nextFav = selectedNote.is_favorite ? 0 : 1;
      await request(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        body: { is_favorite: nextFav }
      });
      setSelectedNote(prev => ({ ...prev, is_favorite: nextFav }));
      loadNotesData();
    } catch (err) {
      toast.error('Toggling favorite failed.');
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedNote) return;
    if (!confirm('Move this note to the Trash?')) return;
    try {
      playAlert();
      await request(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        body: { is_deleted: 1 }
      });
      toast.success('Sent to Trash.');
      setSelectedNote(null);
      loadNotesData();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  // Custom client-side markdown to html parser
  const renderMarkdown = (text) => {
    if (!text) return '';
    let parsed = text
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-primary font-heading border-b border-slate-800 pb-2 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-md font-bold text-accent font-heading mt-6 mb-2">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-semibold text-slate-100 font-heading mt-4 mb-2">$1</h3>')
      .replace(/^\* (.*$)/gim, '<li class="list-disc ml-5 text-slate-300 mt-1">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="list-disc ml-5 text-slate-300 mt-1">$1</li>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="text-slate-100 font-semibold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-accent font-mono text-xs">$1</code>')
      .replace(/\n/g, '<br />');

    return { __html: parsed };
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row glass-panel border border-white/5 rounded-2xl overflow-hidden min-h-[70vh] shadow-glass select-none">
      
      {/* 1. Left Sidebar: Folder & Tag browser */}
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-950/20 p-4 space-y-5 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/5 focus:border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 font-sans"
          />
        </div>

        {/* Folders List */}
        <div>
          <span className="text-[9px] text-slate-500 font-cyber font-bold tracking-widest uppercase px-2">Folders</span>
          <div className="space-y-1 mt-2">
            {folders.map(f => {
              const isSelected = activeFolder === f;
              return (
                <button
                  key={f}
                  onMouseEnter={playTick}
                  onClick={() => {
                    playClick();
                    setActiveFolder(f);
                    setActiveTag('');
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-heading font-medium transition-all ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/20 text-primary shadow-glow-primary'
                      : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderClosed className="w-3.5 h-3.5" />
                    <span>{f}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags cloud */}
        {tags.length > 0 && (
          <div>
            <span className="text-[9px] text-slate-500 font-cyber font-bold tracking-widest uppercase px-2">Index Tags</span>
            <div className="flex flex-wrap gap-1.5 mt-2.5 px-1">
              {tags.map(t => {
                const isSelected = activeTag === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      playClick();
                      setActiveTag(isSelected ? '' : t);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-mono border transition-all ${
                      isSelected 
                        ? 'bg-accent/20 border-accent text-accent shadow-glow-accent'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Middle column: Notes selection list */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-4 shrink-0 flex flex-col max-h-[70vh] lg:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-500 font-cyber font-bold tracking-widest uppercase">Documents</span>
          <button
            onClick={handleCreateNote}
            onMouseEnter={playTick}
            className="p-1.5 bg-primary hover:bg-glowColor text-black rounded-lg transition-all shadow-glow-primary"
            title="Create new note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {notes.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-12 font-mono">No matching drafts.</p>
          ) : (
            notes.map(note => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-950/40 border-slate-700'
                      : 'bg-transparent border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-heading text-xs font-bold text-slate-200 truncate flex-1">{note.title}</h4>
                    {note.is_favorite === 1 && (
                      <Star className="w-3 h-3 text-warning shrink-0" fill="currentColor" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-1.5">{note.content?.replace(/[#*`]/g, '')}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Right Sidebar: Rich Markdown Editor */}
      <div className="flex-1 flex flex-col p-6 bg-slate-950/10 min-h-[50vh] lg:min-h-0">
        {selectedNote ? (
          <div className="flex-1 flex flex-col justify-between h-full">
            {/* Editor Actions bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-xl border transition-all ${
                    selectedNote.is_favorite 
                      ? 'bg-warning/15 border-warning/30 text-warning shadow-glow-accent'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Star className="w-4 h-4" fill={selectedNote.is_favorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-heading font-semibold transition-all ${
                    previewMode
                      ? 'bg-primary/20 border-primary/30 text-primary shadow-glow-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{previewMode ? 'Editor Mode' : 'Render Live'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNote}
                  onMouseEnter={playTick}
                  className="flex items-center gap-2 px-4 py-2 bg-success/20 border border-success/30 hover:border-success/60 text-success rounded-xl text-xs font-heading font-bold transition-all shadow-glow-success"
                >
                  <Save className="w-4 h-4" />
                  <span>Commit File</span>
                </button>
                <button
                  onClick={handleSoftDelete}
                  className="p-2 bg-white/5 hover:bg-danger/10 border border-white/5 hover:border-danger/30 rounded-xl text-slate-500 hover:text-danger transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Fields */}
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="Note Title..."
                className="w-full bg-transparent border-none text-slate-200 text-lg font-heading font-bold focus:outline-none focus:ring-0 p-0"
              />

              {/* Tag / Folder config */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Folder:</span>
                  <input
                    type="text"
                    value={editorFolder}
                    onChange={(e) => setEditorFolder(e.target.value)}
                    className="bg-white/5 border border-white/5 focus:border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Tags:</span>
                  <input
                    type="text"
                    value={editorTags}
                    onChange={(e) => setEditorTags(e.target.value)}
                    placeholder="tag1, tag2..."
                    className="bg-white/5 border border-white/5 focus:border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 overflow-auto mt-2">
                {previewMode ? (
                  <div 
                    dangerouslySetInnerHTML={renderMarkdown(editorContent)}
                    className="prose prose-invert max-w-none text-slate-300 font-sans leading-relaxed select-text p-4 border border-white/5 rounded-xl bg-slate-950/20 h-full overflow-auto"
                  />
                ) : (
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="# Welcome to Notes Lab\n\nStart typing Markdown commands..."
                    className="w-full h-full bg-transparent border-none text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-0 resize-none font-mono text-sm leading-relaxed p-0"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <FileText className="w-14 h-14 text-slate-700 mb-3 animate-pulse" />
            <h3 className="font-heading font-bold text-slate-400 text-sm">No Document Selected</h3>
            <p className="text-xs text-slate-600 font-mono mt-1">Select an active index draft on the left or create a new node workspace.</p>
          </div>
        )}
      </div>

    </div>
  );
};
export default Notes;
