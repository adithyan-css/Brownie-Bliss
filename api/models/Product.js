const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  type: { type: String, enum: ['standard', 'birthday'], required: true },
  id_ref: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  emoji: { type: String },
  img: { type: String },
  description: { type: String, default: '' },
});

const Product = mongoose.model('Product', productSchema);

const CATALOG = [
  { type: 'standard', id_ref: 1,  name: 'Velvet Dream Cake',    category: 'cakes',    price: 850,  emoji: '🎂', img: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&auto=format&fit=crop', description: 'Rich red velvet sponge with cream cheese frosting' },
  { type: 'standard', id_ref: 2,  name: 'Dutch Truffle Delight', category: 'cakes',   price: 950,  emoji: '🍰', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 3,  name: 'Pineapple Fresh Cream', category: 'cakes',   price: 675,  emoji: '🍍', img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 4,  name: 'Overload Brownie',      category: 'brownies', price: 120, emoji: '🍫', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 5,  name: 'Walnut Fudge',          category: 'brownies', price: 95,  emoji: '🥜', img: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 6,  name: 'Classic Choco',         category: 'brownies', price: 80,  emoji: '🍫', img: 'https://images.unsplash.com/photo-1589375681055-aa9716e4bdf0?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 7,  name: 'Chocolate Mousse',      category: 'desserts', price: 150, emoji: '🍮', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 8,  name: 'Tiramisu Jar',          category: 'desserts', price: 180, emoji: '☕',  img: 'https://images.unsplash.com/photo-1618426703623-c1b335803e07?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 9,  name: 'Choco Chip Cookies',    category: 'cookies',  price: 250, emoji: '🍪', img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop' },
  { type: 'standard', id_ref: 10, name: 'Almond Biscotti',       category: 'cookies',  price: 300, emoji: '🥖', img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop' },
  { type: 'birthday', id_ref: 'Red Velvet',    name: 'Red Velvet',    price: 850,  emoji: '🎂', img: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&auto=format&fit=crop' },
  { type: 'birthday', id_ref: 'Dutch Truffle', name: 'Dutch Truffle', price: 950,  emoji: '🍰', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop' },
  { type: 'birthday', id_ref: 'Pineapple',     name: 'Pineapple',     price: 675,  emoji: '🍍', img: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&auto=format&fit=crop' },
  { type: 'birthday', id_ref: 'Chocoholic',    name: 'Chocoholic',    price: 900,  emoji: '🍫', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop' },
  { type: 'birthday', id_ref: 'Black Forest',  name: 'Black Forest',  price: 750,  emoji: '🌲', img: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&auto=format&fit=crop' },
  { type: 'birthday', id_ref: 'Cheesecake',    name: 'Cheesecake',    price: 1200, emoji: '🧀', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop' },
];

async function seedProducts() {
  // Always upsert so broken/missing images in existing DB records get fixed
  await Product.bulkWrite(
    CATALOG.map(item => ({
      updateOne: {
        filter: { type: item.type, id_ref: item.id_ref },
        update: { $set: item },
        upsert: true,
      },
    }))
  );
  console.log('🌱 Product catalog synced to database');
}

module.exports = Product;
module.exports.seedProducts = seedProducts;
