const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to the Product model
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  total: {
    type: Number,
    default: 0,
  },
});

// Middleware to calculate total price before saving
cartItemSchema.pre("save", function (next) {
  this.total = this.price * this.quantity;
  next();
});

// Virtual for total price (alternative approach)
cartItemSchema.virtual("computedTotal").get(function () {
  return this.price * this.quantity;
});

// Set virtuals in JSON output
cartItemSchema.set("toJSON", { virtuals: true });
cartItemSchema.set("toObject", { virtuals: true });

const CartItem = mongoose.model("CartItem", cartItemSchema);

module.exports = CartItem;
