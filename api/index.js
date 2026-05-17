const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
require('dotenv').config();
const serverless = require('serverless-http');
const adminAuth = require('../middlewares/adminAuth');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '2h';
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || 'your-secret-key-change-this';
const USER_JWT_EXPIRES_IN = process.env.USER_JWT_EXPIRES_IN || '30d';

// Disable buffering so mongoose throws immediately if not connected
mongoose.set('bufferCommands', false);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ─── CACHED SERVERLESS CONNECTION ──────────────────────────────────────────────
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
    console.log('✅ Connected to MongoDB');
    await seedProducts();
  } catch (err) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

// ─── MIDDLEWARE: connect before every request ───────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: `Database connection failed: ${err.message}` });
  }
});

// ─── SCHEMAS ───────────────────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema({
  label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  addresses: [addressSchema],
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  rememberMe: { type: Boolean, default: false },
  avatar: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

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
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
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

const User = mongoose.model('User', userSchema);
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
      { type: 'standard', id_ref: 2, name: "Dutch Truffle Delight", category: "cakes", price: 950, emoji: "🍰", img:"https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180" },
      { type: 'standard', id_ref: 3, name: "Pineapple Fresh Cream", category: "cakes", price: 675, emoji: "🍍", img: "https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785" },
      { type: 'standard', id_ref: 4, name: "Overload Brownie", category: "brownies", price: 120, emoji: "🍫", img: "https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338" },
      { type: 'standard', id_ref: 5, name: "Walnut Fudge", category: "brownies", price: 95, emoji: "🥜", img: "https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183181" },
      { type: 'standard', id_ref: 6, name: "Classic Choco", category: "brownies", price: 80, emoji: "🍫", img: "https://www.labonelfinebaking.shop/wp-content/uploads/2021/02/CLASSIC-CHOCOLATE-CAKE.jpg" },
      { type: 'standard', id_ref: 7, name: "Chocolate Mousse", category: "desserts", price: 150, emoji: "🍮", img: "https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427" },
      { type: 'standard', id_ref: 8, name: "Tiramisu Jar", category: "desserts", price: 180, emoji: "☕", img: "https://brokenovenbaking.com/wp-content/uploads/2021/12/gingerbread-tiramisu-jars-14-1024x1024.jpg" },
      { type: 'standard', id_ref: 9, name: "Choco Chip Cookies", category: "cookies", price: 250, emoji: "🍪", img: "https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg" },
      { type: 'standard', id_ref: 10, name: "Almond Biscotti", category: "cookies", price: 300, emoji: "🥖", img: "https://theglutenfreeaustrian.com/wp-content/uploads/2023/12/almondbiscotti9-768x768.jpg" },
      // Birthday Cakes (base price per kg)
      { type: 'birthday', id_ref: 'Red Velvet', name: "Red Velvet", price: 850, emoji: "🎂", img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' },
      { type: 'birthday', id_ref: 'Dutch Truffle', name: "Dutch Truffle", price: 950, emoji: "🍰", img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180' },
      { type: 'birthday', id_ref: 'Pineapple', name: "Pineapple", price: 675, emoji: "🍍", img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785' },
      { type: 'birthday', id_ref: 'Chocoholic', name: "Chocoholic", price: 900, emoji: "🍫", img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267' },
      { type: 'birthday', id_ref: 'Black Forest', name: "Black Forest", price: 750, emoji: "🌲", img: 'https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg' },
      { type: 'birthday', id_ref: 'Cheesecake', name: "Cheesecake", price: 1200, emoji: "🧀", img: 'https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg' }
    ];
    await Product.insertMany(initialProducts);
    console.log('🌱 Seeded initial products to database');
  }
}
// seedProducts();

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
//─────────────────────JWT BASED AUTHENTICATION───────────────────────────────────────────


// ─── ADMIN AUTH ROUTES ─────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

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
});

// ─── USER AUTH MIDDLEWARE ──────────────────────────────────────────────────────
function verifyUserToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, USER_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ─── CUSTOMER AUTH ROUTES ──────────────────────────────────────────────────────
// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
    });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      USER_JWT_SECRET,
      { expiresIn: USER_JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update rememberMe flag
    if (rememberMe) {
      user.rememberMe = true;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      USER_JWT_SECRET,
      { expiresIn: rememberMe ? '90d' : USER_JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify token
app.get('/api/auth/verify', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout (client-side, but good to have endpoint)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─── USER PROFILE & ADDRESS ROUTES ─────────────────────────────────────────────
// Get user profile
app.get('/api/user/profile', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
app.put('/api/user/profile', verifyUserToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, phone },
      { new: true }
    ).select('-password');

    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add address
app.post('/api/user/addresses', verifyUserToken, async (req, res) => {
  try {
    const { label, street, city, state, pincode, phone, isDefault } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({ label, street, city, state, pincode, phone, isDefault });
    await user.save();

    res.json({ success: true, message: 'Address added', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get addresses
app.get('/api/user/addresses', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('addresses');
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update address
app.put('/api/user/addresses/:id', verifyUserToken, async (req, res) => {
  try {
    const { label, street, city, state, pincode, phone, isDefault } = req.body;
    const user = await User.findById(req.user.userId);

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.id);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses[addressIndex] = { _id: user.addresses[addressIndex]._id, label, street, city, state, pincode, phone, isDefault };
    await user.save();

    res.json({ success: true, message: 'Address updated', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete address
app.delete('/api/user/addresses/:id', verifyUserToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
    await user.save();

    res.json({ success: true, message: 'Address deleted', addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── USER ORDER ROUTES ─────────────────────────────────────────────────────────
// Get user orders
app.get('/api/user/orders', verifyUserToken, async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user.userId }).sort({ created_at: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create order (linked to user if authenticated)
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, phone, address, city, pincode, items, total } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!customer_name || !phone || !address || !items || !total) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const order_id = generateOrderId();
    let userId = null;

    // If authenticated, link order to user
    if (token) {
      try {
        const decoded = jwt.verify(token, USER_JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Token invalid, proceed without user link
      }
    }

    const order = await Order.create({
      order_id,
      user_id: userId,
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
app.post('/api/products', adminAuth, async (req, res) => {
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
app.patch('/api/products/:id', adminAuth, async (req, res) => {
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
app.delete('/api/products/:id', adminAuth, async (req, res) => {
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
app.patch('/api/orders/:orderId/confirm-payment', adminAuth, async (req, res) => {
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
app.patch('/api/orders/:orderId/status', adminAuth, async (req, res) => {
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

// Serve homepage explicitly (IMPORTANT for Vercel)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── START ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

module.exports = serverless(app);