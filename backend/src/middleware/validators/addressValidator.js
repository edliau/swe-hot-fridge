const { body, validationResult } = require("express-validator");

// Validation for creating/updating an address
exports.validateAddress = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID format"),

  body("streetAddress")
    .notEmpty()
    .withMessage("Street address is required")
    .isLength({ min: 5 })
    .withMessage("Street address must be at least 5 characters long"),

  body("city")
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 3 })
    .withMessage("City must be at least 3 characters long"),

  body("state")
    .notEmpty()
    .withMessage("State/Province is required")
    .isLength({ min: 3 })
    .withMessage("State/Province must be at least 3 characters long"),

  body("postalCode")
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ min: 5, max: 10 })
    .withMessage("Postal code must be between 5 and 10 characters long"),

  body("country")
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2 })
    .withMessage("Country name must be at least 2 characters long"),

  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone()
    .withMessage("Invalid phone number format"),

  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),

  body("deliveryInstructions")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Delivery instructions must be less than 255 characters"),

  body("createdAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for createdAt")
    .toDate(),

  body("updatedAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for updatedAt")
    .toDate(),
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
