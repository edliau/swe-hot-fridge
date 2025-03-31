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

const {
  validateCreateAddress,
  validateUpdateAddress,
  validateDietaryPreferences,
  validateProductIdParam,
  handleValidationErrors
} = require('../middleware/validators/userValidator');

const {
  validateCreatePaymentMethod,
  validateUpdatePaymentMethod
} = require('../middleware/validators/paymentMethodValidator');

// Protect all routes
router.use(protect);

// Address routes
router.route('/address')
  .post(validateCreateAddress, handleValidationErrors, addAddress)
  .get(getAddresses);

router.route('/address/:id')
  .put(validateUpdateAddress, handleValidationErrors, updateAddress)
  .delete(deleteAddress);

// Payment method routes (still under user scope)
router.route('/payment')
  .post(validateCreatePaymentMethod, handleValidationErrors, addPaymentMethod)
  .get(getPaymentMethods);

router.route('/payment/:id')
  .put(validateUpdatePaymentMethod, handleValidationErrors, updatePaymentMethod)
  .delete(deletePaymentMethod);

// Dietary preferences route
router.put('/preferences', validateDietaryPreferences, handleValidationErrors, setDietaryPreferences);

// Favorites routes
router.get('/favorites', getFavorites);
router.post('/favorites/:productId', validateProductIdParam, handleValidationErrors, addToFavorites);
router.delete('/favorites/:productId', validateProductIdParam, handleValidationErrors, removeFromFavorites);

module.exports = router;