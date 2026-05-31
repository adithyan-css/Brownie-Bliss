const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const adminAuth = require('../../middlewares/adminAuth');
const {
  createOrder,
  getAllOrders,
  getOrder,
  confirmPayment,
  updateOrderStatus,
  getStats,
} = require('../controllers/orderController');

const orderCreationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many order requests from this IP, please try again after 15 minutes' },
});

router.post('/', orderCreationRateLimiter, createOrder);
router.get('/', adminAuth, getAllOrders);
router.get('/stats', adminAuth, getStats);
router.get('/:orderId', getOrder);
router.patch('/:orderId/confirm-payment', adminAuth, confirmPayment);
router.patch('/:orderId/status', adminAuth, updateOrderStatus);

module.exports = router;
