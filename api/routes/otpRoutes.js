const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const validate = require('../middlewares/validate');
const { sendOtpSchema, verifyOtpSchema } = require('../validators/otpValidator');

const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});

router.post('/send-otp', otpRateLimiter, validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);

module.exports = router;
