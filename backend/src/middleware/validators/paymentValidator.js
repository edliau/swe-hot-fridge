// middleware/validators/paymentValidator.js
const { body, validationResult } = require('express-validator');

// Validate payment intent creation
exports.validateCreatePaymentIntent = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID format'),
    
  body('paymentMethodId')
    .optional()
    .isMongoId().withMessage('Invalid payment method ID format'),
    
  body('savePaymentMethod')
    .optional()
    .isBoolean().withMessage('savePaymentMethod must be true or false')
];

// Validate refund request
exports.validateRefund = [
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID format'),
    
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    
  body('reason')
    .optional()
    .isIn(['duplicate', 'fraudulent', 'requested_by_customer', 'abandoned']).withMessage('Invalid refund reason')
];

// Handle validation errors middleware
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