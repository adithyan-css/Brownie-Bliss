const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema(
  {
    event_type: {
      type: String,
      required: true,
      enum: [
        'failed_login',
        'rate_limit_violation',
        'otp_abuse',
        'suspicious_order',
        'email_delivery_failure',
        'database_failure',
        'unhandled_exception',
        'order_failure'
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    ip: {
      type: String,
      default: null,
      maxlength: 64,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// ── INDEXES ──────────────────────────────────────────────────────────────────
// Most-recent-first for admin monitoring
securityEventSchema.index({ created_at: -1 });

// Query by event type for stats filtering
securityEventSchema.index({ event_type: 1, created_at: -1 });

// Auto-delete security events older than 90 days to manage storage
securityEventSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
