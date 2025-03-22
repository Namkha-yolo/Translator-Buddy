const express = require('express');
const translationController = require('../controllers/translationController');

const router = express.Router();

// POST /api/translate
router.post('/translate', translationController.translateText);

module.exports = router;
