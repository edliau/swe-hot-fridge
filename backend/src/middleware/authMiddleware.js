const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - middleware to verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header (format: "Bearer token")
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check if token exists in cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request object
    req.user = await User.findById(decoded.id);
    
    // Check if user still exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Authorize by role - middleware to check user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Guest user middleware - creates a guest session if no user is logged in
exports.guestSession = (req, res, next) => {
  // If already authenticated, skip
  if (req.user) {
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
      secure: process.env.NODE_ENV === 'production'
    });
    
    req.guestId = guestId;
  } else {
    req.guestId = req.cookies.guestId;
  }
  
  next();
};