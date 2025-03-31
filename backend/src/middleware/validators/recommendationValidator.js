const { body, param, validationResult } = require("express-validator");

// Validation for creating/updating a recommendation
exports.validateRecommendation = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID format"),

  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid Product ID format"),

  body("type")
    .notEmpty()
    .withMessage("Recommendation type is required")
    .isIn(["personalized", "trending", "similar", "best_seller"])
    .withMessage(
      "Invalid recommendation type. Must be one of: personalized, trending, similar, best_seller"
    ),

  body("score")
    .notEmpty()
    .withMessage("Recommendation score is required")
    .isFloat({ min: 0 })
    .withMessage("Score must be a positive number or zero"),

  body("createdAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format for createdAt")
    .toDate(), // Ensure createdAt is a valid date if provided
];

// Validation for recommendation ID parameter (for updating or deleting a specific recommendation)
exports.validateRecommendationId = [
  param("id").isMongoId().withMessage("Invalid Recommendation ID format"),
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
