const nodemailer = require('nodemailer');
const { buildReceiptHtml, buildReceiptText } = require('./receiptTemplate');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Transport config ─────────────────────────────────────────────────────────

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getFromAddress() {
  const name = process.env.MAIL_FROM_NAME || 'Brownie Bliss';
  const addr = process.env.MAIL_FROM || process.env.SMTP_USER;
  return `"${name}" <${addr}>`;
}

let cachedTransport = null;

function getTransport() {
  if (!isEmailConfigured()) return null;
  if (cachedTransport) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Connection pool for production throughput
    pool: true,
    maxConnections: 3,
    // Reasonable timeouts — fail fast instead of hanging
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });

  return cachedTransport;
}

// ── Sanitisation helpers ──────────────────────────────────────────────────────

function normalizeEmail(raw) {
  if (raw == null) return '';
  return String(raw).trim().toLowerCase().slice(0, 254);
}

function isValidEmail(email) {
  return email.length > 3 && email.length <= 254 && EMAIL_RE.test(email);
}

// ── Receipt order validation ──────────────────────────────────────────────────

/**
 * Validate the order object has everything needed to build a valid receipt.
 * Returns null when valid; returns a string reason when invalid.
 */
function validateOrderForReceipt(order) {
  if (!order || typeof order !== 'object') return 'missing_order';
  if (!order.order_id)       return 'missing_order_id';
  if (!order.customer_name)  return 'missing_customer_name';
  if (!Array.isArray(order.items) || order.items.length === 0) return 'empty_items';
  if (!Number.isFinite(Number(order.total)) || Number(order.total) <= 0) return 'invalid_total';
  return null;
}

// ── Retry helper ──────────────────────────────────────────────────────────────

/**
 * Attempt to send a transactional email with exponential backoff.
 *
 * @param {object}   transport  - nodemailer transport
 * @param {object}   mailOpts   - nodemailer message options
 * @param {number}   maxRetries - number of additional attempts after first failure (default 2)
 * @returns {{ messageId: string }} on success
 * @throws last send error after all retries are exhausted
 */
async function sendWithRetry(transport, mailOpts, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await transport.sendMail(mailOpts);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        // Exponential backoff: 1 s, 2 s, 4 s …
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(
          `[email] Send attempt ${attempt + 1} failed for ${mailOpts.subject}. Retrying in ${delayMs}ms… (${err.message})`
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Send payment receipt to the customer.
 *
 * Never throws — returns a structured result:
 *   { sent: true,  messageId, to, attempts }           – successful delivery
 *   { sent: false, skipped: true, reason }             – deliberately skipped
 *   { sent: false, error, attempts }                   – delivery failed after retries
 */
async function sendOrderReceiptEmail(order) {
  // ── 1. Validate the order object itself ─────────────────────────────────────
  const validationError = validateOrderForReceipt(order);
  if (validationError) {
    console.warn(`[email] Receipt skipped for invalid order data: ${validationError}`);
    return { sent: false, skipped: true, reason: validationError };
  }

  // ── 2. Validate the recipient address ───────────────────────────────────────
  const to = normalizeEmail(order.email);

  if (!to) {
    return { sent: false, skipped: true, reason: 'no_email' };
  }

  if (!isValidEmail(to)) {
    return { sent: false, skipped: true, reason: 'invalid_email' };
  }

  // ── 3. Check SMTP is configured ─────────────────────────────────────────────
  if (!isEmailConfigured()) {
    console.warn('[email] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Receipt not sent.');
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const transport = getTransport();
  const subject = `Your Brownie Bliss receipt — ${order.order_id}`;
  const maxRetries = Number(process.env.EMAIL_MAX_RETRIES) || 2;

  // ── 4. Attempt delivery with retry + backoff ─────────────────────────────────
  let attempts = 0;
  try {
    const info = await sendWithRetry(
      transport,
      {
        from: getFromAddress(),
        to,
        subject,
        text: buildReceiptText(order),
        html: buildReceiptHtml(order),
      },
      maxRetries
    );

    attempts = maxRetries + 1; // all retries exhausted means success on some attempt
    console.log(`[email] Receipt sent to ${to} for ${order.order_id} (${info.messageId})`);
    return { sent: true, messageId: info.messageId, to, attempts };
  } catch (sendErr) {
    attempts = maxRetries + 1;
    console.error(
      `[email] Failed to send receipt for ${order.order_id} after ${attempts} attempt(s):`,
      sendErr.message
    );
    const metrics = require('../services/metricsService');
    metrics.trackEvent({
      event_type: 'email_delivery_failure',
      severity: 'medium',
      description: `Failed to send receipt email for order: ${order.order_id}`,
      ip: null,
      metadata: { order_id: order.order_id, to, error: sendErr.message, attempts }
    });
    return { sent: false, error: sendErr.message, attempts };
  }
}

// ── Allow resetting the transport in tests ────────────────────────────────────
function _resetTransport() {
  cachedTransport = null;
}

module.exports = {
  sendOrderReceiptEmail,
  validateOrderForReceipt,
  isEmailConfigured,
  isValidEmail,
  normalizeEmail,
  _resetTransport,
};
