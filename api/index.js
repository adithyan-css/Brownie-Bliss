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

const app = express();
app.set('trust proxy', 1);

// ─── GLOBAL MIDDLEWARE ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── DB CONNECTION (per-request, serverless-safe) ───────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.warn('⚠️  MONGO_URI is not set. Orders and products API run in memory/static mode until you restart the server.');
}

app.use(async (req, res, next) => {
  if (!MONGO_URI) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: `Database connection failed: ${err.message}` });
  }
});

// ─── API ROUTES ─────────────────────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api', otpRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

    let customerEmail = normalizeEmail(email);
    if (customerEmail && !isValidEmail(customerEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const orderDoc = {
      order_id,
      customer_name: String(customer_name).trim().slice(0, 120),
      email: customerEmail,
      phone: phoneDigits.slice(0, 15),
      address: String(address).trim().slice(0, 500),
      city: String(city).trim().slice(0, 80),
      pincode: String(pincode).trim().slice(0, 12),
      items: sanitizedItems,
      total: finalTotal,
    };

    if (!isDbReady()) {
      const now = new Date();
      memoryOrders.unshift({
        ...orderDoc,
        status: 'pending',
        payment_status: 'unpaid',
        notes: '',
        confirmed_at: null,
        created_at: now,
        updated_at: now,
      });
      return res.json({
        success: true,
        order_id,
        message: 'Order placed successfully (memory mode — add MONGO_URI to persist orders in MongoDB).',
      });
    }

    const order = await Order.create(orderDoc);

    res.json({ success: true, order_id: order.order_id, message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// Get all orders (admin)
app.get('/api/orders', adminAuth, async (req, res) => {
  try {
    const { status, search, from, to } = req.query;
    const conditions = [];

    if (!isDbReady()) {
      let list = [...memoryOrders];
      if (status && status !== 'all') {
        list = list.filter((o) => o.status === status || o.payment_status === status);
      }
      return res.json({ success: true, orders: list });
    }

    if (status && status !== 'all') {
      conditions.push({ $or: [{ status }, { payment_status: status }] });
    }

    if (search && search.trim() !== '') {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      conditions.push({
        $or: [
          { customer_name: searchRegex },
          { phone: searchRegex },
          { order_id: searchRegex }
        ]
      });
    }

    const createdAtFilter = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        createdAtFilter.$gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        createdAtFilter.$lte = toDate;
      }
    }
    if (Object.keys(createdAtFilter).length > 0) {
      conditions.push({ created_at: createdAtFilter });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const orders = await Order.find(filter).sort({ created_at: -1 }).lean();
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single order
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    if (!isDbReady()) {
      const order = memoryOrders.find((o) => o.order_id === req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.json({ success: true, order });
    }
    const order = await Order.findOne({ order_id: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Confirm payment (admin action)
app.patch('/api/orders/:orderId/confirm-payment', adminAuth, async (req, res) => {
  try {
    const { notes, email: emailFromBody } = req.body;

    if (!isDbReady()) {
      const order = memoryOrders.find((o) => o.order_id === req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      order.payment_status = 'paid';
      order.status = 'confirmed';
      order.confirmed_at = new Date();
      order.notes = notes || 'Payment confirmed via WhatsApp';
      order.updated_at = new Date();

      const bodyEmail = normalizeEmail(emailFromBody);
      if (bodyEmail) {
        if (!isValidEmail(bodyEmail)) {
          return res.status(400).json({ success: false, message: 'Invalid email address' });
        }
        order.email = bodyEmail;
      }

      const receipt_email = await sendOrderReceiptEmail(order);
      return res.json({
        success: true,
        message: 'Payment confirmed',
        receipt_email,
      });
    }

    const existing = await Order.findOne({ order_id: req.params.orderId });
    if (!existing) return res.status(404).json({ success: false, message: 'Order not found' });

    const update = {
      payment_status: 'paid',
      status: 'confirmed',
      confirmed_at: new Date(),
      notes: notes || 'Payment confirmed via WhatsApp',
    };

    const bodyEmail = normalizeEmail(emailFromBody);
    if (bodyEmail) {
      if (!isValidEmail(bodyEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      }
      update.email = bodyEmail;
    }

    const order = await Order.findOneAndUpdate(
      { order_id: req.params.orderId },
      update,
      { new: true }
    ).lean();

    const receipt_email = await sendOrderReceiptEmail(order);

    res.json({
      success: true,
      message: 'Payment confirmed',
      receipt_email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// Update order status
app.patch('/api/orders/:orderId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!isDbReady()) {
      const order = memoryOrders.find((o) => o.order_id === req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      order.status = status;
      order.updated_at = new Date();
      return res.json({ success: true });
    }

    const order = await Order.findOneAndUpdate(
      { order_id: req.params.orderId },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Stats for admin dashboard
app.get('/api/stats', adminAuth, async (req, res) => {
  try {
    if (!isDbReady()) {
      const total_orders = memoryOrders.length;
      const pending_orders = memoryOrders.filter((o) => o.status === 'pending').length;
      const paid_orders = memoryOrders.filter((o) => o.payment_status === 'paid').length;
      const total_revenue = memoryOrders
        .filter((o) => o.payment_status === 'paid')
        .reduce((s, o) => s + (Number(o.total) || 0), 0);
      return res.json({
        success: true,
        stats: {
          total_orders,
          pending_orders,
          paid_orders,
          total_revenue,
        },
      });
    }

    const [totalOrders, pendingOrders, paidOrders, revenueResult] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ payment_status: 'paid' }),
      Order.aggregate([
        { $match: { payment_status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        total_orders: totalOrders,
        pending_orders: pendingOrders,
        paid_orders: paidOrders,
        total_revenue: revenueResult[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve homepage explicitly (IMPORTANT for Vercel)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── START ─────────────────────────────────────────────────────────────────────
// ─── START ─────────────────────────────────────────────────────────────────────
function startServer(port) {
  if (!MONGO_URI) {
    console.warn('⚠️  MONGO_URI is not set. Orders and products API run in memory/static mode until you restart the server.');
  }
  const server = app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
// ─── STATIC FALLBACK ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ─── LOCAL PORT BINDING ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, (err) => {
    if (err) {
      console.error('❌ Server startup error:', err);
      return;
    }
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
module.exports.handler = serverless(app);