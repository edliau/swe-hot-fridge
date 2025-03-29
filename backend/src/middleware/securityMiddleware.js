// middleware/securityMiddleware.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

// Set up security middleware
const setupSecurity = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Prevent XSS attacks
  app.use(xss());

  // Sanitize data to prevent NoSQL injection
  app.use(mongoSanitize());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Set up CORS - Access-Control-Allow-Origin
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }));

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message: 'Too many requests, please try again later'
    }
  });
  
  // Apply rate limiting to API routes
  app.use('/api', apiLimiter);

  // Login rate limiter (more restrictive)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes'
    }
  });
  
  // Apply login rate limiting specifically to the login route
  app.use('/api/auth/login', loginLimiter);

  return app;
};

module.exports = setupSecurity;