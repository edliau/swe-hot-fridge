const { body, validationResult } = require('express-validator');

exports.validateShoppingList = [
  body('name')
    .notEmpty().withMessage('List name is required')
    .isString().withMessage('List name must be a string'),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string'),

  body('items')
    .optional()
    .isArray().withMessage('Items must be an array'),
];

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
