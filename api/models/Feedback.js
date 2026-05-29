const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['review', 'complaint'],
    required: true
  },
  // Common fields
  message: {
    type: String,
    required: true
  },
  // Review specific
  name: {
    type: String,
    required: function() { return this.type === 'review'; }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() { return this.type === 'review'; }
  },
  // Complaint specific
  subject: {
    type: String,
    required: function() { return this.type === 'complaint'; }
  },
  orderId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
