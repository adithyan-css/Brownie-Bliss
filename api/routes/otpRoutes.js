const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/otpController');

const sendOtpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

router.post('/send-otp', sendOtpRateLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;
