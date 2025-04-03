const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");

// Add an order item
exports.addOrderItem = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const price = product.price;
    const total = price * quantity;

    const orderItem = new OrderItem({
      orderId,
      productId,
      productName: product.name,
      quantity,
      price,
      total,
    });
    await orderItem.save();

    res
      .status(201)
      .json({ success: true, message: "Order item added", data: orderItem });
  } catch (error) {
    console.error("Error adding order item:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all order items for an order
exports.getOrderItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderItems = await OrderItem.find({ orderId }).populate(
      "productId",
      "name price"
    );
    res
      .status(200)
      .json({ success: true, count: orderItems.length, data: orderItems });
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
    const { quantity } = req.body;
    const orderItem = await OrderItem.findById(req.params.id);
    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }

    orderItem.quantity = quantity;
    orderItem.total = orderItem.price * quantity;
    await orderItem.save();

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
    const orderItem = await OrderItem.findByIdAndDelete(req.params.id);
    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }
    res.status(200).json({ success: true, message: "Order item removed" });
  } catch (error) {
    console.error("Error removing order item:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get total price for an order item
exports.getOrderItemTotal = async (req, res) => {
  try {
    const orderItem = await OrderItem.findById(req.params.id);
    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }
    res.status(200).json({ success: true, total: orderItem.total });
  } catch (error) {
    console.error("Error fetching order item total:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
