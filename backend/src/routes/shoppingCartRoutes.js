const express = require("express");
const router = express.Router();
const shoppingCartController = require("../controllers/shoppingCartController");

// Get user's shopping cart
router.get("/cart", shoppingCartController.getCart);

// Add item to cart
router.post("/cart", shoppingCartController.addItemToCart);

// Remove item from cart
router.delete("/cart/:productId", shoppingCartController.removeItemFromCart);

// Clear cart
router.delete("/cart/clear", shoppingCartController.clearCart);

// Update item quantity in cart
router.put("/cart/:productId", shoppingCartController.updateCartItem);

// Get total cart amount
router.get("/cart/total", shoppingCartController.getTotal);

// Convert cart to order
router.post("/cart/convert", shoppingCartController.convertToOrder);

module.exports = router;
