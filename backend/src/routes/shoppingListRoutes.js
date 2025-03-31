const express = require('express');
const router = express.Router();
const {
  createShoppingList,
  getShoppingLists,
  updateShoppingList,
  deleteShoppingList
} = require('../controllers/shoppingListController');

const { protect } = require('../middleware/authMiddleware');
const {
  validateShoppingList,
  handleValidationErrors
} = require('../middleware/validators/shoppingListValidator');

// All routes require auth
router.use(protect);

router.route('/')
  .post(validateShoppingList, handleValidationErrors, createShoppingList)
  .get(getShoppingLists);

router.route('/:id')
  .put(validateShoppingList, handleValidationErrors, updateShoppingList)
  .delete(deleteShoppingList);

module.exports = router;