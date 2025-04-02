const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Create a new order
router.post("/orders", orderController.createOrder);

// Update order status
router.put("/orders/:id/status", orderController.updateStatus);

// Cancel an order
router.delete("/orders/:id", orderController.cancelOrder);

// Process a refund
router.post("/orders/:id/refund", orderController.processRefund);

module.exports = router;
