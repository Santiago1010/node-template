// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const path = require('path'); // Utilities for working with file and directory paths

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const compression = require('compression'); // Response compression middleware
const cookieParser = require('cookie-parser'); // Parse Cookie header and populate req.cookies
const express = require('express'); // Web framework for Node.js
const helmet = require('helmet'); // Security middleware to set HTTP headers
const moment = require('moment-timezone'); // Date library with timezone support

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const config = require('./config/env'); // Application configuration (environment variables)
const getHelmetConfiguration = require('./config/security/helmet.config'); // Custom Helmet config
const {
  deviceAwareCookieMiddleware, // Device-specific cookie handling
  authStrategyMiddleware, // Authentication strategy initialization
  setDeviceAwareSecurityHeaders, // Dynamic security headers based on device
} = require('./config/security/cookies.config');
const {
  generalLimiter, // Global rate limiting rules
  rateLimitHeaders, // Rate limit headers middleware
} = require('./config/security/rateLimit.config');
const {
  morgan, // Morgan logger instance
  coloredFormat, // Colored log format for development
  fileFormat, // File log format
  stream, // Log file write stream
} = require('./config/tools/morgan.config');
const { ROOT } = require('./helpers/constants.helper'); // Root directory path constant
const { requestLogger } = require('./middlewares/errors/requestLogger.middleware'); // Request logging
const { notFoundHandler } = require('./middlewares/errors/notFound.helper'); // 404 error handler
const errorHandler = require('./middlewares/errors/errorHandler.middleware'); // Global error handler
const corsMiddleware = require('./middlewares/common/cors.middleware');

// Configure moment.js to use application's default timezone and language
moment.tz.setDefault(config.timeZone);
moment.locale(config.lang);

// Initialize Express application
const app = express();

// Apply GZIP compression with level 1 (fastest compression)
app.use(compression({ level: 1 }));

// Set views directory and template engine
app.set('views', path.join(ROOT, 'views')); // EJS templates directory
app.set('view engine', 'ejs'); // Use EJS as template engine

// Security middleware with custom configuration
app.use(helmet(getHelmetConfiguration()));

// Apply rate limiting to all requests
app.use(generalLimiter);
// Add rate limit headers to responses
app.use(rateLimitHeaders);

// Enable CORS with custom configuration
app.use(corsMiddleware);

// Parse cookies using application's secret key
app.use(cookieParser(config.cookieSecret));

// Custom cookie and security middleware
app.use(deviceAwareCookieMiddleware); // Device-aware cookie parsing
app.use(authStrategyMiddleware); // Initialize authentication strategy
app.use(setDeviceAwareSecurityHeaders); // Set device-specific security headers

// Parse request bodies
app.use(express.json({ limit: '150mb' })); // JSON payloads
app.use(
  express.urlencoded({
    // URL-encoded payloads
    limit: '150mb',
    extended: true, // Use qs library for parsing
  })
);

// Serve static files from public directory
app.use(express.static(path.join(ROOT, 'public')));

// HTTP request logging
app.use(morgan(coloredFormat)); // Console logging with colors
app.use(
  morgan(fileFormat, {
    // File logging (skip successful responses)
    stream: stream,
    skip: (_, res) => res.statusCode >= 400,
  })
);

// Custom request logging middleware
app.use(requestLogger());

// Note: API routes would be mounted here
// Example: app.use('/api', require('./routes/api'));

// Handle 404 errors (must be after route declarations)
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// =============================================================================
// Export Configured Express Application
// =============================================================================
module.exports = app;
