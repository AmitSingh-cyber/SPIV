const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authMiddleware = require('../middleware/auth');

// Apply auth protection to all note endpoints
router.use(authMiddleware);

router.get('/', noteController.getNotes);
router.post('/', noteController.createNote);
router.get('/folders', noteController.getFolders);
router.get('/tags', noteController.getTags);
router.get('/:id', noteController.getNoteById);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
