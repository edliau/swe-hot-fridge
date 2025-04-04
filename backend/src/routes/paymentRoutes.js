// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createPaymentIntent, 
  handleWebhook, 
  createRefund, 
  getPaymentMethods 
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Webhook doesn't need to be authenticated
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected payment routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.get('/methods', protect, getPaymentMethods);

// Admin-only routes
router.post('/refund', protect, authorize('admin'), createRefund);

module.exports = router;