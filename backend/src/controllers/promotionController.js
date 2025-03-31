const Promotion = require('../models/Promotion');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create a promotion
// @route   POST /api/promotions
// @access  Private/Admin
exports.createPromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.create(req.body);
  res.status(201).json({ success: true, data: promotion });
});

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Public
exports.getPromotions = asyncHandler(async (req, res, next) => {
  const promotions = await Promotion.find()
    .populate('applicableProducts')
    .populate('applicableCategories');

  res.status(200).json({ success: true, count: promotions.length, data: promotions });
});

// @desc    Update a promotion
// @route   PUT /api/promotions/:id
// @access  Private/Admin
exports.updatePromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!promotion) {
    return next(new ErrorResponse(`No promotion with ID ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: promotion });
});

// @desc    Delete a promotion
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
exports.deletePromotion = asyncHandler(async (req, res, next) => {
  const promotion = await Promotion.findById(req.params.id);

  if (!promotion) {
    return next(new ErrorResponse(`No promotion with ID ${req.params.id}`, 404));
  }

  await promotion.remove();
  res.status(200).json({ success: true, data: {} });
});
