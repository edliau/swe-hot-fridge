// routes/favouriteItemRoutes.js
const express = require('express');
const router = express.Router();
const {
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  checkFavorite
} = require('../controllers/favouriteItemController');
const { protect } = require('../middleware/authMiddleware');
const { validateProductIdParam, handleValidationErrors } = require('../middleware/validators/userValidator');

// Protect all routes
router.use(protect);

// Routes for managing favorites
router.route('/')
  .get(getFavorites)
  .post(addToFavorites);

router.route('/:id')
  .delete(removeFromFavorites);

router.route('/check/:productId')
  .get(validateProductIdParam, handleValidationErrors, checkFavorite);

module.exports = router;