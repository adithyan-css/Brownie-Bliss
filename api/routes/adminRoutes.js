const express = require('express');
const router = express.Router();
const { login, getAuditLogs } = require('../controllers/adminController');
const validate = require('../middlewares/validate');
const { adminLoginSchema } = require('../validators/adminValidator');
const adminAuth = require('../../middlewares/adminAuth');

router.post('/login', validate(adminLoginSchema), login);

// Protected: only authenticated admins can view the audit trail
router.get('/audit-logs', adminAuth, getAuditLogs);

module.exports = router;
