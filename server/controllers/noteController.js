const { runQuery, getQuery, allQuery } = require('../config/database');

exports.getNotes = async (req, res) => {
  const userId = req.user.id;
  const { folder, search, tag, is_favorite, is_deleted } = req.query;

  let query = 'SELECT * FROM notes WHERE user_id = ?';
  const params = [userId];

  // Handle soft-deleted filter default to 0
  const deletedVal = is_deleted === '1' ? 1 : 0;
  query += ' AND is_deleted = ?';
  params.push(deletedVal);

  if (folder) {
    query += ' AND folder_name = ?';
    params.push(folder);
  }

  if (is_favorite === '1') {
    query += ' AND is_favorite = 1';
  }

  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  try {
    const notes = await allQuery(query, params);
    
    // If tag is requested, filter in memory since tags are JSON arrays
    let filteredNotes = notes;
    if (tag) {
      filteredNotes = notes.filter(n => {
        try {
          const tags = JSON.parse(n.tags || '[]');
          return tags.includes(tag);
        } catch {
          return false;
        }
      });
    }

    res.json({ success: true, notes: filteredNotes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notes.' });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await getQuery('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }
    res.json({ success: true, note });
  } catch (error) {
    console.error('Error fetching note by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching note details.' });
  }
};

exports.createNote = async (req, res) => {
  const userId = req.user.id;
  const { title, content, subject_id, folder_name, tags, is_favorite } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Note title is required.' });
  }

  try {
    const result = await runQuery(`
      INSERT INTO notes (user_id, title, content, subject_id, folder_name, tags, is_favorite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      userId,
      title,
      content || '',
      subject_id || null,
      folder_name || 'All Notes',
      tags ? JSON.stringify(tags) : '[]',
      is_favorite ? 1 : 0
    ]);

    const newNote = await getQuery('SELECT * FROM notes WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, note: newNote });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Server error creating note.' });
  }
};

exports.updateNote = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, content, subject_id, folder_name, tags, is_favorite, is_deleted } = req.body;

  try {
    const note = await getQuery('SELECT id FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or unauthorized.' });
    }

    // Dynamic fields updates
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (subject_id !== undefined) { updates.push('subject_id = ?'); params.push(subject_id); }
    if (folder_name !== undefined) { updates.push('folder_name = ?'); params.push(folder_name); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
    if (is_favorite !== undefined) { updates.push('is_favorite = ?'); params.push(is_favorite ? 1 : 0); }
    if (is_deleted !== undefined) { updates.push('is_deleted = ?'); params.push(is_deleted ? 1 : 0); }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const updateSql = `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    params.push(id, userId);

    await runQuery(updateSql, params);

    const updatedNote = await getQuery('SELECT * FROM notes WHERE id = ?', [id]);
    res.json({ success: true, note: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, message: 'Server error updating note.' });
  }
};

exports.deleteNote = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const note = await getQuery('SELECT id FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or unauthorized.' });
    }

    // Permanent delete
    await runQuery('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: 'Note permanently deleted.' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Server error deleting note.' });
  }
};

exports.getFolders = async (req, res) => {
  try {
    const folders = await allQuery('SELECT DISTINCT folder_name FROM notes WHERE user_id = ? AND is_deleted = 0', [req.user.id]);
    const names = folders.map(f => f.folder_name);
    // Add default if empty
    if (!names.includes('All Notes')) {
      names.unshift('All Notes');
    }
    res.json({ success: true, folders: names });
  } catch (error) {
    console.error('Error listing folders:', error);
    res.status(500).json({ success: false, message: 'Server error listing folders.' });
  }
};

exports.getTags = async (req, res) => {
  try {
    const notes = await allQuery('SELECT tags FROM notes WHERE user_id = ? AND is_deleted = 0', [req.user.id]);
    const tagsSet = new Set();
    notes.forEach(n => {
      try {
        const tags = JSON.parse(n.tags || '[]');
        tags.forEach(t => tagsSet.add(t));
      } catch (e) {
        // Ignore JSON format issues
      }
    });
    res.json({ success: true, tags: Array.from(tagsSet) });
  } catch (error) {
    console.error('Error listing tags:', error);
    res.status(500).json({ success: false, message: 'Server error listing tags.' });
  }
};
