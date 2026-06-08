const axios = require('axios');
const Otp = require('../models/Otp');
const { isDbReady } = require('../config/db');

const memoryOtps = [];
const SMS_PLACEHOLDER_KEYS = new Set([
  'your_actual_api_key_here',
  'your_fast2sms_api_key_here',
]);

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanupMemoryOtps() {
  const now = Date.now();
  for (let i = memoryOtps.length - 1; i >= 0; i -= 1) {
    if (memoryOtps[i].expires_at.getTime() <= now || memoryOtps[i].used) {
      memoryOtps.splice(i, 1);
    }
  }
}

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    if (isDbReady()) {
      await Otp.updateMany({ phone, used: false }, { used: true });
      await Otp.create({ phone, otp, expires_at });
    } else {
      cleanupMemoryOtps();
      memoryOtps.forEach((record) => {
        if (record.phone === phone && !record.used) record.used = true;
      });
      memoryOtps.push({ phone, otp, expires_at, used: false });
    }

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (apiKey && !SMS_PLACEHOLDER_KEYS.has(apiKey)) {
      try {
        await axios.get('https://www.fast2sms.com/dev/bulkV2', {
          params: { route: 'otp', variables_values: otp, numbers: phone },
          headers: { authorization: apiKey },
        });
        console.log(`✅ SMS sent to ${phone}`);
      } catch (smsErr) {
        console.error('❌ Fast2SMS Error:', smsErr.response ? smsErr.response.data : smsErr.message);
      }
    } else {
      console.log(`📱 [DEMO MODE] OTP for ${phone}: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    let record;
    if (isDbReady()) {
      record = await Otp.findOne({
        phone,
        otp,
        used: false,
        expires_at: { $gt: new Date() },
      }).sort({ created_at: -1 });
    } else {
      cleanupMemoryOtps();
      record = memoryOtps
        .filter((item) => item.phone === phone && item.otp === otp && !item.used)
        .sort((a, b) => b.expires_at - a.expires_at)[0];
    }

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    record.used = true;
    if (isDbReady()) {
      await record.save();
    }

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { sendOtp, verifyOtp };
