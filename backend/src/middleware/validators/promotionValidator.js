const { body, validationResult } = require('express-validator');

exports.validateCreatePromotion = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('discountPercent')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount percent must be between 0 and 100'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount amount must be a non-negative number'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isISO8601().withMessage('End date must be a valid date'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be true or false'),
  body('applicableProducts')
    .optional()
    .isArray().withMessage('Applicable products must be an array of IDs'),
  body('applicableCategories')
    .optional()
    .isArray().withMessage('Applicable categories must be an array of IDs'),
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
