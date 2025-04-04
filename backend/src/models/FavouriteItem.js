// models/FavouriteItem.js
const mongoose = require('mongoose');

const favouriteItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
}, {
  timestamps: true
});

// Add a compound index to ensure a user can't add the same product twice
favouriteItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('FavouriteItem', favouriteItemSchema);