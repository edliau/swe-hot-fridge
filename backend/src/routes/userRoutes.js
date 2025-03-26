// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  addPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
  deletePaymentMethod,
  setDietaryPreferences,
  addToFavorites,
  removeFromFavorites,
  getFavorites
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Address routes
router.route('/address')
  .post(addAddress)
  .get(getAddresses);

router.route('/address/:id')
  .put(updateAddress)
  .delete(deleteAddress);

// Payment method routes
router.route('/payment')
  .post(addPaymentMethod)
  .get(getPaymentMethods);

router.route('/payment/:id')
  .put(updatePaymentMethod)
  .delete(deletePaymentMethod);

// Dietary preferences route
router.put('/preferences', setDietaryPreferences);

// Favorites routes
router.get('/favorites', getFavorites);
router.post('/favorites/:productId', addToFavorites);
router.delete('/favorites/:productId', removeFromFavorites);

module.exports = router;