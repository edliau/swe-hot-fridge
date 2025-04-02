const ShoppingCart = require("../models/shoppingCart");
const Order = require("../models/Order");

// Get user's shopping cart
exports.getCart = async (req, res) => {
  try {
    const cart = await ShoppingCart.findOne({ userId: req.user.id }).populate(
      "items.productId"
    );

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Add item to cart
exports.addItemToCart = async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;
    let cart = await ShoppingCart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new ShoppingCart({ userId: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * price;
    } else {
      cart.items.push({ productId, quantity, price, total: quantity * price });
    }

    await cart.save();
    res
      .status(200)
      .json({ success: true, message: "Item added to cart", data: cart });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
  try {
    let cart = await ShoppingCart.findOne({ userId: req.user.id });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== req.params.productId
    );
    await cart.save();

    res
      .status(200)
      .json({ success: true, message: "Item removed from cart", data: cart });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    await ShoppingCart.findOneAndDelete({ userId: req.user.id });
    res
      .status(200)
      .json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    let cart = await ShoppingCart.findOne({ userId: req.user.id });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === req.params.productId
    );
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    item.quantity = quantity;
    item.total = quantity * item.price;
    await cart.save();

    res
      .status(200)
      .json({ success: true, message: "Cart item updated", data: cart });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get total cart amount
exports.getTotal = async (req, res) => {
  try {
    const cart = await ShoppingCart.findOne({ userId: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    res.status(200).json({ success: true, totalAmount: cart.totalAmount });
  } catch (error) {
    console.error("Error fetching total amount:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Convert cart to order
exports.convertToOrder = async (req, res) => {
  try {
    const cart = await ShoppingCart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const newOrder = new Order({
      userId: req.user.id,
      items: cart.items,
      totalAmount: cart.totalAmount,
    });

    await newOrder.save();
    await ShoppingCart.findOneAndDelete({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: "Cart converted to order",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error converting cart to order:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
