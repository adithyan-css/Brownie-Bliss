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

async function seedProducts() {
  const count = await Product.countDocuments();
  
  const initialProducts = [
    // Standard Products
    { type: 'standard', id_ref: 1, name: 'Velvet Dream Cake', category: 'cakes', price: 850, emoji: '🎂', img: 'assets/velvet_dream_cake.png', description: 'Rich chocolate brownie with overload toppings' },
    { type: 'standard', id_ref: 2, name: 'Dutch Truffle Delight', category: 'cakes', price: 950, emoji: '🍰', img: 'assets/dutch_truffle.png' },
    { type: 'standard', id_ref: 3, name: 'Pineapple Fresh Cream', category: 'cakes', price: 675, emoji: '🍍', img: 'assets/pineapple_fresh_cream.png' },
    { type: 'standard', id_ref: 4, name: 'Overload Brownie', category: 'brownies', price: 120, emoji: '🍫', img: 'assets/overload_brownie.png' },
    { type: 'standard', id_ref: 5, name: 'Walnut Fudge', category: 'brownies', price: 95, emoji: '🥜', img: 'assets/walnut_fudge.png' },
    { type: 'standard', id_ref: 6, name: 'Classic Choco', category: 'brownies', price: 80, emoji: '🍫', img: 'assets/classic_choco.png' },
    { type: 'standard', id_ref: 7, name: 'Chocolate Mousse', category: 'desserts', price: 150, emoji: '🍮', img: 'assets/chocolate_mousse.png' },
    { type: 'standard', id_ref: 8, name: 'Tiramisu Jar', category: 'desserts', price: 180, emoji: '☕', img: 'assets/tiramisu_jar.png' },
    { type: 'standard', id_ref: 9, name: 'Choco Chip Cookies', category: 'cookies', price: 250, emoji: '🍪', img: 'assets/choco_chip_cookies.png' },
    { type: 'standard', id_ref: 10, name: 'Almond Biscotti', category: 'cookies', price: 300, emoji: '🥖', img: 'assets/almond_biscotti.png' },
    // Birthday Cakes (base price per kg)
    { type: 'birthday', id_ref: 'Red Velvet', name: 'Red Velvet', price: 850, emoji: '🎂', img: 'assets/velvet_dream_cake.png' },
    { type: 'birthday', id_ref: 'Dutch Truffle', name: 'Dutch Truffle', price: 950, emoji: '🍰', img: 'assets/dutch_truffle.png' },
    { type: 'birthday', id_ref: 'Pineapple', name: 'Pineapple', price: 675, emoji: '🍍', img: 'assets/pineapple_fresh_cream.png' },
    { type: 'birthday', id_ref: 'Chocoholic', name: 'Chocoholic', price: 900, emoji: '🍫', img: 'assets/chocoholic_cake.png' },
    { type: 'birthday', id_ref: 'Black Forest', name: 'Black Forest', price: 750, emoji: '🌲', img: 'assets/black_forest.png' },
    { type: 'birthday', id_ref: 'Cheesecake', name: 'Cheesecake', price: 1200, emoji: '🧀', img: 'assets/cheesecake.png' },
  ];

  if (count === 0) {
    await Product.insertMany(initialProducts);
    console.log('🌱 Seeded initial products to database');
  } else {
    // Dynamically update existing products if they use outdated/broken image links
    for (const item of initialProducts) {
      await Product.updateOne(
        { name: item.name, type: item.type },
        { $set: { img: item.img } }
      );
    }
    console.log('🌱 Synced and updated database product images');
  }
}

module.exports = Product;
module.exports.seedProducts = seedProducts;
