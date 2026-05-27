require('dotenv').config();
const { isEmailConfigured } = require('./api/email/mailer');
const nodemailer = require('nodemailer');

async function test() {
  console.log('Checking environment variables...');
  if (!isEmailConfigured()) {
    console.log('❌ Email is NOT configured correctly in .env.');
    console.log('Missing one of: SMTP_HOST, SMTP_USER, SMTP_PASS');
    return;
  }

  console.log('✅ Environment variables found.');
  console.log('Testing SMTP connection to', process.env.SMTP_HOST, '...');

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transport.verify();
    console.log('✅ SMTP Connection Successful! Your app password and email are correct.');
  } catch (err) {
    console.log('❌ SMTP Connection Failed!');
    console.error(err.message);
  }
}

test();
