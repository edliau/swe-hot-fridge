const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
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
    enum: [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Payment Failed",
      "Refunded",
    ],
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

  // Payment-related fields
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

// Pre-save middleware to calculate item totals and overall total
orderSchema.pre("save", function (next) {
  // Calculate item totals
  this.orderItems.forEach((item) => {
    item.total = item.price * item.quantity;
  });

  // Recalculate subtotal
  this.subtotal = this.orderItems.reduce((acc, item) => acc + item.total, 0);

  // Total = subtotal + tax
  this.total = this.subtotal + this.tax;

  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
