const Product = require('../models/Product');
const { isDbReady } = require('../config/db');

const STATIC_CATALOG = [
  {
    type: 'standard',
    id_ref: 1,
    name: 'Velvet Dream Cake',
    category: 'cakes',
    price: 850,
    emoji: '🎂',
    img: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&auto=format&fit=crop',
  },
  {
    type: 'standard',
    id_ref: 2,
    name: 'Dutch Truffle Delight',
    category: 'cakes',
    price: 950,
    emoji: '🍰',
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop',
  },
  {
    type: 'standard',
    id_ref: 3,
    name: 'Pineapple Fresh Cream',
    category: 'cakes',
    price: 675,
    emoji: '🍍',
    img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop',
  },
  {
    type: 'standard',
    id_ref: 4,
    name: 'Overload Brownie',
    category: 'brownies',
    price: 120,
    emoji: '🍫',
    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop',
  },
  {
    type: 'standard',
    id_ref: 5,
    name: 'Walnut Fudge',
    category: 'brownies',
    price: 95,
    emoji: '🥜',
    img: 'assets/almond_biscotti.png',
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
    img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop',
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
    img: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&auto=format&fit=crop',
  },
  {
    type: 'birthday',
    id_ref: 'Dutch Truffle',
    name: 'Dutch Truffle',
    price: 950,
    emoji: '🍰',
    img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop',
  },
  {
    type: 'birthday',
    id_ref: 'Pineapple',
    name: 'Pineapple',
    price: 675,
    emoji: '🍍',
    img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop',
  },
  {
    type: 'birthday',
    id_ref: 'Chocoholic',
    name: 'Chocoholic',
    price: 900,
    emoji: '🍫',
    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop',
  },
  {
    type: 'birthday',
    id_ref: 'Black Forest',
    name: 'Black Forest',
    price: 750,
    emoji: '🌲',
    img: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&auto=format&fit=crop',
  },
  {
    type: 'birthday',
    id_ref: 'Cheesecake',
    name: 'Cheesecake',
    price: 1200,
    emoji: '🧀',
    img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop',
  },
];

async function getAllProducts(req, res) {
  try {
    if (!isDbReady()) {
      return res.json({ success: true, products: STATIC_CATALOG });
    }
    const products = await Product.find().lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function createProduct(req, res) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'Product admin requires MongoDB (set MONGO_URI).',
      });
    }

    const { type, name, category, price, emoji, img, description } = req.body;

    const sanitizedName = name.trim();

    const sanitizedCategory = category?.trim();

    const sanitizedEmoji = emoji?.trim();

    const sanitizedImg = img?.trim();

    const sanitizedDescription = description?.trim();

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
      name: sanitizedName,
      category: sanitizedCategory,
      price: Number(price),
      emoji: sanitizedEmoji,
      img: sanitizedImg,
      description: sanitizedDescription,
    });

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function updateProduct(req, res) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'Product admin requires MongoDB (set MONGO_URI).',
      });
    }

    const { price, name, img, description, category } = req.body;

    const updateData = {};

    if (price !== undefined && !isNaN(price) && Number(price) > 0) {
      updateData.price = Number(price);
    }

    if (typeof name === 'string' && name.trim() !== '') {
      updateData.name = name.trim();
    }

    if (typeof img === 'string' && img.trim() !== '') {
      updateData.img = img.trim();
    }

    if (typeof description === 'string') {
      updateData.description = description.trim();
    }

    if (typeof category === 'string') {
      updateData.category = category.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update',
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function deleteProduct(req, res) {
  try {
    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'Product admin requires MongoDB (set MONGO_URI).',
      });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
