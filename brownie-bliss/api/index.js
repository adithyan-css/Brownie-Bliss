const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIG ────────────────────────────────────────────────────────────────────
// Replace with your MongoDB connection string.
// Local:   mongodb://localhost:27017/brownie_bliss
// Atlas:   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/brownie_bliss
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/brownie_bliss';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CONNECT TO MONGODB ────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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

const productSchema = new mongoose.Schema({
  type: { type: String, enum: ['standard', 'birthday'], required: true },
  id_ref: { type: mongoose.Schema.Types.Mixed }, // String or Number for reference
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  emoji: { type: String },
  img: { type: String }
});

const Order = mongoose.model('Order', orderSchema);
const Otp = mongoose.model('Otp', otpSchema);
const Product = mongoose.model('Product', productSchema);

// ─── INIT PRODUCTS ─────────────────────────────────────────────────────────────
async function seedProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    const initialProducts = [
      // Standard Products
      { type: 'standard', id_ref: 1, name: "Velvet Dream Cake", category: "cakes", price: 850, emoji: "🎂", img: "https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860" },
      { type: 'standard', id_ref: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, emoji: "🍰", img: "https://theobroma.in/cdn/shop/files/DutchTruffleCakehalfkg_Square_400x400.jpg?v=1711124619" },
      { type: 'standard', id_ref: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, emoji: "🍍", img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785" },
      { type: 'standard', id_ref: 4, name: "Overload Brownie", category: "brownies", price: 120, emoji: "🍫", img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338" },
      { type: 'standard', id_ref: 5, name: "Walnut Fudge", category: "brownies", price: 95, emoji: "🥜", img: "https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183181" },
      { type: 'standard', id_ref: 6, name: "Classic Choco", category: "brownies", price: 80, emoji: "🍫", img: "https://theobroma.in/cdn/shop/files/eggless-theo-overload-brownie-6.jpg?v=1681320427" },
      { type: 'standard', id_ref: 7, name: "Chocolate Mousse", category: "desserts", price: 150, emoji: "🍮", img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427" },
      { type: 'standard', id_ref: 8, name: "Tiramisu Jar", category: "desserts", price: 180, emoji: "☕", img: "https://theobroma.in/cdn/shop/files/TiramisuPastry_400x400.jpg?v=1711125219" },
      { type: 'standard', id_ref: 9, name: "Choco Chip Cookies", category: "cookies", price: 250, emoji: "🍪", img: "https://theobroma.in/cdn/shop/files/Cookie-04_400x400.jpg?v=1701416744" },
      { type: 'standard', id_ref: 10, name: "Almond Biscotti", category: "cookies", price: 300, emoji: "🥖", img: "https://theobroma.in/cdn/shop/files/Cookie-01_400x400.jpg?v=1681320427" },
      // Birthday Cakes (base price per kg)
      { type: 'birthday', id_ref: 'Red Velvet', name: "Red Velvet", price: 850, emoji: "🎂", img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' },
      { type: 'birthday', id_ref: 'Dutch Truffle', name: "Dutch Truffle", price: 950, emoji: "🍰", img: 'https://theobroma.in/cdn/shop/files/DutchTruffleCakehalfkg_Square_400x400.jpg?v=1711124619' },
      { type: 'birthday', id_ref: 'Pineapple', name: "Pineapple", price: 675, emoji: "🍍", img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785' },
      { type: 'birthday', id_ref: 'Chocoholic', name: "Chocoholic", price: 900, emoji: "🍫", img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267' },
      { type: 'birthday', id_ref: 'Black Forest', name: "Black Forest", price: 750, emoji: "🌲", img: 'https://theobroma.in/cdn/shop/files/BlackForestCakehalfkg_Square_400x400.jpg?v=1711124458' },
      { type: 'birthday', id_ref: 'Cheesecake', name: "Cheesecake", price: 1200, emoji: "🧀", img: 'https://theobroma.in/cdn/shop/files/BlueberryCheesecakeCup_400x400.jpg?v=1711514632' }
    ];
    await Product.insertMany(initialProducts);
    console.log('🌱 Seeded initial products to database');
  }
}
seedProducts();

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

// ─── PRODUCT ROUTES ────────────────────────────────────────────────────────────
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const { type, name, category, price, emoji, img } = req.body;

    if (!type || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let id_ref;
    if (type === 'standard') {
      const lastProduct = await Product.findOne({ type: 'standard' }).sort({ id_ref: -1 });
      id_ref = lastProduct && typeof lastProduct.id_ref === 'number' ? lastProduct.id_ref + 1 : 1;
    } else {
      id_ref = name; // For birthday cakes
    }

    const product = await Product.create({
      type,
      id_ref,
      name,
      category,
      price: Number(price),
      emoji,
      img
    });

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update product details
app.patch('/api/products/:id', async (req, res) => {
  try {
    const { price, name, img } = req.body;

    // Build update object dynamically
    const updateData = {};
    if (price !== undefined && !isNaN(price) && price >= 0) {
      updateData.price = Number(price);
    }
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim();
    }
    if (img !== undefined) { // Allow empty string to clear image if desired
      updateData.img = img.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
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
module.exports = app;
