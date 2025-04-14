// routes/shoppingListRoutes.js
const express = require('express');
const router = express.Router();
const {
  createShoppingList,
  getShoppingLists,
  getShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addItemToList,
  removeItemFromList,
  updateItemQuantity
} = require('../controllers/shoppingListController');

const { protect } = require('../middleware/authMiddleware');
const {
  validateShoppingList,
  handleValidationErrors
} = require('../middleware/validators/shoppingListValidator');

// All routes require auth
router.use(protect);

// Routes for list management
router.route('/')
  .post(validateShoppingList, handleValidationErrors, createShoppingList)
  .get(getShoppingLists);

router.route('/:id')
  .get(getShoppingList)
  .put(validateShoppingList, handleValidationErrors, updateShoppingList)
  .delete(deleteShoppingList);

// Routes for list items
router.route('/:id/items')
  .post(addItemToList);

router.route('/:id/items/:productId')
  .put(updateItemQuantity)
  .delete(removeItemFromList);

module.exports = router;