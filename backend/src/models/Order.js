const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem", // Reference to the OrderItem model
      required: true,
    },
  ],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address", // Reference to the Address model
    required: true,
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentMethod", // Reference to the PaymentMethod model
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  deliveryTimeSlot: {
    type: String,
  },
  isPickup: {
    type: Boolean,
    default: false,
  },
  pickupLocation: {
    type: String,
  },
  specialInstructions: {
    type: String,
  },
});

// Middleware to calculate total price before saving
orderSchema.pre("save", function (next) {
  this.total = this.subtotal + this.tax;
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
