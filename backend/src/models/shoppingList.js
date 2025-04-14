// models/ShoppingList.js
const mongoose = require('mongoose');

// Create a schema for the list items with quantities
const ShoppingListItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: [1, 'Quantity must be at least 1']
  },
  notes: {
    type: String,
    default: ''
  }
});

const ShoppingListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a list name'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  items: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
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

// Update updatedAt before save
ShoppingListSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Convert any string IDs in items array to proper structure
  if (this.items && Array.isArray(this.items)) {
    // Check if any items are strings (old format)
    const hasOldFormat = this.items.some(item => typeof item === 'string' || item instanceof mongoose.Types.ObjectId);
    
    if (hasOldFormat) {
      // Convert all string IDs to objects with quantity
      this.items = this.items.map(item => {
        if (typeof item === 'string' || item instanceof mongoose.Types.ObjectId) {
          return {
            productId: item,
            quantity: 1
          };
        }
        return item;
      });
    }
  }
  
  next();
});

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);