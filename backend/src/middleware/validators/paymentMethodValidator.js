const { body, param, validationResult } = require("express-validator");

// Validate creating a payment method
exports.validateCreatePaymentMethod = [
  body("paymentMethodId")
    .notEmpty()
    .withMessage("Payment method ID is required")
    .isString()
    .withMessage("Payment method ID must be a string"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be true or false"),

  body("billingDetails")
    .optional()
    .isObject()
    .withMessage("Billing details must be an object"),

  body("billingDetails.name")
    .optional()
    .isString()
    .withMessage("Cardholder name must be a string"),

  body("billingDetails.address.line1")
    .optional()
    .isString()
    .withMessage("Address line1 must be a string"),

  body("billingDetails.address.line2")
    .optional()
    .isString()
    .withMessage("Address line2 must be a string"),

  body("billingDetails.address.city")
    .optional()
    .isString()
    .withMessage("City must be a string"),

  body("billingDetails.address.state")
    .optional()
    .isString()
    .withMessage("State must be a string"),

  body("billingDetails.address.postal_code")
    .optional()
    .isString()
    .withMessage("Postal code must be a string"),

  body("billingDetails.address.country")
    .optional()
    .isString()
    .withMessage("Country must be a string"),
];

// Validate updating a payment method
exports.validateUpdatePaymentMethod = [
  body("isDefault")
    .notEmpty()
    .withMessage("isDefault is required")
    .isBoolean()
    .withMessage("isDefault must be true or false"),
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
