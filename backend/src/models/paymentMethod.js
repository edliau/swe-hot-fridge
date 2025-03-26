// models/PaymentMethod.js
const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Stripe customer ID for linking Stripe customer to our user
  stripeCustomerId: {
    type: String,
    select: false
  },
  // Stripe payment method ID
  stripePaymentMethodId: {
    type: String
  },
  type: {
    type: String,
    required: [true, 'Please add a payment method type'],
    enum: ['card', 'bank_account', 'paypal']
  },
  // Only showing last 4 digits for security
  last4: {
    type: String
  },
  // Brand of card (visa, mastercard, etc)
  brand: {
    type: String
  },
  // Expiration month and year (stored as strings to preserve leading zeros)
  expMonth: {
    type: String
  },
  expYear: {
    type: String
  },
  // Card holder name
  cardHolderName: {
    type: String
  },
  // Billing address can be different from shipping address
  billingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
PaymentMethodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);