const mongoose = require('mongoose');

const customBoxSchema = new mongoose.Schema({
  boxSize: {
    type: Number,
    required: true,
    enum: [4, 6, 12]
  },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    emoji: { type: String },
    id: { type: String }
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  userId: {
    type: String,
    default: 'guest'
  },
  sessionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderId: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique order ID before saving
customBoxSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.orderId = `CUSTOM-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CustomBox', customBoxSchema);