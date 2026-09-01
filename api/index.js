require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const serverless = require('serverless-http');

const { connectDB } = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const otpRoutes = require('./routes/otpRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminAuth = require('../middlewares/adminAuth');
const { getStats } = require('./controllers/orderController');
const monitoringMiddleware = require('./middlewares/monitoringMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Centralized monitoring middleware
app.use(monitoringMiddleware);

// Security Enhancements
app.use(helmet());

// Restrict CORS origins dynamically
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Apply request body size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ─── DB CONNECTION (per-request, serverless-safe) ───────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    const metrics = require('./services/metricsService');
    metrics.trackEvent({
      event_type: 'database_failure',
      severity: 'high',
      description: `Database connection failed: ${err.message}`,
      ip: req.ip || null,
      metadata: { stack: err.stack }
    });
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
  
  const metrics = require('./services/metricsService');
  const isDbError = err.name === 'MongoError' || err.name === 'MongooseError' || (err.message && err.message.includes('Mongo'));
  const event_type = isDbError ? 'database_failure' : 'unhandled_exception';
  const severity = isDbError ? 'high' : 'critical';
  
  metrics.trackEvent({
    event_type,
    severity,
    description: `Unhandled exception: ${err.message}`,
    ip: req.ip || null,
    metadata: { stack: err.stack, path: req.path, method: req.method }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Something went wrong!',
    ...( !isProduction && { stack: err.stack } )
  });
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

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  startServer(PORT);
}

module.exports = app;
module.exports.handler = serverless(app);