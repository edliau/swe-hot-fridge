const express = require("express");
const router = express.Router();
const cartItemController = require("../controllers/cartItemController");
const { protect } = require("../middleware/authMiddleware"); // Optional: Add auth middleware if needed

// Public routes (no authentication required)
router.get("/:id/total", cartItemController.getTotal); // Get the total for a cart item

// Protected routes (authentication required)
router.post(
  "/",
  protect, // This ensures the user is authenticated
  cartItemController.addItem // Add item to cart
);

router.put(
  "/:id",
  protect, // This ensures the user is authenticated
  cartItemController.updateQuantity // Update item quantity in the cart
);

router.delete(
  "/:id",
  protect, // This ensures the user is authenticated
  cartItemController.removeItem // Remove item from the cart
);

router.put(
  "/:id/calculate-total",
  protect, // This ensures the user is authenticated
  cartItemController.calculateTotal // Calculate the total for the cart item
);

module.exports = router;
