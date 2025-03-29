// controllers/cartController.js
const User = require('../models/User');
const GuestCart = require('../models/GuestCart');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Public (both guest and authenticated users)
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity || quantity < 1) {
    return next(new ErrorResponse('Please provide product ID and valid quantity', 400));
  }
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }
  
  // Check if product is in stock
  if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity < quantity)) {
    return next(new ErrorResponse('Product is out of stock or has insufficient quantity', 400));
  }
  
  // Handle guest cart
  if (req.isGuest) {
    // Find or create guest cart
    let guestCart = await GuestCart.findOne({ guestId: req.guestId });
    
    if (!guestCart) {
      guestCart = await GuestCart.create({
        guestId: req.guestId,
        items: [{ productId, quantity, selected: true }]
      });
    } else {
      // Check if product already in cart
      const existingItemIndex = guestCart.items.findIndex(
        item => item.productId.toString() === productId
      );
      
      if (existingItemIndex > -1) {
        // Update quantity if product already in cart
        guestCart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        guestCart.items.push({ productId, quantity, selected: true });
      }
      
      await guestCart.save();
    }
    
    // Populate product details in response
    const populatedGuestCart = await GuestCart.findOne({ guestId: req.guestId })
      .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      data: populatedGuestCart
    });
  }
  
  // Handle registered user cart
  const user = await User.findById(req.user.id);
  
  // Check if user has a cart
  if (!user.cart) {
    user.cart = { items: [] };
  }
  
  // Check if product already in cart
  const existingItemIndex = user.cart.items.findIndex(
    item => item.productId.toString() === productId
  );
  
  if (existingItemIndex > -1) {
    // Update quantity if product already in cart
    user.cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item to cart
    user.cart.items.push({ productId, quantity, selected: true });
  }
  
  await user.save();
  
  // Populate product details in response
  const populatedUser = await User.findById(req.user.id)
    .populate('cart.items.productId');
  
  res.status(200).json({
    success: true,
    data: populatedUser.cart
  });
});

// @desc    Get cart items
// @route   GET /api/cart/items
// @access  Public (both guest and authenticated users)
exports.getCartItems = asyncHandler(async (req, res, next) => {
  // Handle guest cart
  if (req.isGuest) {
    const guestCart = await GuestCart.findOne({ guestId: req.guestId })
      .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      data: guestCart || { items: [] }
    });
  }
  
  // Handle registered user cart
  const user = await User.findById(req.user.id)
    .populate('cart.items.productId');
  
  res.status(200).json({
    success: true,
    data: user.cart || { items: [] }
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:productId
// @access  Public (both guest and authenticated users)
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity, selected } = req.body;
  
  if (!quantity && selected === undefined) {
    return next(new ErrorResponse('Please provide quantity or selected status', 400));
  }
  
  if (quantity !== undefined && quantity < 1) {
    return next(new ErrorResponse('Quantity must be at least 1', 400));
  }
  
  // Handle guest cart
  if (req.isGuest) {
    const guestCart = await GuestCart.findOne({ guestId: req.guestId });
    
    if (!guestCart) {
      return next(new ErrorResponse('Cart not found', 404));
    }
    
    const itemIndex = guestCart.items.findIndex(
      item => item.productId.toString() === productId
    );
    
    if (itemIndex === -1) {
      return next(new ErrorResponse('Item not found in cart', 404));
    }
    
    // Update quantity if provided
    if (quantity !== undefined) {
      guestCart.items[itemIndex].quantity = quantity;
    }
    
    // Update selected status if provided
    if (selected !== undefined) {
      guestCart.items[itemIndex].selected = selected;
    }
    
    await guestCart.save();
    
    // Populate product details in response
    const populatedGuestCart = await GuestCart.findOne({ guestId: req.guestId })
      .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      data: populatedGuestCart
    });
  }
  
  // Handle registered user cart
  const user = await User.findById(req.user.id);
  
  if (!user.cart || !user.cart.items) {
    return next(new ErrorResponse('Cart not found', 404));
  }
  
  const itemIndex = user.cart.items.findIndex(
    item => item.productId.toString() === productId
  );
  
  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }
  
  // Update quantity if provided
  if (quantity !== undefined) {
    user.cart.items[itemIndex].quantity = quantity;
  }
  
  // Update selected status if provided
  if (selected !== undefined) {
    user.cart.items[itemIndex].selected = selected;
  }
  
  await user.save();
  
  // Populate product details in response
  const populatedUser = await User.findById(req.user.id)
    .populate('cart.items.productId');
  
  res.status(200).json({
    success: true,
    data: populatedUser.cart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Public (both guest and authenticated users)
exports.removeCartItem = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    
    // Handle guest cart
    if (req.isGuest) {
      const guestCart = await GuestCart.findOne({ guestId: req.guestId });
      
      if (!guestCart) {
        return next(new ErrorResponse('Cart not found', 404));
      }
      
      // Remove item from cart
      guestCart.items = guestCart.items.filter(
        item => item.productId.toString() !== productId
      );
      
      await guestCart.save();
      
      return res.status(200).json({
        success: true,
        data: guestCart
      });
    }
    
    // Handle registered user cart
    const user = await User.findById(req.user.id);
    
    if (!user.cart || !user.cart.items) {
      return next(new ErrorResponse('Cart not found', 404));
    }
    
    // Remove item from cart
    user.cart.items = user.cart.items.filter(
      item => item.productId.toString() !== productId
    );
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.cart
    });
  });
  
  // @desc    Clear cart
  // @route   DELETE /api/cart/items
  // @access  Public (both guest and authenticated users)
  exports.clearCart = asyncHandler(async (req, res, next) => {
    // Handle guest cart
    if (req.isGuest) {
      await GuestCart.findOneAndDelete({ guestId: req.guestId });
      
      return res.status(200).json({
        success: true,
        data: {}
      });
    }
    
    // Handle registered user cart
    const user = await User.findById(req.user.id);
    
    if (user.cart) {
      user.cart.items = [];
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  });
  
  // @desc    Transfer guest cart to user after login
  // @route   POST /api/cart/transfer
  // @access  Private
  exports.transferGuestCart = asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User must be logged in', 401));
    }
    
    if (!req.body.guestId) {
      return next(new ErrorResponse('Guest ID is required', 400));
    }
    
    const guestCart = await GuestCart.findOne({ guestId: req.body.guestId });
    
    if (!guestCart || !guestCart.items.length) {
      return res.status(200).json({
        success: true,
        message: 'No guest cart found to transfer',
        data: {}
      });
    }
    
    // Get user with cart
    const user = await User.findById(req.user.id);
    
    // Initialize cart if it doesn't exist
    if (!user.cart) {
      user.cart = { items: [] };
    }
    
    // Merge guest cart items with user cart
    guestCart.items.forEach(guestItem => {
      const existingItemIndex = user.cart.items.findIndex(
        item => item.productId.toString() === guestItem.productId.toString()
      );
      
      if (existingItemIndex > -1) {
        // Update quantity if product already in cart
        user.cart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Add new item to cart
        user.cart.items.push({
          productId: guestItem.productId,
          quantity: guestItem.quantity,
          selected: guestItem.selected
        });
      }
    });
    
    await user.save();
    
    // Delete guest cart
    await GuestCart.findOneAndDelete({ guestId: req.body.guestId });
    
    // Populate product details in response
    const populatedUser = await User.findById(req.user.id)
      .populate('cart.items.productId');
    
    res.status(200).json({
      success: true,
      message: 'Guest cart transferred successfully',
      data: populatedUser.cart
    });
  });