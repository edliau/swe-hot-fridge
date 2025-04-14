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

// @desc    Get a single shopping list
// @route   GET /api/shopping-lists/:id
// @access  Private
exports.getShoppingList = asyncHandler(async (req, res, next) => {
  const list = await ShoppingList.findById(req.params.id);
  
  if (!list) {
    return next(new ErrorResponse("Shopping list not found", 404));
  }
  
  // Check ownership
  if (list.userId.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to access this list", 401));
  }
  
  res.status(200).json({ success: true, data: list });
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

  // Handle updating items with quantities
  if (req.body.items) {
    // Validate items structure
    const isValid = Array.isArray(req.body.items) && req.body.items.every(item => {
      // Support both old format (array of productIds) and new format (objects with productId and quantity)
      return typeof item === 'string' || 
        (item && typeof item === 'object' && item.productId);
    });

    if (!isValid) {
      return next(new ErrorResponse("Invalid items format", 400));
    }
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

// @desc    Add item to shopping list
// @route   POST /api/shopping-lists/:id/items
// @access  Private
exports.addItemToList = asyncHandler(async (req, res, next) => {
  const { productId, quantity, notes } = req.body;
  
  if (!productId) {
    return next(new ErrorResponse("Product ID is required", 400));
  }
  
  const list = await ShoppingList.findById(req.params.id);
  
  if (!list) {
    return next(new ErrorResponse("Shopping list not found", 404));
  }
  
  if (list.userId.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 401));
  }
  
  // Check if the list has the new structure
  const hasStructuredItems = Array.isArray(list.items) && 
    list.items.some(item => item && typeof item === 'object' && item.productId);
  
  if (hasStructuredItems) {
    // Find if item already exists
    const existingItemIndex = list.items.findIndex(item => 
      item.productId && item.productId.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update existing item
      list.items[existingItemIndex].quantity = (quantity || 1) + 
        (list.items[existingItemIndex].quantity || 0);
      if (notes) {
        list.items[existingItemIndex].notes = notes;
      }
    } else {
      // Add new item with quantity
      list.items.push({
        productId,
        quantity: quantity || 1,
        notes: notes || ""
      });
    }
  } else {
    // Old structure - just array of product IDs
    // Check if product already exists
    const exists = list.items.includes(productId);
    if (!exists) {
      // Convert to new structure with quantities
      const newItems = list.items.map(id => ({
        productId: id,
        quantity: 1
      }));
      
      // Add the new item
      newItems.push({
        productId,
        quantity: quantity || 1,
        notes: notes || ""
      });
      
      // Update the list
      list.items = newItems;
    }
  }
  
  await list.save();
  
  res.status(200).json({
    success: true,
    data: list
  });
});

// @desc    Remove item from shopping list
// @route   DELETE /api/shopping-lists/:id/items/:productId
// @access  Private
exports.removeItemFromList = asyncHandler(async (req, res, next) => {
  const list = await ShoppingList.findById(req.params.id);
  
  if (!list) {
    return next(new ErrorResponse("Shopping list not found", 404));
  }
  
  if (list.userId.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 401));
  }
  
  // Check if the list has the new structure
  const hasStructuredItems = Array.isArray(list.items) && 
    list.items.some(item => item && typeof item === 'object' && item.productId);
  
  if (hasStructuredItems) {
    // Remove item based on productId
    list.items = list.items.filter(item => 
      item.productId && item.productId.toString() !== req.params.productId
    );
  } else {
    // Old structure - filter out the product ID
    list.items = list.items.filter(id => id.toString() !== req.params.productId);
  }
  
  await list.save();
  
  res.status(200).json({
    success: true,
    data: list
  });
});

// @desc    Update item quantity
// @route   PUT /api/shopping-lists/:id/items/:productId
// @access  Private
exports.updateItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity, notes } = req.body;
  
  const list = await ShoppingList.findById(req.params.id);
  
  if (!list) {
    return next(new ErrorResponse("Shopping list not found", 404));
  }
  
  if (list.userId.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 401));
  }
  
  // Check if the list has the new structure
  const hasStructuredItems = Array.isArray(list.items) && 
    list.items.some(item => item && typeof item === 'object' && item.productId);
  
  if (hasStructuredItems) {
    // Find the item
    const itemIndex = list.items.findIndex(item => 
      item.productId && item.productId.toString() === req.params.productId
    );
    
    if (itemIndex === -1) {
      return next(new ErrorResponse("Item not found in list", 404));
    }
    
    // Update quantity
    if (quantity !== undefined) {
      list.items[itemIndex].quantity = quantity;
    }
    
    // Update notes if provided
    if (notes !== undefined) {
      list.items[itemIndex].notes = notes;
    }
  } else {
    // Old structure - convert to new structure with quantities
    const newItems = [];
    
    for (const id of list.items) {
      if (id.toString() === req.params.productId) {
        newItems.push({
          productId: id,
          quantity: quantity || 1,
          notes: notes || ""
        });
      } else {
        newItems.push({
          productId: id,
          quantity: 1
        });
      }
    }
    
    list.items = newItems;
  }
  
  await list.save();
  
  res.status(200).json({
    success: true,
    data: list
  });
});