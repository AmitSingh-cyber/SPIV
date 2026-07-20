const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { initDatabase } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Always allow localhost, GitHub Pages, Netlify, Vercel, and Render origins
    return callback(null, true);
  },
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Initialize SQLite database
initDatabase()
  .then(() => {
    console.log('Database verification and initialization done.');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import API routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const noteRoutes = require('./routes/notes');
const studentRoutes = require('./routes/student');
const dbRoutes = require('./routes/db');

// Bind API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/db', dbRoutes);

// Simple status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    system: 'ECHO VAULT CORE v2'
  });
});

// Serve frontend static build & fallback non-API routes to index.html
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('ECHO VAULT Server Online. Frontend build index.html not found.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`ECHO VAULT Engine listening on port ${PORT}`);
});
