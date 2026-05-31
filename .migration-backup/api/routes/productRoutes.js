const express = require('express');
const router = express.Router();
const adminAuth = require('../../middlewares/adminAuth');
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

router.get('/', getAllProducts);
router.post('/', adminAuth, createProduct);
router.patch('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);

module.exports = router;
