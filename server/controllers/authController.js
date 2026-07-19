const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'echovault_super_secret_jarvis_core_key';

exports.register = async (req, res) => {
  const { name, email, password, roll_number, branch, semester } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing name, email, or password.' });
  }

  try {
    // Check if user already exists
    const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await runQuery(`
      INSERT INTO users (name, email, password_hash, roll_number, branch, semester)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, email, password_hash, roll_number || '', branch || '', parseInt(semester) || 5]);

    const userId = result.lastID;

    // Generate JWT
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name,
        email,
        roll_number,
        branch,
        semester: parseInt(semester) || 5,
        cgpa: 0.0
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing email or password.' });
  }

  try {
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roll_number: user.roll_number,
        branch: user.branch,
        semester: user.semester,
        cgpa: user.cgpa,
        achievements: user.achievements
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await getQuery('SELECT id, name, email, roll_number, branch, semester, cgpa, achievements, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile details.' });
  }
};
