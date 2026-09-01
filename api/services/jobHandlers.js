/**
 * Background job handlers for Brownie-Bliss.
 * Each handler receives the full Job document (including payload).
 * Handlers should perform the original synchronous operation and
 * resolve/reject accordingly. Errors are propagated to WorkerService
 * for retry handling.
 */

const mailer = require('../email/mailer');
const audit = require('../services/auditService');
const metrics = require('../services/metricsService');

/**
 * Send order receipt email.
 * Payload shape: { orderId: string, order: object }
 */
async function handleSendReceiptEmail(job) {
  const { order } = job.payload;
  // Reuse existing mailer function – it returns a result object.
  const result = await mailer.sendOrderReceiptEmail(order);
  // Optionally, you could update the Order with receipt status here.
  return result;
}

/**
 * Log an audit entry.
 * Payload shape matches audit.log() parameters.
 */
async function handleLogAudit(job) {
  // audit.log expects an object; we forward the payload directly.
  await audit.log(job.payload);
  return { logged: true };
}

/**
 * Track a metric event.
 * Payload shape: the object expected by metrics.trackEvent.
 */
async function handleTrackMetric(job) {
  metrics.trackEvent(job.payload);
  return { tracked: true };
}

module.exports = {
  sendReceiptEmail: handleSendReceiptEmail,
  logAudit: handleLogAudit,
  trackMetric: handleTrackMetric,
};
