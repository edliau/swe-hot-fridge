const CartItem = require("../models/CartItem");
const Product = require("../models/Product");

// Calculate total for a cart item
exports.calculateTotal = async (req, res) => {
  try {
    const cartItem = await CartItem.findById(req.params.id);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }
    cartItem.total = cartItem.quantity * cartItem.price;
    await cartItem.save();
    res
      .status(200)
      .json({ success: true, message: "Total calculated", data: cartItem });
  } catch (error) {
    console.error("Error calculating total:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Add item to cart
exports.addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const total = product.price * quantity;
    const cartItem = new CartItem({
      productId,
      quantity,
      price: product.price,
      total,
    });
    await cartItem.save();
    res
      .status(201)
      .json({ success: true, message: "Item added to cart", data: cartItem });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  try {
    const cartItem = await CartItem.findByIdAndDelete(req.params.id);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }
    res.status(200).json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update item quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await CartItem.findById(req.params.id);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }
    cartItem.quantity = quantity;
    cartItem.total = cartItem.price * quantity;
    await cartItem.save();
    res
      .status(200)
      .json({ success: true, message: "Quantity updated", data: cartItem });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get total for cart item
exports.getTotal = async (req, res) => {
  try {
    const cartItem = await CartItem.findById(req.params.id);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }
    res.status(200).json({ success: true, total: cartItem.total });
  } catch (error) {
    console.error("Error fetching total:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
