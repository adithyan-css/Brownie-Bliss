const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const validate = require('../middlewares/validate');
const { sendOtpSchema, verifyOtpSchema } = require('../validators/otpValidator');
const { otpSendLimiter, otpVerifyLimiter } = require('../services/rateLimiters');

// ─── OTP send: 5 attempts / 15 min ─────────────────────────────────────────
router.post('/send-otp',   otpSendLimiter,   validate(sendOtpSchema),   sendOtp);

// ─── OTP verify: 10 failed attempts / 15 min (successful requests skipped) ─
router.post('/verify-otp', otpVerifyLimiter, validate(verifyOtpSchema), verifyOtp);

module.exports = router;

