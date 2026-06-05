const express = require('express');
const { createSession, restoreSession } = require('../controllers/checkoutController');

const router = express.Router();

router.post('/session', createSession);
router.get('/session/:token', restoreSession);

module.exports = router;
