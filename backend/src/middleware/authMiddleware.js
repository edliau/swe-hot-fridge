const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Middleware to protect routes - requires JWT authentication
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token, check if this is a guest request
  if (!token) {
    // If guestId exists, attach it to the request and continue
    if (req.cookies.guestId) {
      req.isGuest = true;
      req.guestId = req.cookies.guestId;
      return next();
    }
    
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request object
    req.user = await User.findById(decoded.id);
    req.isGuest = false;
    
    // Check if user still exists
    if (!req.user) {
      return next(new ErrorResponse('User no longer exists', 401));
    }
    
    // Check if user is active
    if (!req.user.isActive) {
      return next(new ErrorResponse('Your account has been deactivated', 401));
    }
    
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Middleware to authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Guests can't access role-restricted routes
    if (req.isGuest) {
      return next(new ErrorResponse('Guest users cannot access this resource', 403));
    }
    
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role '${req.user?.role || 'undefined'}' is not authorized to access this route`, 403));
    }
    
    next();
  };
};

// Guest session middleware - creates or attaches a guest session
exports.guestSession = asyncHandler(async (req, res, next) => {
  // If already authenticated as a user, skip
  if (req.headers.authorization || req.cookies.token) {
    return next();
  }
  
  // Create or retrieve guest session ID
  if (!req.cookies.guestId) {
    // Generate a random guest ID
    const guestId = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
    
    // Set cookie for guest ID (valid for 30 days)
    res.cookie('guestId', guestId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    req.guestId = guestId;
    req.isGuest = true;
  } else {
    req.guestId = req.cookies.guestId;
    req.isGuest = true;
  }
  
  next();
});