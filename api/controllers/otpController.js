const axios = require('axios');
const Otp = require('../models/Otp');

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    await Otp.updateMany({ phone, used: false }, { used: true });

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({ phone, otp, expires_at });

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (apiKey && apiKey !== 'your_actual_api_key_here') {
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
const MAX_VERIFY_ATTEMPTS = 5;

async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    // Look up by phone only (not by otp) so failed guesses still resolve to
    // a record we can track attempts against.
    const record = await Otp.findOne({
      phone,
      used: false,
      expires_at: { $gt: new Date() },
    }).sort({ created_at: -1 });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      record.used = true; // lock this OTP out; caller must request a new one
      await record.save();
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      });
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    record.used = true;
    await record.save();

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { sendOtp, verifyOtp };
