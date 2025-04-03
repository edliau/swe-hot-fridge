// controllers/shoppingListController.js
const ShoppingList = require("../models/ShoppingList");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Create a shopping list
// @route   POST /api/shopping-lists
// @access  Private
exports.createShoppingList = asyncHandler(async (req, res, next) => {
  req.body.userId = req.user.id;
  const shoppingList = await ShoppingList.create(req.body);
  res.status(201).json({ success: true, data: shoppingList });
});

// @desc    Get all shopping lists for user
// @route   GET /api/shopping-lists
// @access  Private
exports.getShoppingLists = asyncHandler(async (req, res, next) => {
  const lists = await ShoppingList.find({ userId: req.user.id });
  res.status(200).json({ success: true, count: lists.length, data: lists });
});

// @desc    Update a shopping list
// @route   PUT /api/shopping-lists/:id
// @access  Private
exports.updateShoppingList = asyncHandler(async (req, res, next) => {
  let list = await ShoppingList.findById(req.params.id);

  if (!list) return next(new ErrorResponse("Shopping list not found", 404));
  if (list.userId.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 401));
  }

  list = await ShoppingList.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: list });
});

// @desc    Delete a shopping list
// @route   DELETE /api/shopping-lists/:id
// @access  Private
exports.deleteShoppingList = asyncHandler(async (req, res, next) => {
  const list = await ShoppingList.findById(req.params.id);

  if (!list) return next(new ErrorResponse("Shopping list not found", 404));
  if (list.userId.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 401));
  }

  await list.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
