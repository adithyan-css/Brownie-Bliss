const jwt = require('jsonwebtoken');

function login(req, res) {
  const { username, password } = req.body || {};

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
  const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '2h';

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Admin auth not configured' });
  }

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username: ADMIN_USERNAME },
    ADMIN_JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRES_IN }
  );

  return res.json({ success: true, token, expiresIn: ADMIN_JWT_EXPIRES_IN });
}

module.exports = { login };
