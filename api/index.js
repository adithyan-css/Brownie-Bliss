require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const serverless = require('serverless-http');
const adminAuth = require('../middlewares/adminAuth');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '2h';
const ORDER_STATUSES = [
  'pending',
  'payment_confirmed',
  'preparing',
  'out_for_delivery',
  'completed',
  'cancelled',
];

mongoose.set('bufferCommands', false);

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

if (!MONGO_URI) {
  console.warn(
    'MONGO_URI is not set. Database-backed API routes will fail until it is configured.'
  );
}

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
    });

    isConnected = true;
    console.log('Connected to MongoDB');
    await seedProducts();
  } catch (err) {
    isConnected = false;
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    emoji: { type: String, default: 'brownie' },
    category: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: { type: String, unique: true, required: true },
    customer_name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    payment_status: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    notes: { type: String, default: '' },
    confirmed_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    otp: { type: String, required: true },
    expires_at: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at' } }
);

otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const productSchema = new mongoose.Schema({
  type: { type: String, enum: ['standard', 'birthday'], required: true },
  id_ref: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  emoji: { type: String },
  img: { type: String },
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return;

  const initialProducts = [
    {
      type: 'standard',
      id_ref: 1,
      name: 'Velvet Dream Cake',
      category: 'cakes',
      price: 850,
      emoji: 'cake',
      img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860',
    },
    {
      type: 'standard',
      id_ref: 2,
      name: 'Dutch Truffle Delight',
      category: 'cakes',
      price: 950,
      emoji: 'cake',
      img: 'https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180',
    },
    {
      type: 'standard',
      id_ref: 3,
      name: 'Pineapple Fresh Cream',
      category: 'cakes',
      price: 675,
      emoji: 'pineapple',
      img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785',
    },
    {
      type: 'standard',
      id_ref: 4,
      name: 'Overload Brownie',
      category: 'brownies',
      price: 120,
      emoji: 'brownie',
      img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338',
    },
    {
      type: 'standard',
      id_ref: 5,
      name: 'Walnut Fudge',
      category: 'brownies',
      price: 95,
      emoji: 'walnut',
      img: 'https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183181',
    },
    {
      type: 'standard',
      id_ref: 6,
      name: 'Classic Choco',
      category: 'brownies',
      price: 80,
      emoji: 'brownie',
      img: 'https://www.labonelfinebaking.shop/wp-content/uploads/2021/02/CLASSIC-CHOCOLATE-CAKE.jpg',
    },
    {
      type: 'standard',
      id_ref: 7,
      name: 'Chocolate Mousse',
      category: 'desserts',
      price: 150,
      emoji: 'dessert',
      img: 'https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427',
    },
    {
      type: 'standard',
      id_ref: 8,
      name: 'Tiramisu Jar',
      category: 'desserts',
      price: 180,
      emoji: 'coffee',
      img: 'https://brokenovenbaking.com/wp-content/uploads/2021/12/gingerbread-tiramisu-jars-14-1024x1024.jpg',
    },
    {
      type: 'standard',
      id_ref: 9,
      name: 'Choco Chip Cookies',
      category: 'cookies',
      price: 250,
      emoji: 'cookie',
      img: 'https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg',
    },
    {
      type: 'standard',
      id_ref: 10,
      name: 'Almond Biscotti',
      category: 'cookies',
      price: 300,
      emoji: 'biscotti',
      img: 'https://theglutenfreeaustrian.com/wp-content/uploads/2023/12/almondbiscotti9-768x768.jpg',
    },
    {
      type: 'birthday',
      id_ref: 'Red Velvet',
      name: 'Red Velvet',
      price: 850,
      emoji: 'cake',
      img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860',
    },
    {
      type: 'birthday',
      id_ref: 'Dutch Truffle',
      name: 'Dutch Truffle',
      price: 950,
      emoji: 'cake',
      img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180',
    },
    {
      type: 'birthday',
      id_ref: 'Pineapple',
      name: 'Pineapple',
      price: 675,
      emoji: 'pineapple',
      img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785',
    },
    {
      type: 'birthday',
      id_ref: 'Chocoholic',
      name: 'Chocoholic',
      price: 900,
      emoji: 'brownie',
      img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267',
    },
    {
      type: 'birthday',
      id_ref: 'Black Forest',
      name: 'Black Forest',
      price: 750,
      emoji: 'cake',
      img: 'https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg',
    },
    {
      type: 'birthday',
      id_ref: 'Cheesecake',
      name: 'Cheesecake',
      price: 1200,
      emoji: 'cheesecake',
      img: 'https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg',
    },
  ];

  await Product.insertMany(initialProducts);
  console.log('Seeded initial products to database');
}

function generateOrderId() {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BB-${datePart}-${rand}`;
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

app.use(async (req, res, next) => {
  if (req.path === '/' || !req.path.startsWith('/api')) return next();

  try {
    await connectDB();
    next();
  } catch (err) {
    res
      .status(503)
      .json({
        success: false,
        message: `Database connection failed: ${err.message}`,
      });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_JWT_SECRET) {
    return res
      .status(500)
      .json({ success: false, message: 'Admin auth not configured' });
  }

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: 'Username and password are required' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign({ username: ADMIN_USERNAME }, ADMIN_JWT_SECRET, {
    expiresIn: ADMIN_JWT_EXPIRES_IN,
  });

  return res.json({ success: true, token, expiresIn: ADMIN_JWT_EXPIRES_IN });
});

app.post('/api/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid phone number' });
    }

    await Otp.updateMany({ phone, used: false }, { used: true });

    const otp = generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({ phone, otp, expires_at });

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (apiKey && apiKey !== 'your_actual_api_key_here') {
      try {
        await axios.get('https://www.fast2sms.com/dev/bulkV2', {
          params: {
            route: 'otp',
            variables_values: otp,
            numbers: phone,
          },
          headers: { authorization: apiKey },
        });
        console.log(`SMS sent to ${phone}`);
      } catch (smsErr) {
        console.error(
          'Fast2SMS Error:',
          smsErr.response ? smsErr.response.data : smsErr.message
        );
      }
    } else {
      console.log(`[DEMO MODE] OTP for ${phone}: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired OTP' });
    }

    record.used = true;
    await record.save();

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/products', adminAuth, async (req, res) => {
  try {
    const { type, name, category, price, emoji, img, description } = req.body;

    if (!type || !name || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    let id_ref;
    if (type === 'standard') {
      const lastProduct = await Product.findOne({ type: 'standard' }).sort({
        id_ref: -1,
      });
      id_ref =
        lastProduct && typeof lastProduct.id_ref === 'number'
          ? lastProduct.id_ref + 1
          : 1;
    } else {
      id_ref = name;
    }

    const product = await Product.create({
      type,
      id_ref,
      name,
      category,
      price: Number(price),
      emoji,
      img,
      description,
    });

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.patch('/api/products/:id', adminAuth, async (req, res) => {
  try {
    const { price, name, img } = req.body;
    const updateData = {};

    if (
      price !== undefined &&
      !Number.isNaN(Number(price)) &&
      Number(price) >= 0
    ) {
      updateData.price = Number(price);
    }
    if (name !== undefined && name.trim() !== '') {
      updateData.name = name.trim();
    }
    if (img !== undefined) {
      updateData.img = img.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'No valid fields provided for update',
        });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, phone, address, city, pincode, items, total } =
      req.body;

    if (
      !customer_name ||
      !phone ||
      !address ||
      !city ||
      !pincode ||
      !items ||
      !total
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const order = await Order.create({
      order_id: generateOrderId(),
      customer_name,
      phone,
      address,
      city,
      pincode,
      items,
      total,
    });

    res.json({
      success: true,
      order_id: order.order_id,
      message: 'Order placed successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/orders', adminAuth, async (req, res) => {
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

app.get('/api/orders/:orderId', adminAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ order_id: req.params.orderId }).lean();
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.patch(
  '/api/orders/:orderId/confirm-payment',
  adminAuth,
  async (req, res) => {
    try {
      const { notes } = req.body;
      const order = await Order.findOneAndUpdate(
        { order_id: req.params.orderId },
        {
          payment_status: 'paid',
          status: 'payment_confirmed',
          confirmed_at: new Date(),
          notes: notes || 'Payment confirmed via WhatsApp',
        },
        { new: true }
      );

      if (!order)
        return res
          .status(404)
          .json({ success: false, message: 'Order not found' });
      res.json({ success: true, message: 'Payment confirmed' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

app.patch('/api/orders/:orderId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findOneAndUpdate(
      { order_id: req.params.orderId },
      { status },
      { new: true }
    );

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/stats', adminAuth, async (req, res) => {
  try {
    const [totalOrders, pendingOrders, paidOrders, revenueResult] =
      await Promise.all([
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// ─── STARTUP FUNCTION ──────────────────────────────────────────────────────────
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

// ─── START LOCAL SERVER ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  startServer(PORT);
}

// ─── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = app;
module.exports.handler = serverless(app);
