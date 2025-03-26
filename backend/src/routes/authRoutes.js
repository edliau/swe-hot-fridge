// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getMe, 
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register and login routes - public
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

// Protected routes - need to be logged in
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Password reset routes - public
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;