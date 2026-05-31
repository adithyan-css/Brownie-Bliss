const nodemailer = require('nodemailer');
const { buildReceiptHtml, buildReceiptText } = require('./receiptTemplate');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  });

  return cachedTransport;
}

function normalizeEmail(raw) {
  if (raw == null) return '';
  return String(raw).trim().toLowerCase().slice(0, 254);
}

function isValidEmail(email) {
  return email.length > 3 && email.length <= 254 && EMAIL_RE.test(email);
}

/**
 * Send payment receipt to the customer.
 * Never throws — returns { sent, skipped?, error?, reason? }.
 */
async function sendOrderReceiptEmail(order) {
  const to = normalizeEmail(order.email);

  if (!to) {
    return { sent: false, skipped: true, reason: 'no_email' };
  }

  if (!isValidEmail(to)) {
    return { sent: false, skipped: true, reason: 'invalid_email' };
  }

  if (!isEmailConfigured()) {
    console.warn('[email] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Receipt not sent.');
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const transport = getTransport();
  const subject = `Your Brownie Bliss receipt — ${order.order_id}`;

  try {
    await transport.verify();
  } catch (verifyErr) {
    console.error('[email] SMTP verify failed:', verifyErr.message);
    return { sent: false, error: verifyErr.message };
  }

  try {
    const info = await transport.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text: buildReceiptText(order),
      html: buildReceiptHtml(order),
    });

    console.log(`[email] Receipt sent to ${to} for ${order.order_id} (${info.messageId})`);
    return { sent: true, messageId: info.messageId, to };
  } catch (sendErr) {
    console.error(`[email] Failed to send receipt for ${order.order_id}:`, sendErr.message);
    return { sent: false, error: sendErr.message };
  }
}

module.exports = {
  sendOrderReceiptEmail,
  isEmailConfigured,
  isValidEmail,
  normalizeEmail,
};
