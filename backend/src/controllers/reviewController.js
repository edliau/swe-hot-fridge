// controllers/reviewController.js
const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  const { productId, rating, text } = req.body;

  const review = await Review.create({
    userId: req.user.id,
    productId,
    rating,
    text
  });

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ productId: req.params.productId }).populate('userId', 'firstName lastName');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  if (review.userId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this review', 403));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  if (review.userId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this review', 403));
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
