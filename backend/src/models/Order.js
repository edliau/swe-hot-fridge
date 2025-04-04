// Update to the Order model to add payment-related fields
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
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
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Payment Failed", "Refunded"],
    default: "Pending",
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentMethod",
    required: true,
  },
  // New payment-related fields
  paymentIntentId: {
    type: String,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "processing", "succeeded", "failed", "refunded"],
    default: "pending",
  },
  paymentErrorMessage: {
    type: String,
  },
  refundId: {
    type: String,
  },
  refundAmount: {
    type: Number,
  },
  refundedAt: {
    type: Date,
  },
  // End of new fields
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