const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { userId, orderItems, addressId, paymentMethodId, tax } = req.body;

    let subtotal = 0;
    for (const itemId of orderItems) {
      const item = await OrderItem.findById(itemId);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Order item not found" });
      }
      subtotal += item.total;
    }

    const total = subtotal + tax;

    const order = new Order({
      userId,
      orderItems,
      subtotal,
      tax,
      total,
      addressId,
      paymentMethodId,
    });

    await order.save();
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update order status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order status updated", data: order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "Shipped" || order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel shipped or delivered orders",
      });
    }

    order.status = "Cancelled";
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order cancelled", data: order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Process a refund
exports.processRefund = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled orders can be refunded",
      });
    }

    // Simulate refund processing (add integration with payment gateway here)
    const refundSuccess = true; // Simulated response

    if (!refundSuccess) {
      return res
        .status(500)
        .json({ success: false, message: "Refund processing failed" });
    }

    res
      .status(200)
      .json({ success: true, message: "Refund processed successfully" });
  } catch (error) {
    console.error("Error processing refund:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
