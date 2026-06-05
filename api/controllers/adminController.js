const jwt = require('jsonwebtoken');
const audit = require('../services/auditService');
const { isDbReady } = require('../config/db');
const AuditLog = require('../models/AuditLog');

function login(req, res) {
  const { username, password } = req.body || {};

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
  const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '2h';

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Admin auth not configured' });
  }

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const bcrypt = require('bcryptjs');
  const isBcrypt = ADMIN_PASSWORD.startsWith('$2a$') || ADMIN_PASSWORD.startsWith('$2b$');
  const passwordMatch = isBcrypt 
    ? bcrypt.compareSync(password, ADMIN_PASSWORD) 
    : password === ADMIN_PASSWORD;

  if (username !== ADMIN_USERNAME || !passwordMatch) {
    // Log failed login attempt (non-blocking)
    audit.log({
      actor: String(username || 'unknown').slice(0, 120),
      action: 'ADMIN_LOGIN_FAILED',
      resource: 'session',
      metadata: { reason: 'invalid_credentials' },
      ip: req.ip || null,
    });
    const metrics = require('../services/metricsService');
    metrics.trackEvent({
      event_type: 'failed_login',
      severity: 'medium',
      description: `Failed admin login attempt for user: ${username || 'unknown'}`,
      ip: req.ip || null,
      metadata: { username: String(username || 'unknown').slice(0, 120) }
    });
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username: ADMIN_USERNAME },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRES_IN, algorithm: 'HS256' }
  );

  // Log successful login (non-blocking)
  audit.log({
    actor: ADMIN_USERNAME,
    action: 'ADMIN_LOGIN',
    resource: 'session',
    metadata: { expiresIn: ADMIN_JWT_EXPIRES_IN },
    ip: req.ip || null,
  });

  return res.json({ success: true, token, expiresIn: ADMIN_JWT_EXPIRES_IN });
}

/**
 * GET /api/admin/audit-logs
 * Returns the most recent audit log entries (max 200).
 */
async function getAuditLogs(req, res) {
  try {
    if (!isDbReady()) {
      return res.json({ success: true, logs: [], note: 'Audit logs only available in DB mode' });
    }
    const logs = await AuditLog.find()
      .sort({ created_at: -1 })
      .limit(200)
      .lean();
    return res.json({ success: true, logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { login, getAuditLogs };
