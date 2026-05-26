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

const STATIC_CATALOG = [
  { type: 'standard', id_ref: 1, name: 'Velvet Dream Cake', category: 'cakes', description: 'Soft red velvet sponge layered with smooth cream cheese frosting for a rich and balanced finish.', dummyShop: 'Bliss Central Kitchen', location: 'Krishnagiri', price: 850, emoji: 'cake', img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' },
  { type: 'standard', id_ref: 2, name: 'Dutch Truffle Delight', category: 'cakes', description: 'Moist chocolate sponge with deep truffle ganache made for intense chocolate lovers.', dummyShop: 'Choco Street Counter', location: 'Hosur', price: 950, emoji: 'cake', img: 'https://tse3.mm.bing.net/th/id/OIP.6wMpc_E6xsHLl3zT2ItBSQHaHa?pid=Api&P=0&h=180' },
  { type: 'standard', id_ref: 3, name: 'Pineapple Fresh Cream', category: 'cakes', description: 'Fluffy vanilla sponge, juicy pineapple bits, and light whipped cream in a refreshing classic style.', dummyShop: 'Bliss Central Kitchen', location: 'Dharmapuri', price: 675, emoji: 'pineapple', img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785' },
  { type: 'standard', id_ref: 4, name: 'Overload Brownie', category: 'brownies', description: 'Dense cocoa brownie with extra chocolate chunks for a gooey center and crispy top.', dummyShop: 'Brownie Hub Express', location: 'Krishnagiri', price: 120, emoji: 'brownie', img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338' },
  { type: 'standard', id_ref: 5, name: 'Walnut Fudge', category: 'brownies', description: 'Classic fudge brownie folded with roasted walnuts for added crunch and nutty depth.', dummyShop: 'Brownie Hub Express', location: 'Salem', price: 95, emoji: 'walnut', img: 'https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183181' },
  { type: 'standard', id_ref: 6, name: 'Classic Choco', category: 'brownies', description: 'Everyday chocolate brownie with a balanced sweetness and soft bite, perfect for tea-time.', dummyShop: 'Choco Street Counter', location: 'Hosur', price: 80, emoji: 'brownie', img: 'https://www.labonelfinebaking.shop/wp-content/uploads/2021/02/CLASSIC-CHOCOLATE-CAKE.jpg' },
  { type: 'standard', id_ref: 7, name: 'Chocolate Mousse', category: 'desserts', description: 'Silky mousse whipped from premium dark chocolate, finished with a velvety, airy texture.', dummyShop: 'Dessert Dock', location: 'Krishnagiri', price: 150, emoji: 'dessert', img: 'https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427' },
  { type: 'standard', id_ref: 8, name: 'Tiramisu Jar', category: 'desserts', description: 'Coffee-soaked sponge and creamy mascarpone layers packed in a handy dessert jar.', dummyShop: 'Dessert Dock', location: 'Dharmapuri', price: 180, emoji: 'coffee', img: 'https://brokenovenbaking.com/wp-content/uploads/2021/12/gingerbread-tiramisu-jars-14-1024x1024.jpg' },
  { type: 'standard', id_ref: 9, name: 'Choco Chip Cookies', category: 'cookies', description: 'Buttery cookies with premium chocolate chips, baked for crisp edges and chewy centers.', dummyShop: 'Cookie Corner', location: 'Salem', price: 250, emoji: 'cookie', img: 'https://www.shugarysweets.com/wp-content/uploads/2020/05/chocolate-chip-cookies-recipe.jpg' },
  { type: 'standard', id_ref: 10, name: 'Almond Biscotti', category: 'cookies', description: 'Twice-baked Italian style biscotti with toasted almonds for a crunchy coffee companion.', dummyShop: 'Cookie Corner', location: 'Hosur', price: 300, emoji: 'biscotti', img: 'https://theglutenfreeaustrian.com/wp-content/uploads/2023/12/almondbiscotti9-768x768.jpg' },
  { type: 'birthday', id_ref: 'Red Velvet', name: 'Red Velvet', category: 'cakes', description: 'Signature red velvet celebration cake with cream cheese frosting and a tender crumb.', dummyShop: 'Celebration Cakes Studio', location: 'Krishnagiri', price: 850, emoji: 'cake', img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860' },
  { type: 'birthday', id_ref: 'Dutch Truffle', name: 'Dutch Truffle', category: 'cakes', description: 'Birthday truffle cake layered with rich chocolate ganache and smooth finishing glaze.', dummyShop: 'Celebration Cakes Studio', location: 'Hosur', price: 950, emoji: 'cake', img: 'https://tse2.mm.bing.net/th/id/OIP.RFIPPxLpOU7C0ryaVA5hMwHaHa?pid=Api&P=0&h=180' },
  { type: 'birthday', id_ref: 'Pineapple', name: 'Pineapple', category: 'cakes', description: 'Light pineapple cream cake with juicy fruit notes and soft sponge for celebrations.', dummyShop: 'Celebration Cakes Studio', location: 'Dharmapuri', price: 675, emoji: 'pineapple', img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785' },
  { type: 'birthday', id_ref: 'Chocoholic', name: 'Chocoholic', category: 'cakes', description: 'Loaded chocolate birthday cake with premium cocoa layers and indulgent frosting.', dummyShop: 'Celebration Cakes Studio', location: 'Salem', price: 900, emoji: 'brownie', img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267' },
  { type: 'birthday', id_ref: 'Black Forest', name: 'Black Forest', category: 'cakes', description: 'Classic black forest profile with chocolate sponge, whipped cream, and cherry notes.', dummyShop: 'Celebration Cakes Studio', location: 'Krishnagiri', price: 750, emoji: 'cake', img: 'https://sweetandsavorymeals.com/wp-content/uploads/2020/02/black-forest-cake-recipe-SweetAndSavoryMeals4-1054x1536.jpg' },
  { type: 'birthday', id_ref: 'Cheesecake', name: 'Cheesecake', category: 'cakes', description: 'Creamy baked cheesecake with a buttery base and smooth finish for premium occasions.', dummyShop: 'Celebration Cakes Studio', location: 'Hosur', price: 1200, emoji: 'cheesecake', img: 'https://www.inspiredtaste.net/wp-content/uploads/2024/03/New-York-Cheesecake-Recipe-1.jpg' },
];

const inMemoryProducts = STATIC_CATALOG.map((p, idx) => ({
  _id: `static_${p.type}_${p.id_ref || idx}`,
  ...p
}));

const inMemoryOrders = [];
const inMemoryOtps = [];
if (!MONGO_URI) {
  console.warn(
    'MONGO_URI is not set. Database-backed API routes will fail until it is configured.'
  );
}

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  if (!MONGO_URI) {
    console.warn('⚠️ MONGO_URI is not set. Operating in in-memory fallback mode.');
    isConnected = false;
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB');
    await seedProducts();
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ MongoDB connection failed. Operating in in-memory fallback mode. Error:', err.message);
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
  description: { type: String, default: '' },
  dummyShop: { type: String, default: '' },
  location: { type: String, default: '' },
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

await Product.insertMany(STATIC_CATALOG);
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

    if (!isConnected) {
      const now = new Date();
      for (let i = inMemoryOtps.length - 1; i >= 0; i--) {
        if (inMemoryOtps[i].expires_at < now) {
          inMemoryOtps.splice(i, 1);
        }
      }
      inMemoryOtps.forEach(record => {
        if (record.phone === phone) record.used = true;
      });

      const otp = generateOTP();
      const expires_at = new Date(Date.now() + 5 * 60 * 1000);
      inMemoryOtps.push({ phone, otp, expires_at, used: false, created_at: new Date() });

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
          console.error('Fast2SMS Error:', smsErr.response ? smsErr.response.data : smsErr.message);
        }
      } else {
        console.log(`[DEMO MODE] OTP for ${phone}: ${otp}`);
      }

      return res.json({ success: true, message: 'OTP sent successfully' });
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

    if (!isConnected) {
      const now = new Date();
      const record = inMemoryOtps
        .filter(r => r.phone === phone && r.otp === otp && !r.used && r.expires_at > now)
        .sort((a, b) => b.created_at - a.created_at)[0];

      if (!record) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      record.used = true;
      return res.json({ success: true, message: 'OTP verified' });
    }

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
    if (!isConnected) {
      return res.json({ success: true, products: inMemoryProducts });
    }

    const products = await Product.find().lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/products', adminAuth, async (req, res) => {
  try {
const {
  type,
  name,
  category,
  description,
  dummyShop,
  location,
  price,
  emoji,
  img,
} = req.body;

    if (!type || !name || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    if (!isConnected) {
      let id_ref;
      if (type === 'standard') {
        const standards = inMemoryProducts.filter(p => p.type === 'standard');
        const maxId = standards.reduce((max, p) => (typeof p.id_ref === 'number' && p.id_ref > max ? p.id_ref : max), 0);
        id_ref = maxId + 1;
      } else {
        id_ref = name;
      }

      const product = {
        _id: 'mem_' + Math.random().toString(36).substr(2, 9),
        type,
        id_ref,
        name,
        category,
        description: typeof description === 'string' ? description.trim() : '',
        dummyShop: typeof dummyShop === 'string' ? dummyShop.trim() : '',
        location: typeof location === 'string' ? location.trim() : '',
        price: Number(price),
        emoji,
        img,
      };

      inMemoryProducts.push(product);
      return res.json({ success: true, product });
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
      description: typeof description === 'string' ? description.trim() : '',
      dummyShop: typeof dummyShop === 'string' ? dummyShop.trim() : '',
      location: typeof location === 'string' ? location.trim() : '',
      price: Number(price),
      emoji,
      img,
    });

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.patch('/api/products/:id', adminAuth, async (req, res) => {
  try {
    const {
      price, name, img, description, dummyShop, location,
    } = req.body;
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
    if (description !== undefined) {
      updateData.description = String(description).trim();
    }
    if (dummyShop !== undefined) {
      updateData.dummyShop = String(dummyShop).trim();
    }
    if (location !== undefined) {
      updateData.location = String(location).trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'No valid fields provided for update',
        });
    }

    if (!isConnected) {
      const id = req.params.id;
      const product = inMemoryProducts.find(p => p._id === id || String(p.id_ref) === id || p.name === id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      Object.assign(product, updateData);
      return res.json({ success: true, product });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

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
    if (!isConnected) {
      const id = req.params.id;
      const idx = inMemoryProducts.findIndex(p => p._id === id || String(p.id_ref) === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      inMemoryProducts.splice(idx, 1);
      return res.json({ success: true, message: 'Product deleted' });
    }

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

    if (!isConnected) {
      const orderId = generateOrderId();
      const order = {
        order_id: orderId,
        customer_name,
        phone,
        address,
        city,
        pincode,
        items,
        total: Number(total),
        status: 'pending',
        payment_status: 'unpaid',
        notes: '',
        confirmed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      inMemoryOrders.push(order);
      return res.json({ success: true, order_id: orderId, message: 'Order placed successfully' });
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

    if (!isConnected) {
      let orders = [...inMemoryOrders];

      if (status && status !== 'all') {
        orders = orders.filter(o => o.status === status || o.payment_status === status);
      }

      orders.sort((a, b) => b.created_at - a.created_at);
      return res.json({ success: true, orders });
    }

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
    if (!isConnected) {
      const order = inMemoryOrders.find(o => o.order_id === req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.json({ success: true, order });
    }

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

app.patch('/api/orders/:orderId/confirm-payment', adminAuth, async (req, res) => {
  try {
    const { notes } = req.body;

    if (!isConnected) {
      const order = inMemoryOrders.find(o => o.order_id === req.params.orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      order.payment_status = 'paid';
      order.status = 'payment_confirmed';
      order.confirmed_at = new Date();
      order.notes = notes || 'Payment confirmed via WhatsApp';
      order.updated_at = new Date();

      return res.json({ success: true, message: 'Payment confirmed' });
    }

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

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
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

    if (!isConnected) {
      const order = inMemoryOrders.find(o => o.order_id === req.params.orderId);
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
    if (!isConnected) {
      const totalOrders = inMemoryOrders.length;
      const pendingOrders = inMemoryOrders.filter(o => o.status === 'pending').length;
      const paidOrders = inMemoryOrders.filter(o => o.payment_status === 'paid').length;
      const totalRevenue = inMemoryOrders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return res.json({
        success: true,
        stats: {
          total_orders: totalOrders,
          pending_orders: pendingOrders,
          paid_orders: paidOrders,
          total_revenue: totalRevenue,
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
