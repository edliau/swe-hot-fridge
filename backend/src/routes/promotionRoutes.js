const express = require('express');
const router = express.Router();
const {
  createPromotion,
  getPromotions,
  updatePromotion,
  deletePromotion
} = require('../controllers/promotionController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateCreatePromotion,
  handleValidationErrors
} = require('../middleware/validators/promotionValidator');

// All routes are protected (you can add admin middleware if needed)
router.use(protect);

// Create & get promotions
router
  .route('/')
  .post(validateCreatePromotion, handleValidationErrors, createPromotion)
  .get(getPromotions);

// Update & delete
router
  .route('/:id')
  .put(validateCreatePromotion, handleValidationErrors, updatePromotion)
  .delete(deletePromotion);

module.exports = router;
