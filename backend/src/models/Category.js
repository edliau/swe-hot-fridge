const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: '/images/default-category.png'
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metaTitle: {
    type: String,
    maxlength: [100, 'Meta title cannot be more than 100 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [200, 'Meta description cannot be more than 200 characters']
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

// Create slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);