const express = require('express');

const router = express.Router();

const adminAuth = require('../../middlewares/adminAuth');

const validate = require('../middlewares/validate');

const productSchema = require('../validators/productValidator');

const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

router.get('/', getAllProducts);

router.post(
  '/',
  adminAuth,
  validate(productSchema),
  createProduct
);

router.patch(
  '/:id',
  adminAuth,
  validate(productSchema),
  updateProduct
);

router.delete(
  '/:id',
  adminAuth,
  deleteProduct
);

module.exports = router;
