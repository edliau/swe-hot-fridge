// controllers/userController.js
const User = require('../models/User');
const Address = require('../models/Address');
const PaymentMethod = require('../models/PaymentMethod');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Add address to user
// @route   POST /api/users/address
// @access  Private
exports.addAddress = asyncHandler(async (req, res, next) => {
  // Add user ID to request body
  req.body.userId = req.user.id;
  
  // Check if this is the first address
  const addressCount = await Address.countDocuments({ userId: req.user.id });
  if (addressCount === 0) {
    req.body.isDefault = true;
  } else if (req.body.isDefault) {
    // If setting this address as default, unset other default addresses
    await Address.updateMany(
      { userId: req.user.id, isDefault: true },
      { isDefault: false }
    );
  }
  
  // Create address
  const address = await Address.create(req.body);
  
  // Add address to user's addresses array
  await User.findByIdAndUpdate(
    req.user.id,
    { $push: { addresses: address._id } },
    { new: true }
  );
  
  res.status(201).json({
    success: true,
    data: address
  });
});

// @desc    Get all user addresses
// @route   GET /api/users/address
// @access  Private
exports.getAddresses = asyncHandler(async (req, res, next) => {
  const addresses = await Address.find({ userId: req.user.id });
  
  res.status(200).json({
    success: true,
    count: addresses.length,
    data: addresses
  });
});

// @desc    Update address
// @route   PUT /api/users/address/:id
// @access  Private
exports.updateAddress = asyncHandler(async (req, res, next) => {
  let address = await Address.findById(req.params.id);
  
  if (!address) {
    return next(
      new ErrorResponse(`Address not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user owns address
  if (address.userId.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this address`, 401)
    );
  }
  
  // If setting this address as default, unset other default addresses
  if (req.body.isDefault) {
    await Address.updateMany(
      { userId: req.user.id, isDefault: true },
      { isDefault: false }
    );
  }
  
  address = await Address.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: address
  });
});

// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const address = await Address.findById(req.params.id);
  
  if (!address) {
    return next(
      new ErrorResponse(`Address not found with id of ${req.params.id}`, 404)
    );
  }
  
// controllers/userController.js (continued)
  
  // Make sure user owns address
  if (address.userId.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this address`, 401)
    );
  }
  
  // Check if this is the default address and if there are other addresses
  if (address.isDefault) {
    const addressCount = await Address.countDocuments({ userId: req.user.id });
    
    if (addressCount > 1) {
      // Find another address to make default
      const newDefaultAddress = await Address.findOne({
        userId: req.user.id,
        _id: { $ne: req.params.id }
      });
      
      if (newDefaultAddress) {
        newDefaultAddress.isDefault = true;
        await newDefaultAddress.save();
      }
    }
  }
  
  await address.remove();
  
  // Remove address from user's addresses array
  await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { addresses: req.params.id } }
  );
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add payment method using Stripe
// @route   POST /api/users/payment
// @access  Private
exports.addPaymentMethod = asyncHandler(async (req, res, next) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  // Get the payment method information from the request
  const { paymentMethodId, billingDetails, isDefault } = req.body;
  
  if (!paymentMethodId) {
    return next(new ErrorResponse('Payment method ID is required', 400));
  }
  
  try {
    // Get the user
    const user = await User.findById(req.user.id);
    
    // Check if user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    
    // If not, create a new Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone
      });
      
      stripeCustomerId = customer.id;
      
      // Save Stripe customer ID to user
      user.stripeCustomerId = stripeCustomerId;
      await user.save({ validateBeforeSave: false });
    }
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId
    });
    
    // Retrieve the payment method to get details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // If setting this payment method as default, set as default in Stripe
    if (isDefault) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      // Also update any existing default payment methods in our DB
      await PaymentMethod.updateMany(
        { userId: req.user.id, isDefault: true },
        { isDefault: false }
      );
    }
    
    // Create payment method in our database
    const newPaymentMethod = await PaymentMethod.create({
      userId: req.user.id,
      stripeCustomerId,
      stripePaymentMethodId: paymentMethodId,
      type: paymentMethod.type,
      last4: paymentMethod.card ? paymentMethod.card.last4 : null,
      brand: paymentMethod.card ? paymentMethod.card.brand : null,
      expMonth: paymentMethod.card ? paymentMethod.card.exp_month.toString() : null,
      expYear: paymentMethod.card ? paymentMethod.card.exp_year.toString() : null,
      cardHolderName: billingDetails?.name || null,
      billingAddress: {
        line1: billingDetails?.address?.line1 || null,
        line2: billingDetails?.address?.line2 || null,
        city: billingDetails?.address?.city || null,
        state: billingDetails?.address?.state || null,
        postal_code: billingDetails?.address?.postal_code || null,
        country: billingDetails?.address?.country || null
      },
      isDefault: isDefault || false
    });
    
    // Add payment method to user's paymentMethods array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { paymentMethods: newPaymentMethod._id } }
    );
    
    res.status(201).json({
      success: true,
      data: newPaymentMethod
    });
  } catch (err) {
    return next(new ErrorResponse(`Stripe error: ${err.message}`, 500));
  }
});

// @desc    Get all user payment methods
// @route   GET /api/users/payment
// @access  Private
exports.getPaymentMethods = asyncHandler(async (req, res, next) => {
  const paymentMethods = await PaymentMethod.find({ userId: req.user.id });
  
  res.status(200).json({
    success: true,
    count: paymentMethods.length,
    data: paymentMethods
  });
});

// @desc    Update payment method (e.g., set as default)
// @route   PUT /api/users/payment/:id
// @access  Private
exports.updatePaymentMethod = asyncHandler(async (req, res, next) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  let paymentMethod = await PaymentMethod.findById(req.params.id);
  
  if (!paymentMethod) {
    return next(
      new ErrorResponse(`Payment method not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user owns payment method
  if (paymentMethod.userId.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this payment method`, 401)
    );
  }
  
  // If setting as default payment method
  if (req.body.isDefault) {
    try {
      const user = await User.findById(req.user.id).select('+stripeCustomerId');
      
      if (user.stripeCustomerId && paymentMethod.stripePaymentMethodId) {
        // Update default payment method in Stripe
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.stripePaymentMethodId
          }
        });
      }
      
      // Update any existing default payment methods in our DB
      await PaymentMethod.updateMany(
        { userId: req.user.id, isDefault: true },
        { isDefault: false }
      );
    } catch (err) {
      return next(new ErrorResponse(`Stripe error: ${err.message}`, 500));
    }
  }
  
  // Update the payment method in our database
  // Note: Only certain fields can be updated (mainly isDefault)
  paymentMethod = await PaymentMethod.findByIdAndUpdate(
    req.params.id,
    { isDefault: req.body.isDefault },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: paymentMethod
  });
});

// @desc    Delete payment method
// @route   DELETE /api/users/payment/:id
// @access  Private
exports.deletePaymentMethod = asyncHandler(async (req, res, next) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  const paymentMethod = await PaymentMethod.findById(req.params.id);
  
  if (!paymentMethod) {
    return next(
      new ErrorResponse(`Payment method not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Make sure user owns payment method
  if (paymentMethod.userId.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this payment method`, 401)
    );
  }
  
  try {
    // Detach the payment method from the customer in Stripe
    if (paymentMethod.stripePaymentMethodId) {
      await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
    }
    
    // If this is the default payment method and there are others
    if (paymentMethod.isDefault) {
      const paymentCount = await PaymentMethod.countDocuments({ userId: req.user.id });
      
      if (paymentCount > 1) {
        // Find another payment method to make default
        const newDefaultPayment = await PaymentMethod.findOne({
          userId: req.user.id,
          _id: { $ne: req.params.id }
        });
        
        if (newDefaultPayment) {
          newDefaultPayment.isDefault = true;
          await newDefaultPayment.save();
          
          // Also update in Stripe if possible
          if (newDefaultPayment.stripePaymentMethodId) {
            const user = await User.findById(req.user.id).select('+stripeCustomerId');
            
            if (user.stripeCustomerId) {
              await stripe.customers.update(user.stripeCustomerId, {
                invoice_settings: {
                  default_payment_method: newDefaultPayment.stripePaymentMethodId
                }
              });
            }
          }
        }
      }
    }
    
    // Remove the payment method from our database
    await paymentMethod.remove();
    
    // Remove payment method from user's paymentMethods array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { paymentMethods: req.params.id } }
    );
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    return next(new ErrorResponse(`Stripe error: ${err.message}`, 500));
  }
});

// @desc    Set dietary preferences
// @route   PUT /api/users/preferences
// @access  Private
exports.setDietaryPreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { dietaryPreferences: req.body },
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: user.dietaryPreferences
  });
});

// @desc    Add product to favorites
// @route   POST /api/users/favorites/:productId
// @access  Private
exports.addToFavorites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Check if product already in favorites
  if (user.favoriteItems.includes(req.params.productId)) {
    return res.status(200).json({
      success: true,
      message: 'Product already in favorites',
      data: user.favoriteItems
    });
  }
  
  // Add to favorites
  user.favoriteItems.push(req.params.productId);
  await user.save();
  
  res.status(200).json({
    success: true,
    data: user.favoriteItems
  });
});

// @desc    Remove product from favorites
// @route   DELETE /api/users/favorites/:productId
// @access  Private
exports.removeFromFavorites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // Remove from favorites
  user.favoriteItems = user.favoriteItems.filter(
    item => item.toString() !== req.params.productId
  );
  
  await user.save();
  
  res.status(200).json({
    success: true,
    data: user.favoriteItems
  });
});

// @desc    Get favorite products
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('favoriteItems');
  
  res.status(200).json({
    success: true,
    count: user.favoriteItems.length,
    data: user.favoriteItems
  });
});