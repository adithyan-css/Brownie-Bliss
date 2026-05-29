const Feedback = require('../models/Feedback');
const { isDbReady } = require('../config/db');

// In-memory fallback
const memoryFeedbacks = [];

exports.submitReview = async (req, res) => {
  try {
    const { name, rating, message } = req.body;
    if (!name || !rating || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!isDbReady()) {
      const review = { type: 'review', name, rating, message, createdAt: new Date() };
      memoryFeedbacks.push(review);
      return res.status(201).json({ success: true, message: 'Review submitted successfully (Memory)', data: review });
    }

    const review = new Feedback({
      type: 'review',
      name,
      rating,
      message
    });

    await review.save();
    res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.submitComplaint = async (req, res) => {
  try {
    const { subject, orderId, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!isDbReady()) {
      const complaint = { type: 'complaint', subject, orderId, message, createdAt: new Date() };
      memoryFeedbacks.push(complaint);
      return res.status(201).json({ success: true, message: 'Complaint submitted successfully (Memory)', data: complaint });
    }

    const complaint = new Feedback({
      type: 'complaint',
      subject,
      orderId,
      message
    });

    await complaint.save();
    res.status(201).json({ success: true, message: 'Complaint submitted successfully', data: complaint });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getReviews = async (req, res) => {
  try {
    let reviews = [];
    if (!isDbReady()) {
      reviews = memoryFeedbacks.filter(f => f.type === 'review');
    } else {
      reviews = await Feedback.find({ type: 'review' }).sort({ createdAt: -1 }).lean();
    }
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
