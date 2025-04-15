const { body, param, validationResult } = require('express-validator');

// Create category
exports.validateCreateCategory = [
  body('name')
    .notEmpty().withMessage('Category name is required')
    .isString().withMessage('Category name must be a string')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('department')
    .notEmpty().withMessage('Department is required')
    .isString().withMessage('Department must be a string'),
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL')
    .isLength({ max: 255 }).withMessage('Image URL cannot exceed 255 characters'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value'),
  body('metaTitle')
    .optional()
    .isString().withMessage('Meta title must be a string')
    .isLength({ max: 100 }).withMessage('Meta title cannot exceed 100 characters'),
  body('metaDescription')
    .optional()
    .isString().withMessage('Meta description must be a string')
    .isLength({ max: 200 }).withMessage('Meta description cannot exceed 200 characters')
];

// Update category (similar to create but all optional)
exports.validateUpdateCategory = [
  body('name')
    .optional()
    .isString().withMessage('Category name must be a string')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('department')
    .optional()
    .isString().withMessage('Department must be a string'),
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL')
    .isLength({ max: 255 }).withMessage('Image URL cannot exceed 255 characters'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Display order must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value'),
  body('metaTitle')
    .optional()
    .isString().withMessage('Meta title must be a string')
    .isLength({ max: 100 }).withMessage('Meta title cannot exceed 100 characters'),
  body('metaDescription')
    .optional()
    .isString().withMessage('Meta description must be a string')
    .isLength({ max: 200 }).withMessage('Meta description cannot exceed 200 characters')
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