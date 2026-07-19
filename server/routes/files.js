const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/auth');

// Multer Disk Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Authenticate all routes
router.use(authMiddleware);

// Routes
router.get('/', fileController.getFiles);
router.get('/analytics', fileController.getStorageAnalytics);
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.post('/upload-version/:id', upload.single('file'), fileController.uploadNewVersion);
router.post('/text-save/:id', fileController.saveTextContent);
router.get('/:id', fileController.getFileById);
router.get('/:id/content', fileController.getFileContent);
router.get('/:id/history', fileController.getFileHistory);
router.put('/:id/favorite', fileController.toggleFavorite);
router.put('/:id/trash', fileController.trashFile);
router.put('/:id/restore', fileController.restoreFile);
router.delete('/:id/permanent', fileController.deleteFilePermanently);

module.exports = router;
