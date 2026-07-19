const express = require('express');
const router = express.Router();
const dbController = require('../controllers/dbController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/export', dbController.exportDatabase);
router.post('/import', dbController.importDatabase);

module.exports = router;
