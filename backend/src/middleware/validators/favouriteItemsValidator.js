// middleware/validators/favouriteItemValidator.js
const { body, param, validationResult } = require('express-validator');

// Validator for adding to favourites
exports.validateAddTofavourites = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID format')
];

// Validator for favourite item ID
exports.validatefavouriteItemId = [
  param('id')
    .isMongoId().withMessage('Invalid favourite item ID format')
];

// Validator for checking product in favourites
exports.validateCheckfavourite = [
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