// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productValidator = require('../middleware/validators/productValidator');
const { protect, authorize } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

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

// Updated route to use the partial validator for product updates
router.put(
  '/:id',
  protect,
  authorize('admin'),
  productValidator.validateProductId,
  productValidator.validatePartialProductUpdate, // Using our new partial validator
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

// Stock update route
router.patch(
  '/:id/stock',
  protect,
  authorize('admin'),
  productValidator.validateProductId,
  [
    body('stockQuantity')
      .notEmpty().withMessage('Stock quantity is required')
      .isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
  ],
  productValidator.handleValidationErrors,
  productController.updateProductStock
);

module.exports = router;