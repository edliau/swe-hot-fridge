// models/Address.js
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  streetAddress: {
    type: String,
    required: [true, 'Please add a street address']
  },
  apartment: {
    type: String
  },
  city: {
    type: String,
    required: [true, 'Please add a city']
  },
  state: {
    type: String,
    required: [true, 'Please add a state/province']
  },
  postalCode: {
    type: String,
    required: [true, 'Please add a postal code']
  },
  country: {
    type: String,
    required: [true, 'Please add a country'],
    default: 'Singapore'
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  deliveryInstructions: {
    type: String
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
AddressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Address', AddressSchema);