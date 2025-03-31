// middleware/validators/reviewValidator.js
const { body, param, validationResult } = require('express-validator');

exports.validateCreateReview = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid Product ID'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('text')
    .optional()
    .isString().withMessage('Text must be a string')
    .isLength({ max: 500 }).withMessage('Text cannot exceed 500 characters')
];

exports.validateUpdateReview = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('text')
    .optional()
    .isString().withMessage('Text must be a string')
    .isLength({ max: 500 }).withMessage('Text cannot exceed 500 characters')
];

exports.validateReviewId = [
  param('id').isMongoId().withMessage('Invalid review ID')
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
