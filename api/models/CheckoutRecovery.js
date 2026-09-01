const mongoose = require('mongoose');

const CheckoutRecoverySchema = new mongoose.Schema({
  recovery_token: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  items: { type: [{
    id: String,
    name: String,
    price: Number,
    qty: Number,
    emoji: String,
    category: String,
    customizations: mongoose.Schema.Types.Mixed,
  }], required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
  order_id: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// TTL index: documents expire 24h after creation if still pending/expired
CheckoutRecoverySchema.index({ created_at: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('CheckoutRecovery', CheckoutRecoverySchema);
