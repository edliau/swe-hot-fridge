const { body, param, validationResult } = require('express-validator');

// validate creating an address
exports.validateCreateAddress = [
    body('streetAddress')
      .notEmpty().withMessage('Please add a street address')
      .isString().withMessage('Street address must be a string'),
  
    body('apartment')
      .optional()
      .isString().withMessage('Apartment must be a string'),
  
    body('phoneNumber')
      .notEmpty().withMessage('Please add a phone number')
      .isString().withMessage('Phone number must be a string'),
  
    body('city')
      .notEmpty().withMessage('City is required')
      .isString().withMessage('City must be a string'),
  
    body('state')
      .notEmpty().withMessage('State is required')
      .isString().withMessage('State must be a string'),
  
    body('postalCode')
      .notEmpty().withMessage('Postal code is required')
      .isString().withMessage('Postal code must be a string'),
  
    body('country')
      .optional()
      .isString().withMessage('Country must be a string'),
  
    body('isDefault')
      .optional()
      .isBoolean().withMessage('isDefault must be true or false'),
  
    body('deliveryInstructions')
      .optional()
      .isString().withMessage('Delivery instructions must be a string')
  ];
  
// validate updating an address
exports.validateUpdateAddress = [
    body('streetAddress')
      .optional()
      .isString().withMessage('Street address must be a string'),
  
    body('apartment')
      .optional()
      .isString().withMessage('Apartment must be a string'),
  
    body('phoneNumber')
      .optional()
      .isString().withMessage('Phone number must be a string'),
  
    body('city')
      .optional()
      .isString().withMessage('City must be a string'),
  
    body('state')
      .optional()
      .isString().withMessage('State must be a string'),
  
    body('postalCode')
      .optional()
      .isString().withMessage('Postal code must be a string'),
  
    body('country')
      .optional()
      .isString().withMessage('Country must be a string'),
  
    body('isDefault')
      .optional()
      .isBoolean().withMessage('isDefault must be true or false'),
  
    body('deliveryInstructions')
      .optional()
      .isString().withMessage('Delivery instructions must be a string')
  ];  

// validate dietary preferences
exports.validateDietaryPreferences = [
  body('dietaryPreferences')
    .isArray().withMessage('Dietary preferences must be an array')
    .custom((value) => {
      const allowed = [
        'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
        'keto', 'paleo', 'halal', 'kosher', 'sugar-free', 'nut-free'
      ];
      for (const pref of value) {
        if (!allowed.includes(pref)) {
          throw new Error(`Invalid dietary preference: ${pref}`);
        }
      }
      return true;
    })
];

//validate adding or removing favorites
exports.validateProductIdParam = [
  param('productId')
    .isMongoId().withMessage('Invalid product ID')
];

// middleware to catch validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
