const express = require('express');
const router = express.Router();
const { login, getAuditLogs } = require('../controllers/adminController');
const { getDashboard } = require('../controllers/monitoringController');
const validate = require('../middlewares/validate');
const { adminLoginSchema } = require('../validators/adminValidator');
const adminAuth = require('../../middlewares/adminAuth');
const { adminLoginLimiter } = require('../services/rateLimiters');

// ─── Brute-force protected login: 5 failed attempts / 15 min ────────────────
router.post('/login', adminLoginLimiter, validate(adminLoginSchema), login);

// Protected: only authenticated admins can view the audit trail
router.get('/audit-logs', adminAuth, getAuditLogs);

// Protected: only authenticated admins can view monitoring dashboard
router.get('/monitoring/dashboard', adminAuth, getDashboard);

module.exports = router;

