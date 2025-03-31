const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order", // Reference to the Order model
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to the Product model
    required: true,
  },
  productName: {
    type: String,
    required: [true, "Product name is required"],
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
orderItemSchema.pre("save", function (next) {
  this.total = this.price * this.quantity;
  next();
});

// Virtual for total price (alternative approach)
orderItemSchema.virtual("computedTotal").get(function () {
  return this.price * this.quantity;
});

// Set virtuals in JSON output
orderItemSchema.set("toJSON", { virtuals: true });
orderItemSchema.set("toObject", { virtuals: true });

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

module.exports = OrderItem;
