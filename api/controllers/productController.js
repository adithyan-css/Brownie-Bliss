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
    img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860',
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
    img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785',
  },
  {
    type: 'standard',
    id_ref: 4,
    name: 'Overload Brownie',
    category: 'brownies',
    price: 120,
    emoji: '🍫',
    img: 'https://theobroma.in/cdn/shop/files/OverloadBrownie_400x400.jpg?v=1711183338',
  },
  {
    type: 'standard',
    id_ref: 5,
    name: 'Walnut Fudge',
    category: 'brownies',
    price: 95,
    emoji: '🥜',
    img: 'https://theobroma.in/cdn/shop/files/WalnutBrownie_400x400.jpg?v=1711183181',
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
    img: 'https://theobroma.in/cdn/shop/files/Delicacies-04.jpg?v=1681320427',
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
    img: 'https://theobroma.in/cdn/shop/files/redvelvet-theo.jpg?v=1701321860',
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
    img: 'https://theobroma.in/cdn/shop/files/FreshCreamPineappleCakehalfkg_5e299618-cc46-4daf-953d-65616ca0299f_400x400.jpg?v=1711124785',
  },
  {
    type: 'birthday',
    id_ref: 'Chocoholic',
    name: 'Chocoholic',
    price: 900,
    emoji: '🍫',
    img: 'https://theobroma.in/cdn/shop/files/ChocoholicPastry_400x400.jpg?v=1711096267',
  },
  {
    type: 'birthday',
    id_ref: 'Black Forest',
    name: 'Black Forest',
    price: 750,
    emoji: '🌲',
    img: 'https://theobroma.in/cdn/shop/files/BlackForestCakehalfkg_Square_400x400.jpg?v=1711124458',
  },
  {
    type: 'birthday',
    id_ref: 'Cheesecake',
    name: 'Cheesecake',
    price: 1200,
    emoji: '🧀',
    img: 'https://theobroma.in/cdn/shop/files/BlueberryCheesecakeCup_400x400.jpg?v=1711514632',
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
