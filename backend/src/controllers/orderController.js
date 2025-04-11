const Order = require("../models/Order");
const Product = require("../models/Product");
const Address = require("../models/Address");
const PaymentMethod = require("../models/PaymentMethod");
const User = require("../models/User");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      addressId,
      paymentMethodId,
      tax,
      deliveryDate,
      deliveryTimeSlot,
      isPickup,
      pickupLocation,
      specialInstructions,
    } = req.body;

    const userId = req.user.id; // Get user ID from auth middleware

    let subtotal = 0;
    const orderItemsArray = [];

    // Create order items and calculate subtotal
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with ID: ${item.productId}`,
        });
      }

      // Check stock availability
      if (
        !product.inStock ||
        (product.stockQuantity !== undefined &&
          product.stockQuantity < item.quantity)
      ) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is out of stock or has insufficient quantity`,
        });
      }

      // Get the correct price (regular or discount)
      const price = product.isOnSale && product.discountPrice
        ? product.discountPrice
        : product.price;

      const orderItem = {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: price,
        total: price * item.quantity,
      };

      orderItemsArray.push(orderItem);
      subtotal += orderItem.total;
    }

    // Validate address and payment method
    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== userId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid shipping address" });
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod || paymentMethod.userId.toString() !== userId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method" });
    }

    // Create the order
    const total = subtotal + tax;
    const order = new Order({
      userId,
      orderItems: orderItemsArray,
      subtotal,
      tax: parseFloat(tax) || 0,
      total,
      addressId,
      paymentMethodId,
      deliveryDate: deliveryDate || undefined,
      deliveryTimeSlot: deliveryTimeSlot || undefined,
      isPickup: isPickup || false,
      pickupLocation: pickupLocation || undefined,
      specialInstructions: specialInstructions || undefined,
      status: "Pending",
      paymentStatus: "pending",
    });

    await order.save();

    // If the order is successfully created, clear the user's cart
    const user = await User.findById(userId);
    if (user && user.cart) {
      user.cart.items = [];
      await user.save();
    }

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

// Get all order items for an order
exports.getOrderItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.status(200).json({
      success: true,
      count: order.orderItems.length,
      data: order.orderItems,
    });
  } catch (error) {
    console.error("Error fetching order items:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update order item quantity
exports.updateOrderItem = async (req, res) => {
  try {
    const { orderId, itemId, quantity } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const orderItem = order.orderItems.find(
      (item) => item._id.toString() === itemId
    );
    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }

    orderItem.quantity = quantity;
    orderItem.total = orderItem.price * quantity;
    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order item updated", data: orderItem });
  } catch (error) {
    console.error("Error updating order item:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Remove order item
exports.removeOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const orderItemIndex = order.orderItems.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (orderItemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }

    order.orderItems.splice(orderItemIndex, 1);
    await order.save();

    res.status(200).json({ success: true, message: "Order item removed" });
  } catch (error) {
    console.error("Error removing order item:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get total price for an order
exports.getOrderTotal = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, total: order.total });
  } catch (error) {
    console.error("Error fetching order total:", error);
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