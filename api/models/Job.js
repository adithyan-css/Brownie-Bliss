const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'sendEmail', 'generateReceipt', 'logAudit', 'trackMetric'
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'dead'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  nextRetryAt: { type: Date, default: Date.now },
  errorMessage: { type: String },
}, { timestamps: true });

// TTL index to auto‑remove jobs that are no longer needed after 7 days
JobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { status: { $in: ['completed', 'failed', 'dead'] } } });

module.exports = mongoose.model('Job', JobSchema);
