require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const serverless = require('serverless-http');

const { connectDB } = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const otpRoutes = require('./routes/otpRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminAuth = require('../middlewares/adminAuth');
const { getStats } = require('./controllers/orderController');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── GLOBAL MIDDLEWARE ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── DB CONNECTION (per-request, serverless-safe) ───────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: `Database connection failed: ${err.message}` });
  }
});

// ─── API ROUTES ─────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api', otpRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.get('/api/stats', adminAuth, getStats);

// ─── STATIC FALLBACK ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ─── LOCAL SERVER ───────────────────────────────────────────────────────────────
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !process.env.PORT) {
      const nextPort = Number(port) + 1;
      console.warn(`⚠️ Port ${port} is already in use. Trying ${nextPort}...`);
      startServer(nextPort);
      return;
    }
    console.error('❌ Server startup error:', err);
    process.exit(1);
  });
}

if (process.env.NODE_ENV !== 'production') {
  startServer(PORT);
}

module.exports = app;
module.exports.handler = serverless(app);
