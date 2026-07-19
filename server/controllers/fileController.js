const fs = require('fs');
const path = require('path');
const { runQuery, getQuery, allQuery } = require('../config/database');

// Helper to determine folder based on mime type
const getFolderFromMime = (mime) => {
  if (!mime) return 'Documents';
  if (mime.startsWith('image/')) return 'Pictures';
  if (mime.startsWith('video/')) return 'Videos';
  if (mime.startsWith('audio/')) return 'Music';
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('document') || mime.includes('text') || mime.includes('markdown')) return 'Documents';
  return 'Downloads';
};

exports.getFiles = async (req, res) => {
  const userId = req.user.id;
  const { folder, search, is_favorite, is_deleted } = req.query;

  const deletedVal = is_deleted === '1' ? 1 : 0;

  try {
    // Select the latest version of each unique file grouping
    let query = `
      SELECT * FROM files 
      WHERE id IN (
        SELECT MAX(id) FROM files 
        WHERE user_id = ?
        GROUP BY COALESCE(parent_file_id, id)
      ) 
      AND is_deleted = ?
    `;
    const params = [userId, deletedVal];

    if (folder) {
      query += ' AND folder_name = ?';
      params.push(folder);
    }

    if (is_favorite === '1') {
      query += ' AND is_favorite = 1';
    }

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY id DESC';

    const files = await allQuery(query, params);
    res.json({ success: true, files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ success: false, message: 'Server error fetching files.' });
  }
};

exports.getFileById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }
    res.json({ success: true, file });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ success: false, message: 'Server error fetching file details.' });
  }
};

exports.getFileContent = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const physicalPath = path.join(__dirname, '..', file.path);
    if (!fs.existsSync(physicalPath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on server storage.' });
    }

    const content = fs.readFileSync(physicalPath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error reading file content:', error);
    res.status(500).json({ success: false, message: 'Error reading file content.' });
  }
};

exports.uploadFile = async (req, res) => {
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const { originalname, mimetype, size, filename } = req.file;
  const folder_name = req.body.folder_name || getFolderFromMime(mimetype);
  const relativePath = `uploads/${filename}`;

  try {
    const result = await runQuery(`
      INSERT INTO files (user_id, name, type, size, path, folder_name, version, parent_file_id)
      VALUES (?, ?, ?, ?, ?, ?, 1, NULL)
    `, [userId, originalname, mimetype, size, relativePath, folder_name]);

    const newFile = await getQuery('SELECT * FROM files WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, file: newFile });
  } catch (error) {
    console.error('Error recording file:', error);
    res.status(500).json({ success: false, message: 'Server error recording uploaded file.' });
  }
};

exports.uploadNewVersion = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // ID of the latest version or original file

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'Target file not found.' });
    }

    const rootId = file.parent_file_id || file.id;
    const latestVersion = await getQuery(`
      SELECT MAX(version) as max_ver FROM files 
      WHERE id = ? OR parent_file_id = ?
    `, [rootId, rootId]);

    const nextVer = (latestVersion.max_ver || 1) + 1;
    const { originalname, mimetype, size, filename } = req.file;
    const relativePath = `uploads/${filename}`;

    const result = await runQuery(`
      INSERT INTO files (user_id, name, type, size, path, folder_name, version, parent_file_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, originalname, mimetype, size, relativePath, file.folder_name, nextVer, rootId]);

    const newVersion = await getQuery('SELECT * FROM files WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, file: newVersion });
  } catch (error) {
    console.error('Error uploading version:', error);
    res.status(500).json({ success: false, message: 'Server error uploading version.' });
  }
};

exports.saveTextContent = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { content } = req.body;

  if (content === undefined) {
    return res.status(400).json({ success: false, message: 'Content body required.' });
  }

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const rootId = file.parent_file_id || file.id;
    const latestVersion = await getQuery(`
      SELECT MAX(version) as max_ver FROM files 
      WHERE id = ? OR parent_file_id = ?
    `, [rootId, rootId]);

    const nextVer = (latestVersion.max_ver || 1) + 1;

    // Write new physical file
    const newFilename = `${Date.now()}-${file.name}`;
    const physicalPath = path.join(__dirname, '../uploads', newFilename);
    fs.writeFileSync(physicalPath, content, 'utf-8');

    const stat = fs.statSync(physicalPath);
    const relativePath = `uploads/${newFilename}`;

    const result = await runQuery(`
      INSERT INTO files (user_id, name, type, size, path, folder_name, version, parent_file_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, file.name, file.type, stat.size, relativePath, file.folder_name, nextVer, rootId]);

    const newVersion = await getQuery('SELECT * FROM files WHERE id = ?', [result.lastID]);
    res.json({ success: true, file: newVersion });
  } catch (error) {
    console.error('Error saving text edits:', error);
    res.status(500).json({ success: false, message: 'Error saving edits as new version.' });
  }
};

exports.getFileHistory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const rootId = file.parent_file_id || file.id;
    const history = await allQuery(`
      SELECT * FROM files 
      WHERE id = ? OR parent_file_id = ? 
      ORDER BY version DESC
    `, [rootId, rootId]);

    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching file history:', error);
    res.status(500).json({ success: false, message: 'Error fetching version history.' });
  }
};

exports.toggleFavorite = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const rootId = file.parent_file_id || file.id;
    // Set favorite state on the latest active version or the entire bundle
    const nextFavorite = file.is_favorite ? 0 : 1;
    await runQuery(`
      UPDATE files SET is_favorite = ? 
      WHERE id = ? OR parent_file_id = ?
    `, [nextFavorite, rootId, rootId]);

    res.json({ success: true, is_favorite: nextFavorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, message: 'Server error updating favorite status.' });
  }
};

exports.trashFile = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const rootId = file.parent_file_id || file.id;
    await runQuery(`
      UPDATE files SET is_deleted = 1 
      WHERE id = ? OR parent_file_id = ?
    `, [rootId, rootId]);

    res.json({ success: true, message: 'File sent to Trash Bin.' });
  } catch (error) {
    console.error('Error trashing file:', error);
    res.status(500).json({ success: false, message: 'Server error trashing file.' });
  }
};

exports.restoreFile = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const rootId = file.parent_file_id || file.id;
    await runQuery(`
      UPDATE files SET is_deleted = 0 
      WHERE id = ? OR parent_file_id = ?
    `, [rootId, rootId]);

    res.json({ success: true, message: 'File restored from Trash Bin.' });
  } catch (error) {
    console.error('Error restoring file:', error);
    res.status(500).json({ success: false, message: 'Server error restoring file.' });
  }
};

exports.deleteFilePermanently = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const file = await getQuery('SELECT * FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const rootId = file.parent_file_id || file.id;
    const allVersions = await allQuery(`
      SELECT path FROM files 
      WHERE id = ? OR parent_file_id = ?
    `, [rootId, rootId]);

    // Unlink physical files
    for (const v of allVersions) {
      const physicalPath = path.join(__dirname, '..', v.path);
      if (fs.existsSync(physicalPath)) {
        try {
          fs.unlinkSync(physicalPath);
        } catch (e) {
          console.error(`Failed to delete physical file: ${physicalPath}`, e);
        }
      }
    }

    // Delete db record
    await runQuery(`
      DELETE FROM files 
      WHERE id = ? OR parent_file_id = ?
    `, [rootId, rootId]);

    res.json({ success: true, message: 'File and all version histories permanently deleted.' });
  } catch (error) {
    console.error('Error permanently deleting file:', error);
    res.status(500).json({ success: false, message: 'Server error deleting file permanently.' });
  }
};

exports.getStorageAnalytics = async (req, res) => {
  const userId = req.user.id;

  try {
    // Sum only latest active version sizes
    const activeFiles = await allQuery(`
      SELECT folder_name, SUM(size) as total_size, COUNT(id) as count 
      FROM files 
      WHERE id IN (
        SELECT MAX(id) FROM files 
        WHERE user_id = ? AND is_deleted = 0
        GROUP BY COALESCE(parent_file_id, id)
      )
      GROUP BY folder_name
    `, [userId]);

    const totalAllowed = 5 * 1024 * 1024 * 1024; // 5 GB default cap
    let totalUsed = 0;
    
    const breakdown = {
      Documents: { size: 0, count: 0 },
      Pictures: { size: 0, count: 0 },
      Videos: { size: 0, count: 0 },
      Music: { size: 0, count: 0 },
      Downloads: { size: 0, count: 0 }
    };

    activeFiles.forEach(folder => {
      const name = folder.folder_name;
      const size = folder.total_size || 0;
      const count = folder.count || 0;
      totalUsed += size;

      if (breakdown[name]) {
        breakdown[name] = { size, count };
      } else {
        // Fallback or accumulate to Downloads
        breakdown.Downloads.size += size;
        breakdown.Downloads.count += count;
      }
    });

    res.json({
      success: true,
      total_used: totalUsed,
      total_allowed: totalAllowed,
      breakdown
    });
  } catch (error) {
    console.error('Error fetching storage analytics:', error);
    res.status(500).json({ success: false, message: 'Server error gathering storage metrics.' });
  }
};
