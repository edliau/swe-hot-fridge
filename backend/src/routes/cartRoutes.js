// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCartItems,
  updateCartItem,
  removeCartItem,
  clearCart,
  transferGuestCart
} = require('../controllers/cartController');
const { protect, guestSession } = require('../middleware/authMiddleware');

// Apply guest session middleware to all routes
// This ensures that both logged-in users and guests can access cart functionality
router.use(guestSession);

router.route('/items')
  .get(getCartItems)
  .post(addToCart)
  .delete(clearCart);

router.route('/items/:productId')
  .put(updateCartItem)
  .delete(removeCartItem);

// Protected route - requires authentication
router.post('/transfer', protect, transferGuestCart);

module.exports = router;