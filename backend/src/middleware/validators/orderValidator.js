const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

// Validation for creating/updating an order
exports.validateOrder = [
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID format"),

  body("orderItems")
    .notEmpty()
    .withMessage("Order items are required")
    .isArray()
    .withMessage("Order items must be an array")
    .custom(
      (value) =>
        value.every((item) => mongoose.Types.ObjectId.isValid(item.productId)) // Assuming productId exists in orderItems
    )
    .withMessage("Each OrderItem productId must be a valid MongoId"),

  body("orderItems.*.productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid Product ID format"),

  body("orderItems.*.productName")
    .notEmpty()
    .withMessage("Product name is required")
    .isString()
    .withMessage("Product name must be a string"),

  body("orderItems.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("orderItems.*.price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("orderItems.*.total")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),

  body("subtotal")
    .notEmpty()
    .withMessage("Subtotal is required")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),

  body("tax")
    .notEmpty()
    .withMessage("Tax is required")
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),

  body("total")
    .notEmpty()
    .withMessage("Total is required")
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),

  body("status")
    .optional()
    .isIn([
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Payment Failed",
      "Refunded",
    ])
    .withMessage("Invalid status value"),

  body("addressId")
    .notEmpty()
    .withMessage("Address ID is required")
    .isMongoId()
    .withMessage("Invalid Address ID format"),

  body("paymentMethodId")
    .notEmpty()
    .withMessage("Payment Method ID is required")
    .isMongoId()
    .withMessage("Invalid Payment Method ID format"),

  body("orderDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid order date format"),

  body("deliveryDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid delivery date format"),

  body("deliveryTimeSlot")
    .optional()
    .isString()
    .withMessage("Delivery time slot must be a string"),

  body("isPickup")
    .optional()
    .isBoolean()
    .withMessage("isPickup must be a boolean value"),

  body("pickupLocation")
    .optional()
    .isString()
    .withMessage("Pickup location must be a string"),

  body("specialInstructions")
    .optional()
    .isString()
    .withMessage("Special instructions must be a string"),
];

// Validation for order ID parameter (for updating or deleting a specific order)
exports.validateOrderId = [
  param("id").isMongoId().withMessage("Invalid Order ID format"),
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
