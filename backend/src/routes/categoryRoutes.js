const express = require('express');
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategory
} = require('../controllers/categoryController');

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryIdParam,
  handleValidationErrors
} = require('../middleware/validators/categoryValidator');

// Public routes
router.route('/')
  .get(getCategories)
  .post(
    protect,
    authorize('admin'),
    validateCreateCategory,
    handleValidationErrors,
    createCategory
  );

router.route('/:id')
  .get(validateCategoryIdParam, handleValidationErrors, getCategory)
  .put(
    protect,
    authorize('admin'),
    validateCategoryIdParam,
    validateUpdateCategory,
    handleValidationErrors,
    updateCategory
  )
  .delete(
    protect,
    authorize('admin'),
    validateCategoryIdParam,
    handleValidationErrors,
    deleteCategory
  );

// Get products by category
router.route('/:id/products')
  .get(validateCategoryIdParam, handleValidationErrors, getProductsByCategory);

module.exports = router;