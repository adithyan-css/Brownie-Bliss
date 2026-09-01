const mongoose = require('mongoose');

const apiMetricSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      maxlength: 256,
    },
    method: {
      type: String,
      required: true,
      maxlength: 10,
    },
    status: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // duration in milliseconds
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// ── INDEXES ──────────────────────────────────────────────────────────────────
// Group and aggregate statistics by path & method
apiMetricSchema.index({ path: 1, method: 1, created_at: -1 });

// Auto-delete metrics older than 24 hours to keep the collection lightweight
apiMetricSchema.index({ created_at: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

module.exports = mongoose.model('ApiMetric', apiMetricSchema);
