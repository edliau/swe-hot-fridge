const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a promotion title']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for the promotion']
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    min: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ],
  applicableCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Promotion', PromotionSchema);
