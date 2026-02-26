const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// ─── CONFIG ────────────────────────────────────────────────────────────────────
// Replace with your MongoDB connection string.
// Local:   mongodb://localhost:27017/brownie_bliss
// Atlas:   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/brownie_bliss
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brownie_bliss';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CONNECT TO MONGODB ────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   Make sure MongoDB is running or set MONGO_URI env variable.');
    process.exit(1);
  });

// ─── SCHEMAS ───────────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  emoji: { type: String, default: '🍫' },
  category: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true, required: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'], default: 'pending' },
  payment_status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  notes: { type: String, default: '' },
  confirmed_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at' } });

// Auto-delete OTP documents after they expire (TTL index)
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Order = mongoose.model('Order', orderSchema);
const Otp = mongoose.model('Otp', otpSchema);

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function generateOrderId() {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BB-${datePart}-${rand}`;
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── OTP ROUTES ────────────────────────────────────────────────────────────────
// Send OTP  (demo — shows OTP in response; in production wire up MSG91 / Twilio)
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    // Invalidate any existing unused OTPs for this number
    await Otp.updateMany({ phone, used: false }, { used: true });

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.create({ phone, otp, expires_at });

    // --- FAST2SMS INTEGRATION ---
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (apiKey && apiKey !== 'your_actual_api_key_here') {
      try {
        await axios.get('https://www.fast2sms.com/dev/bulkV2', {
          params: {
            route: 'otp',
            variables_values: otp,
            numbers: phone,
          },
          headers: {
            authorization: apiKey
          }
        });
        console.log(`✅ SMS sent to ${phone}`);
      } catch (smsErr) {
        console.error('❌ Fast2SMS Error:', smsErr.response ? smsErr.response.data : smsErr.message);
        // We continue anyway so the user can use the console log in dev if needed
      }
    } else {
      console.log(`📱 [DEMO MODE] OTP for ${phone}: ${otp}`);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const record = await Otp.findOne({
      phone,
      otp,
      used: false,
      expires_at: { $gt: new Date() },
    }).sort({ created_at: -1 });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    record.used = true;
    await record.save();

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ORDER ROUTES ──────────────────────────────────────────────────────────────
// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, phone, address, city, pincode, items, total } = req.body;

    if (!customer_name || !phone || !address || !items || !total) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const order_id = generateOrderId();

    const order = await Order.create({
      order_id,
      customer_name,
      phone,
      address,
      city,
      pincode,
      items,
      total,
    });

    res.json({ success: true, order_id: order.order_id, message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all orders (admin)
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.$or = [{ status }, { payment_status: status }];
    }

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
    const order = await Order.findOne({ order_id: req.params.orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Confirm payment (admin action)
app.patch('/api/orders/:orderId/confirm-payment', async (req, res) => {
  try {
    const { notes } = req.body;
    const order = await Order.findOneAndUpdate(
      { order_id: req.params.orderId },
      {
        payment_status: 'paid',
        status: 'confirmed',
        confirmed_at: new Date(),
        notes: notes || 'Payment confirmed via WhatsApp',
      },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update order status
app.patch('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
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
app.get('/api/stats', async (req, res) => {
  try {
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

// ─── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍫 Brownie Bliss Server running at http://localhost:${PORT}`);
  console.log(`📋 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`🛍️  Shop:        http://localhost:${PORT}/index.html\n`);
});
