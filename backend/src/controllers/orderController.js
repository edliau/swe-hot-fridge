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

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
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
      specialInstructions
    } = req.body;

    const userId = req.user.id; // Get user ID from auth middleware

    let subtotal = 0;
    const orderItemsIds = [];

    // Create order items and calculate subtotal
    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: `Product not found with ID: ${item.productId}` });
      }

      // Check stock availability
      if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity < item.quantity)) {
        return res
          .status(400)
          .json({ success: false, message: `Product ${product.name} is out of stock or has insufficient quantity` });
      }

      // Get the correct price (regular or discount)
      const price = product.isOnSale && product.discountPrice ? product.discountPrice : product.price;
      
      const orderItem = new OrderItem({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: price,
        // Total is calculated automatically in the model's pre-save middleware
      });

      await orderItem.save();
      orderItemsIds.push(orderItem._id);
      subtotal += orderItem.total;
    }

    // Validate address and payment method
    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== userId) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid shipping address' });
    }

    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod || paymentMethod.userId.toString() !== userId) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid payment method' });
    }

    // Create the order
    const order = new Order({
      userId,
      orderItems: orderItemsIds,
      subtotal,
      tax: parseFloat(tax) || 0,
      // total will be calculated in the model's pre-save middleware
      addressId,
      paymentMethodId,
      deliveryDate: deliveryDate || undefined,
      deliveryTimeSlot: deliveryTimeSlot || undefined,
      isPickup: isPickup || false,
      pickupLocation: pickupLocation || undefined,
      specialInstructions: specialInstructions || undefined,
      status: 'Pending',
      paymentStatus: 'pending'
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

exports.updateOrderAfterPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Verify the order belongs to the authenticated user
    if (order.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to update this order" });
    }

    // Update order with payment information
    order.paymentIntentId = paymentIntentId;
    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'Processing';
    order.paymentStatus = 'succeeded';
    
    await order.save();

    res
      .status(200)
      .json({ 
        success: true, 
        message: "Payment successful, order updated", 
        data: order 
      });
  } catch (error) {
    console.error("Error updating order after payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};