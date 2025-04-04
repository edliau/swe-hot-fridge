// utils/stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe customer
 * @param {Object} customerData - User data to create a customer
 * @returns {Promise<Object>} - Stripe customer object
 */
exports.createCustomer = async (customerData) => {
  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: `${customerData.firstName} ${customerData.lastName}`,
      phone: customerData.phone,
      metadata: {
        userId: customerData.userId
      }
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Retrieve a Stripe customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} - Stripe customer object
 */
exports.getCustomer = async (customerId) => {
  try {
    return await stripe.customers.retrieve(customerId);
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Create a payment intent
 * @param {Object} paymentData - Payment data including amount and customer
 * @returns {Promise<Object>} - Stripe payment intent object
 */
exports.createPaymentIntent = async (paymentData) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(paymentData.amount * 100), // Convert to cents
      currency: paymentData.currency || 'sgd', // Singapore dollar as default
      customer: paymentData.customerId,
      payment_method: paymentData.paymentMethodId,
      confirm: paymentData.confirm || false,
      description: paymentData.description || 'Hot Fridge order payment',
      metadata: {
        orderId: paymentData.orderId,
        userId: paymentData.userId
      },
      receipt_email: paymentData.email,
      setup_future_usage: 'on_session'
    });
    
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} - Confirmed payment intent
 */
exports.confirmPaymentIntent = async (paymentIntentId) => {
  try {
    return await stripe.paymentIntents.confirm(paymentIntentId);
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Capture a payment intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} - Captured payment intent
 */
exports.capturePaymentIntent = async (paymentIntentId) => {
  try {
    return await stripe.paymentIntents.capture(paymentIntentId);
  } catch (error) {
    console.error('Error capturing payment intent:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Create a refund
 * @param {Object} refundData - Refund data
 * @returns {Promise<Object>} - Stripe refund object
 */
exports.createRefund = async (refundData) => {
  try {
    return await stripe.refunds.create({
      payment_intent: refundData.paymentIntentId,
      amount: refundData.amount ? Math.round(refundData.amount * 100) : undefined, // Optional partial refund
      reason: refundData.reason || 'requested_by_customer',
      metadata: {
        orderId: refundData.orderId,
        userId: refundData.userId
      }
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Attach a payment method to a customer
 * @param {string} paymentMethodId - Payment method ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} - Payment method
 */
exports.attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
    
    return await stripe.paymentMethods.retrieve(paymentMethodId);
  } catch (error) {
    console.error('Error attaching payment method:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Set default payment method for a customer
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} - Updated customer
 */
exports.setDefaultPaymentMethod = async (customerId, paymentMethodId) => {
  try {
    return await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * List payment methods for a customer
 * @param {string} customerId - Stripe customer ID
 * @param {string} type - Payment method type (e.g., 'card')
 * @returns {Promise<Array>} - List of payment methods
 */
exports.listPaymentMethods = async (customerId, type = 'card') => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type
    });
    
    return paymentMethods.data;
  } catch (error) {
    console.error('Error listing payment methods:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};

/**
 * Detach a payment method
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} - Detached payment method
 */
exports.detachPaymentMethod = async (paymentMethodId) => {
  try {
    return await stripe.paymentMethods.detach(paymentMethodId);
  } catch (error) {
    console.error('Error detaching payment method:', error);
    throw new Error(`Stripe error: ${error.message}`);
  }
};