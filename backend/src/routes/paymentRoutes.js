// Updated routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createPaymentIntent, 
  createRefund, 
  getPaymentMethods 
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Note: The webhook route is now handled directly in server.js
// with proper raw body handling

// Protected payment routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.get('/methods', protect, getPaymentMethods);

// Admin-only routes
router.post('/refund', protect, authorize('admin'), createRefund);

// Test route for adding payment methods (keep if needed)
router.post('/test-add-payment-method', protect, async (req, res, next) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const User = require('../models/User');
    const PaymentMethod = require('../models/PaymentMethod');
    
    const { 
      paymentMethodId, 
      userId,
    } = req.body;
    
    if (!paymentMethodId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID and user ID are required'
      });
    }
    
    // Get user
    const user = await User.findById(userId).select('+stripeCustomerId');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Ensure user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // Create a Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone || ''
      });
      
      stripeCustomerId = customer.id;
      
      // Save Stripe customer ID to user
      user.stripeCustomerId = stripeCustomerId;
      await user.save({ validateBeforeSave: false });
    }
    
    // Get payment method details from Stripe
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Attach payment method to customer if not already attached
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });
    } catch (error) {
      // If payment method is already attached, continue
      if (error.code !== 'payment_method_already_attached') {
        throw error;
      }
    }
    
    // Set as default in Stripe
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    
    // Update existing default payment methods in our DB
    await PaymentMethod.updateMany(
      { userId: userId, isDefault: true },
      { isDefault: false }
    );
    
    // Create payment method in our database
    const newPaymentMethod = await PaymentMethod.create({
      userId: userId,
      stripeCustomerId,
      stripePaymentMethodId: paymentMethodId,
      type: stripePaymentMethod.type,
      last4: stripePaymentMethod.card ? stripePaymentMethod.card.last4 : null,
      brand: stripePaymentMethod.card ? stripePaymentMethod.card.brand : null,
      expMonth: stripePaymentMethod.card ? stripePaymentMethod.card.exp_month.toString() : null,
      expYear: stripePaymentMethod.card ? stripePaymentMethod.card.exp_year.toString() : null,
      cardHolderName: stripePaymentMethod.billing_details?.name || null,
      billingAddress: {
        line1: stripePaymentMethod.billing_details?.address?.line1 || null,
        line2: stripePaymentMethod.billing_details?.address?.line2 || null,
        city: stripePaymentMethod.billing_details?.address?.city || null,
        state: stripePaymentMethod.billing_details?.address?.state || null,
        postal_code: stripePaymentMethod.billing_details?.address?.postal_code || null,
        country: stripePaymentMethod.billing_details?.address?.country || null
      },
      isDefault: true
    });
    
    // Add payment method to user's paymentMethods array if not already there
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { paymentMethods: newPaymentMethod._id } }
    );
    
    res.status(201).json({
      success: true,
      data: newPaymentMethod
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;