const mongoose = require("mongoose");
const cartItemSchema = require("./CartItem");

const shoppingCartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to User model
    required: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cartItem", // Reference to CartItem schema
      required: true,
    },
  ], // Array of CartItem objects
  totalAmount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isGuest: {
    type: Boolean,
    default: true,
  },
  sessionId: {
    type: String,
    default: () => Math.random().toString(36).substring(2), // Generate a random session ID
  },
});

// Middleware to calculate totalAmount before saving
shoppingCartSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((acc, item) => acc + item.total, 0); // Sum of all item totals
  this.updatedAt = Date.now(); // Update the timestamp
  next();
});

// Set virtuals in JSON output
shoppingCartSchema.set("toJSON", { virtuals: true });
shoppingCartSchema.set("toObject", { virtuals: true });

const ShoppingCart = mongoose.model("ShoppingCart", shoppingCartSchema);

module.exports = ShoppingCart;
