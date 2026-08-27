const Order = require('../models/Order');
const Product = require('../models/Product');
const { isDbReady } = require('../config/db');
const {
  sendOrderReceiptEmail,
  isValidEmail,
  normalizeEmail,
} = require('../email/mailer');

const memoryOrders = [];

const ALLOWED_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'delivered',
  'cancelled',
];

const STATIC_CATALOG = [
  {
    type: 'standard',
    id_ref: 1,
    name: 'Velvet Dream Cake',
    category: 'cakes',
    price: 850,
    emoji: '🎂',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'standard',
    id_ref: 2,
    name: 'Dutch Truffle Delight',
    category: 'cakes',
    price: 950,
    emoji: '🍰',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'standard',
    id_ref: 3,
    name: 'Pineapple Fresh Cream',
    category: 'cakes',
    price: 675,
    emoji: '🍍',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'standard',
    id_ref: 4,
    name: 'Overload Brownie',
    category: 'brownies',
    price: 120,
    emoji: '🍫',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'standard',
    id_ref: 5,
    name: 'Walnut Fudge',
    category: 'brownies',
    price: 95,
    emoji: '🥜',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'standard',
    id_ref: 6,
    name: 'Classic Choco',
    category: 'brownies',
    price: 80,
    emoji: '🍫',
    img: 'assets/classic_choco.png',
  },
  {
    type: 'standard',
    id_ref: 7,
    name: 'Chocolate Mousse',
    category: 'desserts',
    price: 150,
    emoji: '🍮',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'standard',
    id_ref: 8,
    name: 'Tiramisu Jar',
    category: 'desserts',
    price: 180,
    emoji: '☕',
    img: 'assets/tiramisu_jar.png',
  },
  {
    type: 'standard',
    id_ref: 9,
    name: 'Choco Chip Cookies',
    category: 'cookies',
    price: 250,
    emoji: '🍪',
    img: 'assets/choco_chip_cookies.png',
  },
  {
    type: 'standard',
    id_ref: 10,
    name: 'Almond Biscotti',
    category: 'cookies',
    price: 300,
    emoji: '🥖',
    img: 'assets/almond_biscotti.png',
  },
  {
    type: 'birthday',
    id_ref: 'Red Velvet',
    name: 'Red Velvet',
    price: 850,
    emoji: '🎂',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'birthday',
    id_ref: 'Dutch Truffle',
    name: 'Dutch Truffle',
    price: 950,
    emoji: '🍰',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'birthday',
    id_ref: 'Pineapple',
    name: 'Pineapple',
    price: 675,
    emoji: '🍍',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'birthday',
    id_ref: 'Chocoholic',
    name: 'Chocoholic',
    price: 900,
    emoji: '🍫',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'birthday',
    id_ref: 'Black Forest',
    name: 'Black Forest',
    price: 750,
    emoji: '🌲',
    img: 'assets/dutch_truffle.png',
  },
  {
    type: 'birthday',
    id_ref: 'Cheesecake',
    name: 'Cheesecake',
    price: 1200,
    emoji: '🧀',
    img: 'assets/dutch_truffle.png',
  },
];

function generateOrderId() {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BB-${datePart}-${rand}`;
}

async function resolveItemPrice(item) {
  const isReady = isDbReady();
  const birthdayMatch = String(item.id || '').match(
    /^bday-(.+)-(\d+(?:\.\d+)?)$/
  );

  if (birthdayMatch) {
    const flavor = birthdayMatch[1];
    const weight = parseFloat(birthdayMatch[2]);

    if (isNaN(weight) || weight <= 0) {
      throw new Error(`Invalid weight for birthday cake: ${item.name}`);
    }

    let product;
    if (isReady) {
      product = await Product.findOne({
        type: 'birthday',
        id_ref: flavor,
      }).lean();
    } else {
      product = STATIC_CATALOG.find(
        (p) => p.type === 'birthday' && p.id_ref === flavor
      );
    }

    if (!product) {
      throw new Error(`Birthday cake flavor not found: "${flavor}"`);
    }

    const weightTiers = { 0.5: 450, 1.0: 850, 1.5: 1250, 2.0: 1600 };
    const resolvedPrice = weightTiers[weight];

    if (resolvedPrice === undefined) {
      throw new Error(
        `Unsupported weight option (${weight}kg) for "${item.name}"`
      );
    }

    return { resolvedPrice, product };
  }

  const numericId = Number(item.id);
  if (!item.id || isNaN(numericId)) {
    throw new Error(`Missing or invalid product ID for item: "${item.name}"`);
  }

  let product;
  if (isReady) {
    product = await Product.findOne({
      type: 'standard',
      id_ref: numericId,
    }).lean();
  } else {
    product = STATIC_CATALOG.find(
      (p) => p.type === 'standard' && p.id_ref === numericId
    );
  }

  if (!product) {
    throw new Error(`Product not found for ID ${numericId} ("${item.name}")`);
  }

  return { resolvedPrice: product.price, product };
}

async function createOrder(req, res) {
  try {
    const {
      customer_name,
      phone,
      address,
      city,
      pincode,
      items,
      total,
      email,
    } = req.body;

    const sanitizedCustomerName = String(customer_name).trim().slice(0, 120);

    const sanitizedAddress = String(address).trim().slice(0, 500);

    const sanitizedCity = String(city).trim().slice(0, 80);

    const sanitizedPincode = String(pincode).trim().slice(0, 12);

    if (!customer_name || !phone || !address || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Missing delivery or contact details',
      });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Your cart has no items' });
    }

    const phoneDigits = String(phone).replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid phone number' });
    }

    let customerEmail = normalizeEmail(email);
    if (customerEmail && !isValidEmail(customerEmail)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid email address' });
    }

    // ── PRICE VERIFICATION ──────────────────────────────────────────────────────
    const verifiedItems = [];
    let serverTotal = 0;

    for (const item of items) {
      if (!Number.isFinite(qtyRaw) || qtyRaw <= 0 || qtyRaw > 999) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for "${item.name}"`,
        });
      }

      const qty = qtyRaw;

      let resolvedPrice, product;
      try {
        ({ resolvedPrice, product } = await resolveItemPrice(item));
      } catch (lookupErr) {
        return res
          .status(422)
          .json({ success: false, message: lookupErr.message });
      }

      serverTotal += resolvedPrice * qty;

      verifiedItems.push({
        id: item.id,
        name: product.name,
        price: resolvedPrice,
        qty,
        emoji: product.emoji || item.emoji || '🍫',
        category: product.category || item.category || 'general',
        customizations: item.customizations || null,
      });
    }

    // ── TOTAL CROSS-CHECK ───────────────────────────────────────────────────────
    const computedTotal = verifiedItems.reduce(
      (s, i) => s + i.price * i.qty,
      0
    );
    const clientTotal = Number(total);
    const finalTotal =
      Number.isFinite(clientTotal) && Math.abs(clientTotal - computedTotal) <= 2
        ? Math.round(clientTotal * 100) / 100
        : Math.round(computedTotal * 100) / 100;

    const order_id = generateOrderId();
    const orderDoc = {
      order_id,
      customer_name: sanitizedCustomerName,
      email: customerEmail,
      phone: phoneDigits.slice(0, 15),
      address: sanitizedAddress,
      city: sanitizedCity,
      pincode: sanitizedPincode,
      items: verifiedItems,
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
        message:
          'Order placed successfully (memory mode — add MONGO_URI to persist orders in MongoDB).',
      });
    }

    const order = await Order.create(orderDoc);
    res.json({
      success: true,
      order_id: order.order_id,
      message: 'Order placed successfully',
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: err.message || 'Server error' });
  }
}

async function getAllOrders(req, res) {
  try {
    const { status, search, from, to } = req.query;

    if (!isDbReady()) {
      let list = [...memoryOrders];
      if (status && status !== 'all') {
        list = list.filter(
          (o) => o.status === status || o.payment_status === status
        );
      }
      return res.json({ success: true, orders: list });
    }

    const conditions = [];

    if (status && status !== 'all') {
      conditions.push({ $or: [{ status }, { payment_status: status }] });
    }

    if (search && search.trim() !== '') {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      conditions.push({
        $or: [
          { customer_name: searchRegex },
          { phone: searchRegex },
          { order_id: searchRegex },
        ],
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
}

async function getOrder(req, res) {
  try {
    if (!isDbReady()) {
      const order = memoryOrders.find((o) => o.order_id === req.params.orderId);
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: 'Order not found' });
      return res.json({ success: true, order });
    }
    const order = await Order.findOne({ order_id: req.params.orderId }).lean();
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function confirmPayment(req, res) {
  try {
    const { notes, email: emailFromBody } = req.body;

    if (!isDbReady()) {
      const order = memoryOrders.find((o) => o.order_id === req.params.orderId);
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: 'Order not found' });

      order.payment_status = 'paid';
      order.status = 'confirmed';
      order.confirmed_at = new Date();
      order.notes =
        typeof notes === 'string'
          ? notes.trim().slice(0, 300)
          : 'Payment confirmed via WhatsApp';
      order.updated_at = new Date();

      const bodyEmail = normalizeEmail(emailFromBody);
      if (bodyEmail) {
        if (!isValidEmail(bodyEmail)) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid email address' });
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
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });

    const update = {
      payment_status: 'paid',
      status: 'confirmed',
      confirmed_at: new Date(),
      notes:
        typeof notes === 'string'
          ? notes.trim().slice(0, 300)
          : 'Payment confirmed via WhatsApp',
    };

    const bodyEmail = normalizeEmail(emailFromBody);
    if (bodyEmail) {
      if (!isValidEmail(bodyEmail)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid email address' });
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
    res
      .status(500)
      .json({ success: false, message: err.message || 'Server error' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    if (!ALLOWED_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    if (!isDbReady()) {
      const order = memoryOrders.find((o) => o.order_id === req.params.orderId);
      if (!order)
        return res
          .status(404)
          .json({ success: false, message: 'Order not found' });
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function getStats(req, res) {
  try {
    if (!isDbReady()) {
      const total_orders = memoryOrders.length;
      const pending_orders = memoryOrders.filter(
        (o) => o.status === 'pending'
      ).length;
      const paid_orders = memoryOrders.filter(
        (o) => o.payment_status === 'paid'
      ).length;
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
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrder,
  confirmPayment,
  updateOrderStatus,
  getStats,
};
