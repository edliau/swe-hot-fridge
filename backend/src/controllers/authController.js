// controllers/authController.js
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already in use', 400));
  }

  // Create user with role if provided (and authorized)
  // Check if the request is coming from an admin user who can set roles
  const userRole = req.user && req.user.role === 'admin' ? role || 'user' : 'user';
  
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: userRole
  });

  // Generate verification token
  if (process.env.EMAIL_VERIFICATION === 'true') {
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

    const message = `You are receiving this email because you need to confirm your email address. Please make a GET request to: \n\n ${verificationUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message
      });

      res.status(200).json({ 
        success: true, 
        message: 'Verification email sent' 
      });
    } catch (err) {
      user.verificationToken = undefined;
      user.verificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } else {
    // If email verification is disabled, set user as verified
    user.emailVerified = true;
    await user.save({ validateBeforeSave: false });
    
    // Send token response
    sendTokenResponse(user, 201, res);
  }
});

// @desc    Register admin user
// @route   POST /api/auth/register-admin
// @access  Private/Admin
exports.registerAdmin = asyncHandler(async (req, res, next) => {
  // Only admins can access this route (middleware will handle this)
  const { firstName, lastName, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already in use', 400));
  }

  // Create admin user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'admin'
  });

  // If email verification is enabled, handle that
  if (process.env.EMAIL_VERIFICATION === 'true') {
    const verificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

    const message = `You are receiving this email because you need to confirm your email address. Please make a GET request to: \n\n ${verificationUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message
      });

      res.status(200).json({ 
        success: true, 
        message: 'Verification email sent' 
      });
    } catch (err) {
      user.verificationToken = undefined;
      user.verificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } else {
    // If email verification is disabled, set user as verified
    user.emailVerified = true;
    await user.save({ validateBeforeSave: false });
    
    // Send token response
    sendTokenResponse(user, 201, res);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockedUntil');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / (1000 * 60));
    return next(new ErrorResponse(`Account is locked. Try again in ${minutesLeft} minutes`, 401));
  }

  // Check if user is active
  //if (!user.isActive) {
  //  return next(new ErrorResponse('Your account has been deactivated, please contact support', 401));
  //}

  // Check if email is verified
  if (process.env.EMAIL_VERIFICATION === 'true' && !user.emailVerified) {
    return next(new ErrorResponse('Please verify your email address first', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Increment login attempts
    await user.incrementLoginAttempts();
    
    // If max attempts reached, inform the user
    if (user.loginAttempts >= 5) {
      return next(new ErrorResponse('Too many failed login attempts. Account locked for 15 minutes', 401));
    }
    
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // If guest user has a cart, transfer it to the logged-in user
  if (req.cookies.guestId) {
    // This will be implemented in a separate function
    // await transferGuestCartToUser(req.cookies.guestId, user._id);
    
    // Clear the guest cookie
    res.cookie('guestId', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const verificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    verificationToken,
    verificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Set emailVerified to true
  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // If it's a guest session, return only guest information
  if (req.isGuest) {
    return res.status(200).json({
      success: true,
      data: {
        isGuest: true,
        guestId: req.guestId
      }
    });
  }

  const user = await User.findById(req.user.id)
    .populate('addresses')
    .populate('paymentMethods');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  // Check if user is a guest
  if (req.isGuest) {
    return next(new ErrorResponse('Guest users cannot update profile details', 401));
  }

  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  // If email is being updated, check if it already exists
  if (fieldsToUpdate.email) {
    const existingUser = await User.findOne({ 
      email: fieldsToUpdate.email,
      _id: { $ne: req.user.id }
    });
    
    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }
    
    // If email verification is enabled, mark as unverified until new email is verified
    if (process.env.EMAIL_VERIFICATION === 'true' && fieldsToUpdate.email !== req.user.email) {
      fieldsToUpdate.emailVerified = false;
      
      // Send verification email logic would go here
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  // Check if user is a guest
  if (req.isGuest) {
    return next(new ErrorResponse('Guest users cannot update password', 401));
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Validate new password
  if (req.body.newPassword.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error('Email error:', err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired token', 400));
  }

  // Validate new password
  if (req.body.password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};