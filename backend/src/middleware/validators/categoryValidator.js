const { body, param, validationResult } = require('express-validator');

// Create category
exports.validateCreateCategory = [
  body('name')
    .notEmpty().withMessage('Category name is required')
    .isString().withMessage('Category name must be a string'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),
  body('department')
    .notEmpty().withMessage('Department is required')
    .isString().withMessage('Department must be a string')
];

// Update category (similar to create but all optional)
exports.validateUpdateCategory = [
  body('name')
    .optional()
    .isString().withMessage('Category name must be a string'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),
  body('department')
    .optional()
    .isString().withMessage('Department must be a string')
];

// ID param validator
exports.validateCategoryIdParam = [
  param('id').isMongoId().withMessage('Invalid category ID')
];

// Handle errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
