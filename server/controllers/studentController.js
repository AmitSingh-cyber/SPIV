const { runQuery, getQuery, allQuery } = require('../config/database');

// ==========================================
// 1. Subjects & Timetable
// ==========================================
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await allQuery('SELECT * FROM subjects WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subjects.' });
  }
};

exports.createSubject = async (req, res) => {
  const { name, code, credit_hours, semester } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'Subject name and code required.' });
  try {
    const result = await runQuery(`
      INSERT INTO subjects (user_id, name, code, credit_hours, semester)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, name, code, credit_hours || 3, semester || 1]);
    const sub = await getQuery('SELECT * FROM subjects WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, subject: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating subject.' });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    const timetable = await allQuery(`
      SELECT t.*, s.name as subject_name, s.code as subject_code 
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ?
      ORDER BY t.day_of_week, t.start_time
    `, [req.user.id]);
    res.json({ success: true, timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching timetable.' });
  }
};

exports.createTimetableEntry = async (req, res) => {
  const { day_of_week, subject_id, start_time, end_time, room, teacher } = req.body;
  if (day_of_week === undefined || !subject_id || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: 'Missing schedule parameters.' });
  }
  try {
    await runQuery(`
      INSERT INTO timetable (user_id, day_of_week, subject_id, start_time, end_time, room, teacher)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, day_of_week, subject_id, start_time, end_time, room || '', teacher || '']);
    res.json({ success: true, message: 'Timetable entry added.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating timetable entry.' });
  }
};

// ==========================================
// 2. Attendance Tracker
// ==========================================
exports.getAttendanceSummary = async (req, res) => {
  const userId = req.user.id;
  try {
    const logs = await allQuery(`
      SELECT a.*, s.name as subject_name, s.code as subject_code
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.date DESC
    `, [userId]);

    const stats = await allQuery(`
      SELECT 
        subject_id,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        COUNT(*) as total_count
      FROM attendance
      WHERE user_id = ?
      GROUP BY subject_id
    `, [userId]);

    res.json({ success: true, logs, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance.' });
  }
};

exports.logAttendance = async (req, res) => {
  const { subject_id, date, status, notes } = req.body;
  if (!subject_id || !date || !status) {
    return res.status(400).json({ success: false, message: 'Missing subject, date, or status.' });
  }
  try {
    await runQuery(`
      INSERT INTO attendance (user_id, subject_id, date, status, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, subject_id, date, status, notes || '']);
    res.json({ success: true, message: 'Attendance status recorded.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging attendance.' });
  }
};

// ==========================================
// 3. Assignments
// ==========================================
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await allQuery(`
      SELECT a.*, s.name as subject_name, s.code as subject_code
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.deadline ASC
    `, [req.user.id]);
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching assignments.' });
  }
};

exports.createAssignment = async (req, res) => {
  const { subject_id, title, description, priority, deadline } = req.body;
  if (!subject_id || !title || !deadline) {
    return res.status(400).json({ success: false, message: 'Missing subject, title or deadline.' });
  }
  try {
    const result = await runQuery(`
      INSERT INTO assignments (user_id, subject_id, title, description, status, priority, deadline)
      VALUES (?, ?, ?, ?, 'todo', ?, ?)
    `, [req.user.id, subject_id, title, description || '', priority || 'medium', deadline]);
    const assignment = await getQuery('SELECT * FROM assignments WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating assignment.' });
  }
};

exports.updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { status, priority, title, description, deadline } = req.body;
  try {
    const updates = [];
    const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (priority) { updates.push('priority = ?'); params.push(priority); }
    if (title) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (deadline) { updates.push('deadline = ?'); params.push(deadline); }

    const sql = `UPDATE assignments SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    params.push(id, req.user.id);

    await runQuery(sql, params);
    res.json({ success: true, message: 'Assignment updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating assignment.' });
  }
};

// ==========================================
// 4. Projects
// ==========================================
exports.getProjects = async (req, res) => {
  try {
    const projects = await allQuery('SELECT * FROM projects WHERE user_id = ? ORDER BY deadline ASC', [req.user.id]);
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching projects.' });
  }
};

exports.createProject = async (req, res) => {
  const { name, description, technology, github_link, live_link, status, deadline, progress } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Project name is required.' });
  try {
    await runQuery(`
      INSERT INTO projects (user_id, name, description, technology, github_link, live_link, status, deadline, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, name, description || '', technology || '', github_link || '', live_link || '', status || 'planning', deadline || '', progress || 0]);
    res.status(201).json({ success: true, message: 'Project registered.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating project.' });
  }
};

exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, technology, github_link, live_link, status, deadline, progress } = req.body;
  try {
    await runQuery(`
      UPDATE projects SET name=?, description=?, technology=?, github_link=?, live_link=?, status=?, deadline=?, progress=?
      WHERE id = ? AND user_id = ?
    `, [name, description, technology, github_link, live_link, status, deadline, progress, id, req.user.id]);
    res.json({ success: true, message: 'Project updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating project.' });
  }
};

// ==========================================
// 5. Certificates
// ==========================================
exports.getCertificates = async (req, res) => {
  try {
    const certs = await allQuery(`
      SELECT c.*, f.path as file_path 
      FROM certificates c
      LEFT JOIN files f ON c.file_id = f.id
      WHERE c.user_id = ?
    `, [req.user.id]);
    res.json({ success: true, certificates: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching certificates.' });
  }
};

exports.createCertificate = async (req, res) => {
  const { name, issuer, issue_date, credential_id, verification_link, file_id } = req.body;
  if (!name || !issuer || !issue_date) return res.status(400).json({ success: false, message: 'Missing certificate parameters.' });
  try {
    await runQuery(`
      INSERT INTO certificates (user_id, name, issuer, issue_date, credential_id, verification_link, file_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [req.user.id, name, issuer, issue_date, credential_id || '', verification_link || '', file_id || null]);
    res.status(201).json({ success: true, message: 'Certificate recorded.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error registering certificate.' });
  }
};

// ==========================================
// 6. Credentials Vault
// ==========================================
exports.getPasswords = async (req, res) => {
  try {
    const passwords = await allQuery('SELECT * FROM passwords WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, passwords });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading password vault.' });
  }
};

exports.createPassword = async (req, res) => {
  const { service_name, username, encrypted_password, category, notes } = req.body;
  if (!service_name || !username || !encrypted_password) {
    return res.status(400).json({ success: false, message: 'Missing credential credentials.' });
  }
  try {
    await runQuery(`
      INSERT INTO passwords (user_id, service_name, username, encrypted_password, category, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, service_name, username, encrypted_password, category || 'General', notes || '']);
    res.status(201).json({ success: true, message: 'Credential secured.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error securing credentials.' });
  }
};

exports.deletePassword = async (req, res) => {
  try {
    await runQuery('DELETE FROM passwords WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Credential removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing credentials.' });
  }
};

// ==========================================
// 7. Todos & Reminders
// ==========================================
exports.getTodos = async (req, res) => {
  try {
    const todos = await allQuery('SELECT * FROM todos WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    res.json({ success: true, todos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading tasks.' });
  }
};

exports.createTodo = async (req, res) => {
  const { task, priority, deadline } = req.body;
  if (!task) return res.status(400).json({ success: false, message: 'Task text required.' });
  try {
    const result = await runQuery(`
      INSERT INTO todos (user_id, task, status, priority, deadline)
      VALUES (?, ?, 'pending', ?, ?)
    `, [req.user.id, task, priority || 'medium', deadline || null]);
    const todo = await getQuery('SELECT * FROM todos WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, todo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating task.' });
  }
};

exports.updateTodo = async (req, res) => {
  const { id } = req.params;
  const { status, priority, task } = req.body;
  try {
    const updates = [];
    const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (priority) { updates.push('priority = ?'); params.push(priority); }
    if (task) { updates.push('task = ?'); params.push(task); }

    const sql = `UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    params.push(id, req.user.id);

    await runQuery(sql, params);
    res.json({ success: true, message: 'Task updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating task.' });
  }
};

exports.deleteTodo = async (req, res) => {
  try {
    await runQuery('DELETE FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting task.' });
  }
};

// ==========================================
// 8. Profiles & Analytics
// ==========================================
exports.updateProfile = async (req, res) => {
  const { name, roll_number, branch, semester, cgpa, achievements } = req.body;
  try {
    await runQuery(`
      UPDATE users 
      SET name = ?, roll_number = ?, branch = ?, semester = ?, cgpa = ?, achievements = ?
      WHERE id = ?
    `, [name, roll_number, branch, semester, cgpa, achievements, req.user.id]);
    const updated = await getQuery('SELECT id, name, email, roll_number, branch, semester, cgpa, achievements FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

exports.getGlobalHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    // We can query recent files and notes additions to mock a chronological activity feed
    const recentFiles = await allQuery(`
      SELECT 'file' as type, name as title, created_at, 'Uploaded new file version' as description
      FROM files WHERE user_id = ? AND is_deleted = 0
      ORDER BY id DESC LIMIT 5
    `, [userId]);

    const recentNotes = await allQuery(`
      SELECT 'note' as type, title, created_at, 'Modified text document' as description
      FROM notes WHERE user_id = ? AND is_deleted = 0
      ORDER BY id DESC LIMIT 5
    `, [userId]);

    const recentProjects = await allQuery(`
      SELECT 'project' as type, name as title, created_at, 'Created project milestone' as description
      FROM projects WHERE user_id = ?
      ORDER BY id DESC LIMIT 5
    `, [userId]);

    const timeline = [...recentFiles, ...recentNotes, ...recentProjects]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({ success: true, timeline });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating history activity feed.' });
  }
};

// ==========================================
// 9. Host / Admin Controls
// ==========================================
exports.getAdminOverview = async (req, res) => {
  if (req.user.email !== 'tony@echo.edu') {
    return res.status(403).json({ success: false, message: 'Host privilege verification failed.' });
  }

  try {
    const students = await allQuery('SELECT id, name, email, roll_number, branch, semester, cgpa, achievements FROM users');
    const stats = {
      total_students: students.length,
      total_files: (await getQuery('SELECT COUNT(*) as count FROM files WHERE is_deleted = 0')).count,
      total_notes: (await getQuery('SELECT COUNT(*) as count FROM notes WHERE is_deleted = 0')).count,
      total_projects: (await getQuery('SELECT COUNT(*) as count FROM projects')).count
    };

    res.json({ success: true, students, stats });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to aggregate administrative oversight.' });
  }
};

exports.getAdminStudentDetail = async (req, res) => {
  if (req.user.email !== 'tony@echo.edu') {
    return res.status(403).json({ success: false, message: 'Host privilege verification failed.' });
  }

  const { id } = req.params;

  try {
    const student = await getQuery('SELECT id, name, email, roll_number, branch, semester, cgpa, achievements FROM users WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Target student node not found.' });
    }

    const subjects = await allQuery('SELECT * FROM subjects WHERE user_id = ?', [id]);
    const notes = await allQuery('SELECT id, title, folder_name, is_favorite FROM notes WHERE user_id = ? AND is_deleted = 0', [id]);
    const projects = await allQuery('SELECT * FROM projects WHERE user_id = ?', [id]);
    
    const attendStats = await allQuery(`
      SELECT 
        s.name as subject_name,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        COUNT(a.id) as total_count
      FROM subjects s
      LEFT JOIN attendance a ON s.id = a.subject_id AND a.user_id = ?
      WHERE s.user_id = ?
      GROUP BY s.id
    `, [id, id]);

    res.json({
      success: true,
      student,
      subjects,
      notes,
      projects,
      attendance: attendStats
    });
  } catch (error) {
    console.error('Admin student inspect error:', error);
    res.status(500).json({ success: false, message: 'Failed to inspect target student node.' });
  }
};
