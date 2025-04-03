const express = require("express");
const router = express.Router();
const shoppingCartController = require("../controllers/shoppingCartController");

// Get user's shopping cart
router.get("/", shoppingCartController.getCart);

// Add item to cart
router.post("/", shoppingCartController.addItemToCart);

// Remove item from cart
router.delete("/:productId", shoppingCartController.removeItemFromCart);

// Clear cart
router.delete("/clear", shoppingCartController.clearCart);

// Update item quantity in cart
router.put("/:productId", shoppingCartController.updateCartItem);

// Get total cart amount
router.get("/total", shoppingCartController.getTotal);

// Convert cart to order
router.post("/convert", shoppingCartController.convertToOrder);

module.exports = router;
