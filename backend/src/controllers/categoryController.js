const Category = require('../models/Category');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Public
exports.getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Verify category exists
  const category = await Category.findById(id);
  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Build filter object with category
  const filter = { category: id };

  // Apply optional filters if provided
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: "i" };
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
  }

  if (req.query.onSale === "true") {
    filter.isOnSale = true;
  }

  if (req.query.inStock === "true") {
    filter.inStock = true;
  }

  // Sort options
  const sortOptions = {};
  if (req.query.sort) {
    if (req.query.sort === "price-asc") sortOptions.price = 1;
    if (req.query.sort === "price-desc") sortOptions.price = -1;
    if (req.query.sort === "name-asc") sortOptions.name = 1;
    if (req.query.sort === "name-desc") sortOptions.name = -1;
    if (req.query.sort === "popular") sortOptions.popularity = -1;
    if (req.query.sort === "rating") sortOptions.averageRating = -1;
    if (req.query.sort === "newest") sortOptions.createdAt = -1;
  } else {
    // Default sorting
    sortOptions.createdAt = -1;
  }

  // Get products for this category
  const products = await Product.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalProducts = await Product.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: products.length,
    totalPages: Math.ceil(totalProducts / limit),
    currentPage: page,
    data: products,
    category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  await category.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});