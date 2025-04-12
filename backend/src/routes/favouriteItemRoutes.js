// routes/favouriteItemRoutes.js
const express = require('express');
const router = express.Router();
const {
  addTofavourites,
  getfavourites,
  removeFromfavourites,
  checkfavourite
} = require('../controllers/favouriteItemController');
const { protect } = require('../middleware/authMiddleware');
const { validateProductIdParam, handleValidationErrors } = require('../middleware/validators/userValidator');

// Protect all routes
router.use(protect);

// Routes for managing favourites
router.route('/')
  .get(getfavourites)
  .post(addTofavourites);

router.route('/:id')
  .delete(removeFromfavourites);

router.route('/check/:productId')
  .get(validateProductIdParam, handleValidationErrors, checkfavourite);

module.exports = router;