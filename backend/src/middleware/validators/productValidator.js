const { body, param, validationResult } = require('express-validator');

// Validation for creating/updating products
exports.validateProduct = [
  body('name')
    .notEmpty().withMessage('Product name is required')
    .isString().withMessage('Product name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .notEmpty().withMessage('Product description is required')
    .isString().withMessage('Product description must be a string'),
  
  body('price')
    .notEmpty().withMessage('Product price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number'),
  
  body('isOnSale')
    .optional()
    .isBoolean().withMessage('isOnSale must be a boolean value'),
  
  body('category')
    .notEmpty().withMessage('Product category is required')
    .isIn(['meat', 'dairy', 'produce', 'beverages', 'alcohol', 'condiments', 'cleaning', 'personal-care', 'other'])
    .withMessage('Invalid category value'),
  
  body('image')
    .optional()
    .isString().withMessage('Image must be a string URL'),
  
  body('ingredients')
    .optional()
    .isArray().withMessage('Ingredients must be an array'),
  
  body('nutritionalInfo')
    .optional()
    .isObject().withMessage('Nutritional info must be an object'),
  
  body('nutritionalInfo.calories')
    .optional()
    .isFloat({ min: 0 }).withMessage('Calories must be a positive number'),
  
  body('nutritionalInfo.fat')
    .optional()
    .isFloat({ min: 0 }).withMessage('Fat must be a positive number'),
  
  body('nutritionalInfo.carbs')
    .optional()
    .isFloat({ min: 0 }).withMessage('Carbs must be a positive number'),
  
  body('nutritionalInfo.protein')
    .optional()
    .isFloat({ min: 0 }).withMessage('Protein must be a positive number'),
  
  body('nutritionalInfo.sodium')
    .optional()
    .isFloat({ min: 0 }).withMessage('Sodium must be a positive number'),
  
  body('allergens')
    .optional()
    .isArray().withMessage('Allergens must be an array'),
  
  body('inStock')
    .optional()
    .isBoolean().withMessage('inStock must be a boolean value'),
  
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock quantity must be a positive integer'),
  
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean value')
];

// Validation for product ratings/reviews
exports.validateProductRating = [
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('review')
    .optional()
    .isString().withMessage('Review must be a string')
];

// Validation for product ID parameter
exports.validateProductId = [
  param('id')
    .isMongoId().withMessage('Invalid product ID format')
];

// Middleware to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};