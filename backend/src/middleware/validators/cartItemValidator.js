const { body, param, validationResult } = require("express-validator");

// Validation for creating/updating a cart item
exports.validateCartItem = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid Product ID format"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("total")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),
];

// Validation for cart item ID parameter (for updating or deleting a specific cart item)
exports.validateCartItemId = [
  param("id").isMongoId().withMessage("Invalid Cart Item ID format"),
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
