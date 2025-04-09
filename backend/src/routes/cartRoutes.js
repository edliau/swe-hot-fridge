// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCartItems,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartTotal,
  transferGuestCart
} = require('../controllers/cartController');
const { protect, guestSession } = require('../middleware/authMiddleware');

// Apply guest session middleware to all routes
router.use(guestSession);

// Public routes that work for both guests and authenticated users
// Apply a modified protect middleware that allows guests
router.route('/items')
  .get(protect, getCartItems)
  .post(protect, addToCart)
  .delete(protect, clearCart);

router.route('/items/:productId')
  .put(protect, updateCartItem)
  .delete(protect, removeCartItem);

router.route('/total')
  .get(protect, getCartTotal);

// Protected route - requires authentication
router.post('/transfer', protect, transferGuestCart);

module.exports = router;