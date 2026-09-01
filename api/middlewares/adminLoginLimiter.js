const rateLimit = require("express-rate-limit");

// Throttles the admin login endpoint so a leaked/plaintext password (or just
// a weak one) can't be brute-forced. Keyed on IP; tune window/max to taste.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

module.exports = { adminLoginLimiter };
