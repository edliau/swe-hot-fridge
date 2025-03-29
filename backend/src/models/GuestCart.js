// models/GuestCart.js
const mongoose = require('mongoose');

const GuestCartSchema = new mongoose.Schema({
  guestId: {
    type: String,
    required: true,
    unique: true
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      selected: {
        type: Boolean,
        default: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires:  4 * 60 * 60 // Automatically delete after 30 days
  }
});

module.exports = mongoose.model('GuestCart', GuestCartSchema);