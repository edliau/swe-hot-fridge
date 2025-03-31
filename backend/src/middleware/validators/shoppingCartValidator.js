const { body, param, validationResult } = require("express-validator");

// Validation for creating/updating a shopping cart
exports.validateShoppingCart = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID format"),

  body("items")
    .notEmpty()
    .withMessage("Items are required")
    .isArray()
    .withMessage("Items must be an array of cart items")
    .custom((items) => {
      // Ensure each item in the array has the required fields
      items.forEach((item) => {
        if (!item.productId || !item.quantity || !item.price) {
          throw new Error(
            "Each cart item must have productId, quantity, and price"
          );
        }
      });
      return true;
    }),

  body("totalAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total amount must be a positive number"),

  body("isGuest")
    .optional()
    .isBoolean()
    .withMessage("isGuest must be a boolean value"),

  body("sessionId")
    .optional()
    .isString()
    .withMessage("Session ID must be a string")
    .isLength({ min: 1 })
    .withMessage("Session ID must not be empty"),
];

// Validation for shopping cart ID parameter (for updating or deleting a specific shopping cart)
exports.validateShoppingCartId = [
  param("id").isMongoId().withMessage("Invalid Shopping Cart ID format"),
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
