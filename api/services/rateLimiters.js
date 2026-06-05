/**
 * rateLimiters.js — centralized express-rate-limit definitions.
 *
 * Design principles:
 *  - All limiters emit structured JSON 429 responses matching the API's error schema.
 *  - skipSuccessfulRequests where brute-force is the threat (login, verify-OTP)
 *    so legitimate users don't burn their quota on correct answers.
 *  - skip() bypasses limits in test environments so Jest doesn't fight limiters.
 *  - Each limiter has a distinct keyGenerator comment so behaviour is traceable.
 *  - Abuse events are logged to audit trail via the auditService.
 */

const rateLimit = require('express-rate-limit');
const audit = require('./auditService');

const IS_TEST = process.env.NODE_ENV === 'test';

// ── Helper: build a standard 429 JSON handler ────────────────────────────────
function makeHandler(message, auditAction) {
  return (req, res, next, options) => {
    // Non-blocking abuse audit log
    if (auditAction) {
      audit.log({
        actor: String(req.body?.username || req.body?.phone || 'unknown').slice(0, 120),
        action: auditAction,
        resource: 'rate_limit',
        metadata: { path: req.path, ip: req.ip, limit: options.max, window: options.windowMs },
        ip: req.ip || null,
      });
    }
    res.status(429).json({ success: false, message });
  };
}

// ── OTP send: 5 attempts / 15 min (already existed; now centralised) ─────────
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
  handler: makeHandler(
    'Too many OTP requests from this IP. Please wait 15 minutes before trying again.',
    'ADMIN_LOGIN_FAILED'  // reuse closest enum; extend model if needed
  ),
});

// ── OTP verify: 10 attempts / 15 min — count only failures ──────────────────
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,   // successful verifications don't burn quota
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
  handler: makeHandler(
    'Too many failed OTP verification attempts. Please wait 15 minutes.',
    'ADMIN_LOGIN_FAILED'
  ),
});

// ── Admin login: 5 attempts / 15 min — count only failures (brute-force) ────
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
  handler: makeHandler(
    'Too many failed login attempts. Account locked for 15 minutes.',
    'ADMIN_LOGIN_FAILED'
  ),
});

// ── Order creation: 10 orders / 15 min ───────────────────────────────────────
const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
  handler: makeHandler(
    'Too many order requests from this IP. Please try again after 15 minutes.',
    null
  ),
});

// ── Public order read: 120 reads / 15 min — allows normal browsing ───────────
const orderReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
  handler: makeHandler(
    'Too many requests. Please slow down and try again shortly.',
    null
  ),
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter,
  adminLoginLimiter,
  orderCreateLimiter,
  orderReadLimiter,
};
