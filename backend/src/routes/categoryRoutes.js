const express = require('express');
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { protect } = require('../middleware/authMiddleware');
// If admin role is implemented
// const { authorize } = require('../middleware/roleMiddleware');

const {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryIdParam,
  handleValidationErrors
} = require('../middleware/validators/categoryValidator');

// Public
router.route('/')
  .get(getCategories)
  .post(
    protect,
    // authorize('admin'), // optional
    validateCreateCategory,
    handleValidationErrors,
    createCategory
  );

router.route('/:id')
  .get(validateCategoryIdParam, handleValidationErrors, getCategory)
  .put(
    protect,
    // authorize('admin'), // optional
    validateCategoryIdParam,
    validateUpdateCategory,
    handleValidationErrors,
    updateCategory
  )
  .delete(
    protect,
    // authorize('admin'), // optional
    validateCategoryIdParam,
    handleValidationErrors,
    deleteCategory
  );

module.exports = router;
