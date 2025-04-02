const express = require("express");
const router = express.Router();
const orderItemController = require("../controllers/orderItemController");

// Add an order item
router.post("/order-items", orderItemController.addOrderItem);

// Get all order items for an order
router.get("/order-items/:orderId", orderItemController.getOrderItems);

// Update order item quantity
router.put("/order-items/:id", orderItemController.updateOrderItem);

// Remove order item
router.delete("/order-items/:id", orderItemController.removeOrderItem);

// Get total price for an order item
router.get("/order-items/total/:id", orderItemController.getOrderItemTotal);

module.exports = router;
