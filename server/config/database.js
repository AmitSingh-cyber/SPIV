const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db;
let client;
const useTurso = process.env.TURSO_DATABASE_URL ? true : false;

if (useTurso) {
  const { createClient } = require('@libsql/client');
  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  console.log('Using Turso Cloud Database connection.');
} else {
  const dbPath = process.env.DATABASE_PATH 
    ? path.resolve(process.env.DATABASE_PATH)
    : path.resolve(__dirname, '../database.sqlite');

  // Ensure parent directory of database exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
}

// Run queries asynchronously / synchronously based on driver
const runQuery = (sql, params = []) => {
  if (useTurso) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await client.execute({ sql, args: params });
        resolve({
          lastID: res.lastInsertRowid ? Number(res.lastInsertRowid) : null,
          changes: res.rowsAffected
        });
      } catch (err) {
        reject(err);
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
};

const getQuery = (sql, params = []) => {
  if (useTurso) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await client.execute({ sql, args: params });
        resolve(res.rows[0] || null);
      } catch (err) {
        reject(err);
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

const allQuery = (sql, params = []) => {
  if (useTurso) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await client.execute({ sql, args: params });
        resolve(res.rows);
      } catch (err) {
        reject(err);
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

async function initDatabase() {
  try {
    // 1. Users Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        roll_number TEXT,
        branch TEXT,
        semester INTEGER DEFAULT 5,
        cgpa REAL DEFAULT 0.0,
        achievements TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Subjects Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        credit_hours INTEGER DEFAULT 3,
        semester INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Attendance Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('present', 'absent')) NOT NULL,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 4. Assignments Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('todo', 'doing', 'done')) DEFAULT 'todo',
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        deadline TEXT NOT NULL,
        reminder_time TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 5. Notes Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        subject_id INTEGER,
        folder_name TEXT DEFAULT 'All Notes',
        tags TEXT, -- JSON array of tags stored as string
        is_favorite INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      )
    `);

    // 6. Files Table (Supports version history through parent_file_id)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        folder_name TEXT DEFAULT 'Documents',
        is_favorite INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        version INTEGER DEFAULT 1,
        parent_file_id INTEGER,
        hash TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_file_id) REFERENCES files(id) ON DELETE CASCADE
      )
    `);

    // 7. Projects Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        technology TEXT, -- Comma separated
        github_link TEXT,
        live_link TEXT,
        status TEXT CHECK(status IN ('planning', 'development', 'completed')) DEFAULT 'planning',
        deadline TEXT,
        progress INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 8. Certificates Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        issuer TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        credential_id TEXT,
        verification_link TEXT,
        file_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
      )
    `);

    // 9. Bookmarks Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 10. Passwords Table (Encrypted Client-Side)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS passwords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service_name TEXT NOT NULL,
        username TEXT NOT NULL,
        encrypted_password TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 11. Timetable Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
        subject_id INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        room TEXT,
        teacher TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    // 12. Reminders Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        trigger_time TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 13. Todo Table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending', 'completed')) DEFAULT 'pending',
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        deadline TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 14. Results Table (CGPA & SGPA)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        semester INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        grade TEXT NOT NULL,
        gpa REAL NOT NULL,
        marks_obtained REAL,
        max_marks REAL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
      )
    `);

    console.log('All relational database tables initialized successfully.');

    // Seed initial admin/demo user if users table is empty
    const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('Seeding initial student account...');
      const salt = await bcrypt.genSalt(10);
      const demoPassHash = await bcrypt.hash('echo1234', salt);

      const result = await runQuery(`
        INSERT INTO users (name, email, password_hash, roll_number, branch, semester, cgpa, achievements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'Tony Stark',
        'tony@echo.edu',
        demoPassHash,
        'ST-2026-007',
        'Robotics & AI Engineering',
        5,
        9.85,
        'First place in Cyber-Physical Systems Exhibition, Patent on Arc-Reactor Mini Core v2.'
      ]);

      const userId = result.lastID;

      // Seed subjects
      const subjects = [
        { name: 'Database Management Systems', code: 'CS-501', credit: 4 },
        { name: 'Artificial Intelligence & Neural Nets', code: 'CS-502', credit: 4 },
        { name: 'Cybernetic Security & Cryptography', code: 'CS-503', credit: 3 },
        { name: 'Quantum Computing Fundamentals', code: 'CS-504', credit: 3 },
        { name: 'Advanced Robotics Lab', code: 'CS-505L', credit: 2 }
      ];

      const insertedSubjects = [];
      for (const sub of subjects) {
        const subRes = await runQuery(`
          INSERT INTO subjects (user_id, name, code, credit_hours, semester)
          VALUES (?, ?, ?, ?, ?)
        `, [userId, sub.name, sub.code, sub.credit, 5]);
        insertedSubjects.push({ id: subRes.lastID, ...sub });
      }

      // Seed timetable
      const schedule = [
        { day: 1, subIdx: 0, start: '09:00', end: '10:30', room: 'Lab 4', teacher: 'Dr. Bruce Banner' }, // DBMS Monday
        { day: 1, subIdx: 1, start: '11:00', end: '12:30', room: 'Hall B', teacher: 'Dr. Stephen Strange' }, // AI Monday
        { day: 2, subIdx: 2, start: '10:00', end: '11:30', room: 'Tech 2', teacher: 'Prof. Nick Fury' }, // Security Tuesday
        { day: 3, subIdx: 3, start: '14:00', end: '15:30', room: 'Seminar A', teacher: 'Dr. Hank Pym' }, // Quantum Thursday
        { day: 5, subIdx: 4, start: '09:00', end: '12:00', room: 'Robo Suite', teacher: 'Stark Industries AI' } // Robotics Friday
      ];

      for (const item of schedule) {
        await runQuery(`
          INSERT INTO timetable (user_id, day_of_week, subject_id, start_time, end_time, room, teacher)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          item.day,
          insertedSubjects[item.subIdx].id,
          item.start,
          item.end,
          item.room,
          item.teacher
        ]);
      }

      // Seed attendance
      // Let's seed some present/absent logs for subjects to show on charts
      for (const sub of insertedSubjects) {
        // Log 8 present and 2 absent sessions per subject
        for (let i = 1; i <= 10; i++) {
          const date = `2026-07-${String(i).padStart(2, '0')}`;
          const status = i === 3 || i === 7 ? 'absent' : 'present';
          await runQuery(`
            INSERT INTO attendance (user_id, subject_id, date, status, notes)
            VALUES (?, ?, ?, ?, ?)
          `, [userId, sub.id, date, status, status === 'absent' ? 'System calibrations' : 'Routine class lecture']);
        }
      }

      // Seed assignments
      await runQuery(`
        INSERT INTO assignments (user_id, subject_id, title, description, status, priority, deadline)
        VALUES 
        (?, ?, 'DBMS Normalization Assignment', 'Complete 3NF and BCNF relational mappings for client schema.', 'todo', 'high', '2026-07-25 23:59:59'),
        (?, ?, 'Neural Net Image Classifier', 'Train a basic CNN on CIFAR-10 with accuracy >85%.', 'doing', 'high', '2026-07-28 18:00:00'),
        (?, ?, 'Quantum Cryptography Paper Review', 'Read BB84 distribution paper and summarize key vulnerabilities.', 'done', 'medium', '2026-07-15 12:00:00')
      `, [
        userId, insertedSubjects[0].id,
        userId, insertedSubjects[1].id,
        userId, insertedSubjects[2].id
      ]);

      // Seed some notes
      await runQuery(`
        INSERT INTO notes (user_id, title, content, subject_id, folder_name, tags, is_favorite)
        VALUES 
        (?, 'SQL Normalization Rules', '# Normalization Overview\n\nDatabase normalization prevents redundancies.\n\n## 1NF\nAtomic values only.\n\n## 2NF\n1NF + no partial dependency.\n\n## 3NF\n2NF + no transitive dependency.', ?, 'DBMS Notes', '["relational", "normalization", "rules"]', 1),
        (?, 'BB84 Protocol Mechanics', '# BB84 Security Review\n\nUses conjugate polarization states to share a secure random key.\n\n* Alice sends random bits using rectilinear or diagonal basis.\n* Bob measures using random basis.\n* They perform basis reconciliation.', ?, 'Quantum Comp', '["cryptography", "quantum"]', 0)
      `, [
        userId, insertedSubjects[0].id,
        userId, insertedSubjects[3].id
      ]);

      // Seed some projects
      await runQuery(`
        INSERT INTO projects (user_id, name, description, technology, github_link, live_link, status, deadline, progress)
        VALUES 
        (?, 'Arc Reactor Controller', 'Thermonuclear magnetic containment shield management dashboard.', 'React, Rust, Socket.IO', 'https://github.com/tonystark/arc-reactor', 'https://stark.industries/arc', 'development', '2026-10-31', 65),
        (?, 'J.A.R.V.I.S. Core V2', 'Next-generation cognitive NLP and workspace automation system.', 'Python, PyTorch, C++', 'https://github.com/tonystark/jarvis-core', null, 'completed', '2026-06-01', 100)
      `, [userId, userId]);

      // Seed some todos
      await runQuery(`
        INSERT INTO todos (user_id, task, status, priority, deadline)
        VALUES 
        (?, 'Register for Robotic Championship', 'pending', 'high', '2026-07-30'),
        (?, 'Submit BB84 quantum essay', 'completed', 'medium', '2026-07-15'),
        (?, 'Buy replacement soldering iron tips', 'pending', 'low', '2026-07-28')
      `, [userId, userId, userId]);

      console.log('Seed completed successfully. Admin login: tony@echo.edu / echo1234');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery
};
