// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    default: 0,
    min: [0, 'Discount price cannot be negative']
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  image: {
    type: String,
    default: '/images/default-product.png'
  },
  ingredients: {
    type: [String],
    default: []
  },
  nutritionalInfo: {
    calories: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    },
    carbs: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    sodium: {
      type: Number,
      default: 0
    }
  },
  allergens: {
    type: [String],
    default: []
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Stock quantity cannot be negative']
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  popularity: {
    type: Number,
    default: 0
  },
  ratings: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      review: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  averageRating: {
    type: Number,
    default: 0
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

// Remove the inStock field and replace with a virtual property
productSchema.virtual('inStock').get(function() {
  return this.stockQuantity > 0;
});

// Calculate average rating before saving
productSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce((acc, item) => acc + item.rating, 0) / this.ratings.length;
  }
  this.updatedAt = Date.now();
  next();
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.isOnSale && this.discountPrice > 0 && this.price > 0) {
    return Math.round((1 - this.discountPrice / this.price) * 100);
  }
  return 0;
});

// Calculate final price
productSchema.virtual('finalPrice').get(function() {
  if (this.isOnSale && this.discountPrice > 0) {
    return this.discountPrice;
  }
  return this.price;
});

// Set toJSON option to include virtuals
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;