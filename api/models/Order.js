const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  emoji: { type: String, default: '🍫' },
  category: { type: String },
  customizations: {
    dietary: { type: String, enum: ['egg', 'eggless'], default: 'egg' },
    toppings: [{ name: String, price: Number }],
    message: { type: String, default: '' },
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  order_id: { type: String, unique: true, required: true },
  customer_name: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'],
    default: 'pending',
  },
  payment_status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  notes: { type: String, default: '' },
  confirmed_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Order', orderSchema);
