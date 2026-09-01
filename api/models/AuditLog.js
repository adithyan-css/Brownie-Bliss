const mongoose = require('mongoose');

/**
 * AuditLog — immutable record of every critical admin action.
 *
 * Fields:
 *   actor      – who performed the action (admin username or "system")
 *   action     – what happened (e.g. ADMIN_LOGIN, ORDER_STATUS_CHANGED)
 *   resource   – resource type affected (e.g. "order", "session")
 *   resourceId – ID of the affected record (e.g. order_id)
 *   metadata   – free-form object with before/after state, notes, etc.
 *   ip         – originating IP address for security investigations
 *   created_at – immutable timestamp (set by Mongoose, never updated)
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor:      { type: String, required: true, maxlength: 120 },
    action:     {
      type: String,
      required: true,
      enum: [
        'ADMIN_LOGIN',
        'ADMIN_LOGIN_FAILED',
        'ORDER_STATUS_CHANGED',
        'PAYMENT_CONFIRMED',
        'ORDER_VIEWED',
      ],
    },
    resource:   { type: String, required: true, maxlength: 60 },
    resourceId: { type: String, default: null, maxlength: 120 },
    metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
    ip:         { type: String, default: null, maxlength: 64 },
  },
  {
    // Only createdAt — audit logs are never updated
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// ── INDEXES ──────────────────────────────────────────────────────────────────
// Most-recent-first for admin audit viewer
auditLogSchema.index({ created_at: -1 });

// Lookup all actions by a specific actor
auditLogSchema.index({ actor: 1, created_at: -1 });

// Look up all audit trail for a specific resource record (e.g. an order)
auditLogSchema.index({ resource: 1, resourceId: 1, created_at: -1 });

// Auto-delete audit logs older than 90 days to manage storage
auditLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
