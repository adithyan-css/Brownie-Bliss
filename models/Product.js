const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  type: { type: String, enum: ['standard', 'birthday'], required: true },
  id_ref: { type: mongoose.Schema.Types.Mixed }, // String or Number for reference
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  emoji: { type: String },
  img: { type: String }
});

// ── INDEXES ─────────────────────────────────────────────────────────────────
// Per-item price resolution during checkout: type + id_ref in one covered query
productSchema.index({ type: 1, id_ref: 1 });

module.exports = mongoose.model('Product', productSchema);
