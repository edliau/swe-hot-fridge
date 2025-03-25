const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productValidator = require('../middleware/validators/productValidator');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/on-sale', productController.getProductsOnSale);
router.get('/:id', productValidator.validateProductId, productController.getProductById);
router.get('/:id/ratings', productValidator.validateProductId, productController.getProductRatings);

// Protected routes (requires authentication)
router.post(
  '/:id/ratings',
  protect,
  productValidator.validateProductId,
  productValidator.validateProductRating,
  productValidator.handleValidationErrors,
  productController.addProductRating
);

// Admin routes (requires admin role)
router.post(
  '/',
  protect,
  authorize('admin'),
  productValidator.validateProduct,
  productValidator.handleValidationErrors,
  productController.createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  productValidator.validateProductId,
  productValidator.validateProduct,
  productValidator.handleValidationErrors,
  productController.updateProduct
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  productValidator.validateProductId,
  productController.deleteProduct
);

module.exports = router;