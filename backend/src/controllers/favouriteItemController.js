// controllers/favouriteItemController.js
const FavouriteItem = require('../models/FavouriteItem');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Add product to favorites
// @route   POST /api/favourites
// @access  Private
exports.addToFavorites = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.user.id;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${productId}`, 404));
  }

  // Check if already in favorites
  const existingFavorite = await FavouriteItem.findOne({ userId, productId });
  if (existingFavorite) {
    return res.status(400).json({
      success: false,
      message: 'Product already in favorites'
    });
  }

  // Add to favorites
  const favouriteItem = await FavouriteItem.create({
    userId,
    productId
  });

  res.status(201).json({
    success: true,
    data: favouriteItem
  });
});

// @desc    Get all favorite items for a user
// @route   GET /api/favourites
// @access  Private
exports.getFavorites = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const favourites = await FavouriteItem.find({ userId })
    .populate({
      path: 'productId',
      select: 'name price description image isOnSale discountPrice category'
    });

  res.status(200).json({
    success: true,
    count: favourites.length,
    data: favourites
  });
});

// @desc    Remove product from favorites
// @route   DELETE /api/favourites/:id
// @access  Private
exports.removeFromFavorites = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const favourite = await FavouriteItem.findOne({
    _id: id,
    userId
  });

  if (!favourite) {
    return next(new ErrorResponse(`Favorite item not found with id of ${id}`, 404));
  }

  await favourite.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Check if a product is in favorites
// @route   GET /api/favourites/check/:productId
// @access  Private
exports.checkFavorite = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const favourite = await FavouriteItem.findOne({ userId, productId });

  res.status(200).json({
    success: true,
    isFavorite: !!favourite
  });
});