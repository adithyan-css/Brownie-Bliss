/**
 * auditService — fire-and-forget audit log writer.
 *
 * Design decisions:
 *  - Never throws:  audit failures must NEVER block or fail a user-facing request.
 *  - Graceful DB fallback: if the DB isn't ready, the event is logged to stderr
 *    so it is still captured by the host's log aggregator (e.g. Netlify / Vercel logs).
 *  - Async, non-blocking: callers use `log(...)` without awaiting.
 */
const { isDbReady } = require('../config/db');

let AuditLog;
function getModel() {
  if (!AuditLog) AuditLog = require('../models/AuditLog');
  return AuditLog;
}

/**
 * @param {object} opts
 * @param {string} opts.actor       - username performing the action
 * @param {string} opts.action      - one of the AuditLog action enum values
 * @param {string} opts.resource    - resource type, e.g. 'order', 'session'
 * @param {string} [opts.resourceId]- e.g. order_id
 * @param {object} [opts.metadata]  - additional context (before/after state, notes)
 * @param {string} [opts.ip]        - client IP address
 */
async function log({ actor, action, resource, resourceId = null, metadata = {}, ip = null }) {
  const entry = { actor, action, resource, resourceId, metadata, ip, created_at: new Date() };

  if (!isDbReady()) {
    // Fallback: write to stderr so log aggregators capture it
    console.error('[AUDIT_LOG_NO_DB]', JSON.stringify(entry));
    return;
  }

  try {
    await getModel().create(entry);
  } catch (err) {
    // Never let an audit failure surface to the user
    console.error('[AUDIT_LOG_ERROR]', err.message, JSON.stringify(entry));
  }
}

module.exports = { log };
