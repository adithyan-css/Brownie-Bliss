const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
  const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
  
  if (!ADMIN_JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Admin auth not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Missing or invalid authorization token' });
  }

  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    req.admin = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = adminAuth;
