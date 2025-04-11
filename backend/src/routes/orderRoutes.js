const express = require("express");
const router = express.Router();
const {
  getUserOrders,
  getOrderById,
  createOrder,
  getOrderItems,
  updateOrderItem,
  removeOrderItem,
  getOrderTotal,
  updateStatus,
  cancelOrder,
  processRefund,
  createOrderFromCart
} = require("../controllers/orderController");
const { protect, guestSession } = require("../middleware/authMiddleware");

// Apply guest session middleware to all routes and use modified protect middleware
router.use(guestSession);

// Public routes that work for both guests and authenticated users

router.route("/").get(protect, getUserOrders); // Get all orders for the logged-in user

router.route("/:id").get(protect, getOrderById); // Get a specific order by ID

router.route("/").post(protect, createOrder); // Create an order (both guests and users allowed)

router.route("/:orderId/items").get(protect, getOrderItems); // Get order items (both guests and users allowed)

router.route("/:orderId/total").get(protect, getOrderTotal); // Get total price of the order (both guests and users allowed)

router.route("/:id/status").put(protect, updateStatus); // Update order status (both guests and users allowed)

router.route("/:id").delete(protect, cancelOrder); // Cancel order (both guests and users allowed)

router.route("/:id/refund").post(protect, processRefund); // Process refund (both guests and users allowed)

// Order item manipulation (update and remove)
router.route("/:orderId/item").put(protect, updateOrderItem); // Update order item quantity (both guests and users allowed)
router.route("/:orderId/item").delete(protect, removeOrderItem); // Remove item from order (both guests and users allowed)

// Create order from cart
router.route("/from-cart").post(protect, createOrderFromCart); //create order from user's cart

module.exports = router;
