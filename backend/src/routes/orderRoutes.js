const express = require("express");
const router = express.Router();
const {
  createOrder,
  updateStatus,
  cancelOrder,
  processRefund,
  updateOrderAfterPayment,
} = require("../controllers/orderController");
const { protect, guestSession } = require("../middleware/authMiddleware");

// Apply guest session middleware to all routes
router.use(guestSession);

// Public routes that work for both guests and authenticated users
// Apply a modified protect middleware that allows guests

router.route("/").post(protect, createOrder);

router.route("/:id/status").put(protect, updateStatus);

router.route("/:id").delete(protect, cancelOrder);

router.route("/:id/refund").post(protect, processRefund);

router.route("/:id/payment").put(protect, updateOrderAfterPayment);

module.exports = router;
