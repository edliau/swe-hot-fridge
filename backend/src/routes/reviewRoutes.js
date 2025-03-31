// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const {
  addReview,
  getProductReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

const { protect } = require('../middleware/authMiddleware');
const {
  validateCreateReview,
  validateUpdateReview,
  validateReviewId,
  handleValidationErrors
} = require('../middleware/validators/reviewValidator');

// Public route
router.get('/product/:productId', getProductReviews);

// Protected routes
router.use(protect);

router.post('/', validateCreateReview, handleValidationErrors, addReview);

router.route('/:id')
  .put(validateReviewId, validateUpdateReview, handleValidationErrors, updateReview)
  .delete(validateReviewId, handleValidationErrors, deleteReview);

module.exports = router;
