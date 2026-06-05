const express = require('express');
const router = express.Router();
const adminAuth = require('../../middlewares/adminAuth');
const validate = require('../middlewares/validate');
const orderSchema = require('../validators/orderValidator');
const {
  createOrder,
  getAllOrders,
  getOrder,
  confirmPayment,
  updateOrderStatus,
  getStats,
} = require('../controllers/orderController');
const { orderCreateLimiter, orderReadLimiter } = require('../services/rateLimiters');

// ─── Order creation: 10 orders / 15 min ─────────────────────────────────────
router.post('/', orderCreateLimiter, validate(orderSchema), createOrder);

// ─── Admin-only order listing (protected, no public rate limit needed) ───────
router.get('/', adminAuth, getAllOrders);
router.get('/stats', adminAuth, getStats);

// ─── Public order lookup: 120 reads / 15 min ────────────────────────────────
router.get('/:orderId', orderReadLimiter, getOrder);

// ─── Admin-only order mutations ──────────────────────────────────────────────
router.patch('/:orderId/confirm-payment', adminAuth, confirmPayment);
router.patch('/:orderId/status', adminAuth, updateOrderStatus);

module.exports = router;

