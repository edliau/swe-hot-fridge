// middleware/validators/favouriteItemValidator.js
const { body, param, validationResult } = require('express-validator');

// Validator for adding to favorites
exports.validateAddToFavorites = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID format')
];

// Validator for favorite item ID
exports.validateFavoriteItemId = [
  param('id')
    .isMongoId().withMessage('Invalid favorite item ID format')
];

// Validator for checking product in favorites
exports.validateCheckFavorite = [
  param('productId')
    .isMongoId().withMessage('Invalid product ID format')
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};