// controllers/paymentController.js
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const PaymentMethod = require('../models/PaymentMethod');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const stripeService = require('../utils/stripeService');

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { orderId, paymentMethodId, savePaymentMethod } = req.body;
  
  console.log('Create payment intent request:', req.body);
  
  // Get user
  const user = await User.findById(req.user.id).select('+stripeCustomerId');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Get order
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }
  
  // Ensure the order belongs to the user
  if (order.userId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to process this order', 401));
  }
  
  // Only validate payment method if one is provided
  let paymentMethod;
  if (paymentMethodId) {
    paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (!paymentMethod || paymentMethod.userId.toString() !== req.user.id) {
      return next(new ErrorResponse('Invalid payment method', 400));
    }
  }
  
  try {
    // Ensure user has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // Create a Stripe customer
      const customer = await stripeService.createCustomer({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        userId: user._id.toString()
      });
      
      stripeCustomerId = customer.id;
      
      // Save Stripe customer ID to user
      user.stripeCustomerId = stripeCustomerId;
      await user.save({ validateBeforeSave: false });
    }
    
    // Create a payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: order.total,
      customerId: stripeCustomerId,
      paymentMethodId: paymentMethod ? paymentMethod.stripePaymentMethodId : undefined,
      orderId: order._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      description: `Payment for order #${order._id}`,
      confirm: paymentMethodId ? true : false // Only auto-confirm if payment method provided
    });
    
    console.log('Payment intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      payment_method: paymentIntent.payment_method
    });
    
    // Return response - client will handle confirmation via Stripe Elements
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    return next(new ErrorResponse(`Payment error: ${error.message}`, 500));
  }
});

exports.savePaymentMethod = asyncHandler(async (req, res, next) => {
  const { paymentMethodId, billingDetails } = req.body;
  
  if (!paymentMethodId) {
    return next(new ErrorResponse('Payment method ID is required', 400));
  }
  
  const user = await User.findById(req.user.id).select('+stripeCustomerId');
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Create a new payment method record
    const newPaymentMethod = await PaymentMethod.create({
      userId: req.user.id,
      stripeCustomerId: user.stripeCustomerId,
      stripePaymentMethodId: paymentMethodId,
      type: stripePaymentMethod.type,
      last4: stripePaymentMethod.card ? stripePaymentMethod.card.last4 : null,
      brand: stripePaymentMethod.card ? stripePaymentMethod.card.brand : null,
      expMonth: stripePaymentMethod.card ? stripePaymentMethod.card.exp_month.toString() : null,
      expYear: stripePaymentMethod.card ? stripePaymentMethod.card.exp_year.toString() : null,
      cardHolderName: billingDetails?.name || null,
      isDefault: req.body.isDefault || false
    });
    
    // Add payment method to user
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { paymentMethods: newPaymentMethod._id } }
    );
    
    res.status(201).json({
      success: true,
      data: newPaymentMethod
    });
  } catch (error) {
    console.error('Error saving payment method:', error);
    return next(new ErrorResponse(`Failed to save payment method: ${error.message}`, 500));
  }
});

// @desc    Process a refund
// @route   POST /api/payments/refund
// @access  Private/Admin
exports.createRefund = asyncHandler(async (req, res, next) => {
  const { orderId, amount, reason } = req.body;
  
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }
  
  // Check if order has a payment intent ID
  if (!order.paymentIntentId) {
    return next(new ErrorResponse('No payment found for this order', 400));
  }
  
  try {
    const refund = await stripeService.createRefund({
      paymentIntentId: order.paymentIntentId,
      amount: amount || order.total, // Full refund if amount not specified
      reason,
      orderId: order._id.toString(),
      userId: order.userId
    });
    
    // Update order status
    order.status = 'Refunded';
    await order.save();
    
    res.status(200).json({
      success: true,
      data: refund
    });
  } catch (error) {
    return next(new ErrorResponse(`Refund error: ${error.message}`, 500));
  }
});

// @desc    Get payment methods for the current user
// @route   GET /api/payments/methods
// @access  Private
exports.getPaymentMethods = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+stripeCustomerId');
  
  if (!user.stripeCustomerId) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }
  
  try {
    const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
    
    res.status(200).json({
      success: true,
      count: paymentMethods.length,
      data: paymentMethods
    });
  } catch (error) {
    return next(new ErrorResponse(`Error retrieving payment methods: ${error.message}`, 500));
  }
});

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Verify webhook signature and extract the event
    if (webhookSecret) {
      // Get the signature from the header
      const signature = req.headers['stripe-signature'];
      
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody, // Need to access the raw body, not the parsed JSON
          signature,
          webhookSecret
        );
      } catch (err) {
        console.error(`⚠️ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // For testing without signature verification
      event = req.body;
    }
    
    console.log(`Received event: ${event.type}`);
    
    // Extract the object from the event
    const dataObject = event.data.object;
    
    // Handle the event based on its type
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        await handlePaymentIntentSucceeded(dataObject);
        break;
        
      case 'payment_intent.payment_failed':
        // Handle failed payment
        await handlePaymentIntentFailed(dataObject);
        break;
        
      case 'charge.refunded':
        // Handle refund
        await handleChargeRefunded(dataObject);
        break;
        
      case 'charge.succeeded':
        // We usually process on payment_intent.succeeded instead
        console.log(`Charge ${dataObject.id} succeeded`);
        break;
        
      case 'charge.updated':
        console.log(`Charge ${dataObject.id} was updated`);
        break;
        
      case 'payment_intent.created':
        console.log(`PaymentIntent ${dataObject.id} was created`);
        break;
        
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle payment_intent.succeeded event
 * @param {Object} paymentIntent - The payment intent object
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Get the order ID from the payment intent metadata
    const { orderId } = paymentIntent.metadata || {};
    
    if (!orderId) {
      console.log('No order ID found in payment intent metadata');
      return;
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log(`Order ${orderId} not found`);
      return;
    }
    
    // Update order status
    order.status = 'Processing';
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = 'succeeded';
    order.paymentIntentId = paymentIntent.id;
    
    await order.save();
    
    // Update product stock
    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.productId);
        
        if (product) {
          product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
          // inStock is a virtual property that depends on stockQuantity
          await product.save();
        }
      }
    }
    
    console.log(`Order ${orderId} payment successful and status updated`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle payment_intent.payment_failed event
 * @param {Object} paymentIntent - The payment intent object
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    // Get the order ID from the payment intent metadata
    const { orderId } = paymentIntent.metadata || {};
    
    if (!orderId) {
      console.log('No order ID found in payment intent metadata');
      return;
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log(`Order ${orderId} not found`);
      return;
    }
    
    // Update order status
    order.status = 'Payment Failed';
    order.paymentStatus = 'failed';
    order.paymentErrorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
    
    await order.save();
    
    console.log(`Order ${orderId} payment failed and status updated`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle charge.refunded event
 * @param {Object} charge - The charge object
 */
async function handleChargeRefunded(charge) {
  try {
    // Get the payment intent ID from the charge
    const paymentIntentId = charge.payment_intent;
    
    if (!paymentIntentId) {
      console.log('No payment intent ID found in charge');
      return;
    }
    
    // Find the order with this payment intent ID
    const order = await Order.findOne({ paymentIntentId });
    
    if (!order) {
      console.log(`No order found with payment intent ${paymentIntentId}`);
      return;
    }
    
    // Update order status
    order.status = 'Refunded';
    order.paymentStatus = 'refunded';
    order.refundId = charge.refunds.data[0]?.id;
    order.refundAmount = charge.amount_refunded / 100; // Convert from cents
    order.refundedAt = new Date();
    
    await order.save();
    
    console.log(`Order ${order._id} refunded and status updated`);
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}