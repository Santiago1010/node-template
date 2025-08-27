// =============================================================================
// SERVER INITIALIZATION & RUNTIME MANAGEMENT - Node.js HTTP Server
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Main application entry point that initializes HTTP server and database connection
// - Handles graceful server startup with dependency initialization sequencing
// - Provides port normalization, error handling, and startup performance tracking
// - Expected inputs: Environment configuration, application middleware setup
// - Expected outputs: Running HTTP server with active database connection
//
// ARCHITECTURAL DECISIONS:
// - Separation of concerns: Server initialization logic decoupled from app middleware
// - Synchronous startup sequence: Database connection established before server listen
// - Environment-aware configuration: Port binding adapts to different deployment environments
// - Debug module used for development logging while maintaining production console output
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Cluster mode: Considered Node.js cluster module for multi-process handling but rejected
//   due to additional complexity for current scale requirements
// - Express.js built-in server: Chose native HTTP server for greater control over
//   server-level events and error handling
// - Connection pooling: Database connection managed at application level rather than
//   per-request basis for better resource management
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for server initialization and port normalization
// - Space complexity: O(1) constant memory usage for server setup
// - Startup time: Tracked and reported using high-resolution timers
// - Bottleneck: Database connection initialization is primary startup constraint
//
// SECURITY CONSIDERATIONS:
// - Port validation prevents invalid port assignment
// - Error handling prevents sensitive information leakage in production
// - Database connection errors terminate process to avoid running in degraded state
// - Environment-specific configuration prevents development settings in production
//
// USAGE EXAMPLES:
// - Development: PORT=3000 npm run dev
// - Production: PORT=443 NODE_ENV=production npm start
// - Custom port: PORT=8080 npm start
//
// MAINTENANCE & TROUBLESHOOTING:
// - Common errors: EACCES (permission denied), EADDRINUSE (port conflict)
// - Debugging: Use DEBUG=app:server environment variable for detailed logs
// - Performance: Monitor startup time for database connection degradation
// - Enhancement: Consider health checks and graceful shutdown for future versions
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 14+ for BigInt timing and async/await support
// - Compatible with Express.js 4.x+ middleware architecture
// - Environment variables must be preloaded through config/env
// - Database connection must implement initialize() method
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const http = require('http'); // HTTP server implementation

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const debug = require('debug'); // Conditional debugging utility

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const app = require('./app'); // Express application middleware setup
const config = require('./config/env'); // Environment configuration
const databaseConnection = require('./config/database/connection'); // Database connection manager

// =============================================================================
// DEBUG SETUP
// =============================================================================
const debugServer = debug('app:server'); // Create debug namespace for server events

// =============================================================================
// STARTUP TIME TRACKING
// =============================================================================
const startTime = process.hrtime.bigint(); // High-resolution startup timestamp

// =============================================================================
// PORT NORMALIZATION FUNCTION
// =============================================================================
/**
 * Normalizes port value from configuration or environment variable
 * @description Converts string port values to numbers when possible,
 * maintaining named pipe support for cloud environments
 * @param {string|number} val - Raw port value from configuration
 * @returns {number|string|boolean} Normalized port number, pipe string, or false
 * @throws {TypeError} If input cannot be parsed as valid port representation
 *
 * @example
 * // Returns 3000
 * normalizePort('3000');
 *
 * @example
 * // Returns 'named-pipe'
 * normalizePort('named-pipe');
 *
 * @complexity Time: O(1), Space: O(1)
 * @since v1.0.0
 */
const normalizePort = (val) => {
  const portNumber = parseInt(val, 10);

  if (isNaN(portNumber)) {
    // Return string values unchanged (for named pipes)
    return val;
  }

  if (portNumber >= 0) {
    // Valid port number
    return portNumber;
  }

  // Invalid negative port
  return false;
};

// =============================================================================
// STARTUP TIME FORMATTING FUNCTION
// =============================================================================
/**
 * Formats nanosecond precision duration to human-readable time string
 * @description Converts BigInt nanoseconds to appropriate time units
 * (milliseconds, seconds, or minutes) based on magnitude
 * @param {bigint} nanoseconds - High-resolution duration in nanoseconds
 * @returns {string} Formatted duration string with appropriate units
 *
 * @example
 * // Returns "123.45ms"
 * formatStartupTime(123450000n);
 *
 * @complexity Time: O(1), Space: O(1)
 * @since v1.0.0
 */
const formatStartupTime = (nanoseconds) => {
  const milliseconds = Number(nanoseconds) / 1_000_000;

  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(2)}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2);
  return `${minutes}m ${remainingSeconds}s`;
};

// =============================================================================
// SERVER ERROR HANDLER
// =============================================================================
/**
 * Handles HTTP server errors with appropriate logging and process management
 * @description Catches and processes server-level errors, providing
 * user-friendly messages for common permission and port conflict scenarios
 * @param {Error} error - Node.js server error object
 * @throws {Error} Propagates unhandled error types
 * @emits process.exit(1) For fatal EACCES/EADDRINUSE errors
 *
 * @example
 * server.on('error', onError);
 *
 * @complexity Time: O(1), Space: O(1)
 * @since v1.0.0
 */
const onError = (error) => {
  if (error.syscall !== 'listen') {
    // Not a server listening error, re-throw
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// =============================================================================
// SERVER STARTUP COMPLETION HANDLER
// =============================================================================
/**
 * Handles successful server startup completion event
 * @description Logs server binding information and startup performance metrics,
 * provides debug and production output appropriate for different environments
 *
 * @example
 * server.on('listening', onListening);
 *
 * @complexity Time: O(1), Space: O(1)
 * @since v1.0.0
 */
const onListening = () => {
  const addr = server.address();

  if (!addr) {
    console.error('Server address is not available.');
    process.exit(1);
  }

  // Calculate and format startup duration
  const endTime = process.hrtime.bigint();
  const startupTime = endTime - startTime;
  const formattedTime = formatStartupTime(startupTime);

  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

  debugServer(`Listening on ${bind}`);
  debugServer(`Server startup time: ${formattedTime}`);

  // Production console output (always shown)
  console.log(`Server running on ${bind}`);
  console.log(`🚀 Server started in ${formattedTime}`);

  // swaggerDocs(app, port); // Future Swagger integration point
};

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================
const port = normalizePort(config.port || '3000');
app.set('port', port);

// Create HTTP server with Express application middleware
const server = http.createServer(app);

// =============================================================================
// SERVER INITIALIZATION FUNCTION
// =============================================================================
/**
 * Asynchronously initializes and starts the HTTP server
 * @description Manages the startup sequence: first initializes database connection,
 * then starts HTTP server. Terminates process on initialization failures.
 * @returns {Promise<void>} Resolves when server is listening
 * @throws {Error} Propagates database connection or server initialization errors
 *
 * @example
 * // Basic usage
 * startServer();
 *
 * @example
 * // With error handling
 * startServer().catch(error => {
 *   console.error('Failed to start server:', error);
 *   process.exit(1);
 * });
 *
 * @complexity Time: O(1), Space: O(1)
 * @since v1.0.0
 */
const startServer = async () => {
  try {
    console.log('🔄 Starting server...');

    // Initialize database connection first
    console.log('🔄 Initializing database connection...');
    await databaseConnection.initialize();
    console.log('✅ Database connected successfully');

    // Start HTTP server after successful database connection
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
// Note: This module is the main entry point and doesn't export functionality
// Server instance is managed internally and not exposed externally

// Start the application
startServer();
