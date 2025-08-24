// ------------------------- EXTERNAL DEPENDENCIES ------------------------- //
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// ------------------------- INTERNAL DEPENDENCIES ------------------------- //
const config = require('../../config/env');

/**
 * Configures and returns an array of security-related middlewares.
 * This setup uses industry-standard libraries for robust security.
 */

// 1. Helmet: Secure your app by setting various HTTP headers.
// It helps protect against common vulnerabilities like XSS, clickjacking, etc.
const helmetMiddleware = helmet();

// 2. CORS: Enable Cross-Origin Resource Sharing.
// Uses configuration from the environment config file to control which origins are allowed.
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (config.cors.origin.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: true,
});

// 3. Rate Limiter: Protect against brute-force attacks.
// Limits repeated requests to public APIs and endpoints such as password reset.
const limiterMiddleware = rateLimit({
  windowMs: config.security.rateLimit.windowMs, // Time window
  max: config.security.rateLimit.maxRequests, // Limit each IP to N requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after a few minutes',
});

const securityMiddlewares = [helmetMiddleware, corsMiddleware, limiterMiddleware];

module.exports = { securityMiddlewares };
