const { db, allQuery, runQuery } = require('../config/database');

exports.exportDatabase = async (req, res) => {
  try {
    const tables = [
      'users', 'subjects', 'attendance', 'assignments', 
      'notes', 'files', 'projects', 'certificates', 
      'bookmarks', 'passwords', 'timetable', 'reminders', 
      'todos', 'results'
    ];

    const backupData = {};

    for (const table of tables) {
      backupData[table] = await allQuery(`SELECT * FROM ${table}`);
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: 'ECHO_VAULT_SQLITE',
      data: backupData
    });
  } catch (error) {
    console.error('Error exporting database:', error);
    res.status(500).json({ success: false, message: 'Failed to compile database backup JSON.' });
  }
};

exports.importDatabase = async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ success: false, message: 'No backup data packet provided.' });
  }

  try {
    // Disable foreign keys temporarily to clear data
    await runQuery('PRAGMA foreign_keys = OFF');

    const tables = [
      'users', 'subjects', 'attendance', 'assignments', 
      'notes', 'files', 'projects', 'certificates', 
      'bookmarks', 'passwords', 'timetable', 'reminders', 
      'todos', 'results'
    ];

    // Clear existing records
    for (const table of tables) {
      await runQuery(`DELETE FROM ${table}`);
    }

    // Insert imported rows
    for (const table of tables) {
      const rows = data[table] || [];
      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      const columns = keys.join(', ');
      const placeholders = keys.map(() => '?').join(', ');

      for (const row of rows) {
        const values = keys.map(k => row[k]);
        await runQuery(`
          INSERT INTO ${table} (${columns})
          VALUES (${placeholders})
        `, values);
      }
    }

    // Re-enable foreign keys
    await runQuery('PRAGMA foreign_keys = ON');

    res.json({ success: true, message: 'Database backup imported and restored successfully.' });
  } catch (error) {
    console.error('Error importing database:', error);
    // Safety re-enable
    await runQuery('PRAGMA foreign_keys = ON');
    res.status(500).json({ success: false, message: 'Failed to restore database from backup.' });
  }
};
