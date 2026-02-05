// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { isDevelopmentMode } = require('../../helpers/debug.helper');

/**
 * Wraps an asynchronous Express middleware/route handler to properly catch errors
 * @param {Function} asyncFunction - Async function to wrap with error handling
 * @returns {Function} Express middleware function with error handling
 *
 * @example
 * // Instead of:
 * router.get('/', async (req, res, next) => {
 *   try { /* logic *\/ } catch (error) { next(error) }
 * });
 *
 * // Use:
 * router.get('/', asyncErrorHandler(async (req, res, next) => {
 *   /* logic without try-catch *\/
 * }));
 */
const asyncErrorHandler = (asyncFunction) => {
  return (req, res, next) => {
    // Resolve the promise returned by the async function
    // If it rejects, catch the error and pass it to Express error handling
    Promise.resolve(asyncFunction(req, res, next)).catch(next);
  };
};

/**
 * Sets up global handlers for unhandled promise rejections and uncaught exceptions
 * Prevents application from running in an unknown state by shutting down in production
 * when critical unhandled errors occur
 *
 * @example
 * // Call once during application startup
 * globalAsyncErrorHandler();
 */
const globalAsyncErrorHandler = () => {
  // Handle unhandled promise rejections (common with async/await)
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);

    // In production, exit process to avoid running in undefined state
    if (!isDevelopmentMode(true)) {
      console.log('Shutting down server due to unhandled promise rejection');
      process.exit(1);
    }
  });

  // Handle uncaught exceptions (synchronous errors that weren't caught)
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);

    // Always exit on uncaught exceptions as application state may be compromised
    console.log('Shutting down server due to uncaught exception');
    process.exit(1);
  });
};

/**
 * Utility class providing structured approaches to async error handling
 * Offers multiple methods for different use cases in Express applications
 */
class AsyncMiddleware {
  /**
   * Wraps a single async middleware function with error handling
   * @param {Function} asyncFunction - Async Express middleware function
   * @returns {Function} Wrapped middleware with error handling
   *
   * @static
   */
  static wrap(asyncFunction) {
    return (req, res, next) => {
      Promise.resolve(asyncFunction(req, res, next)).catch(next);
    };
  }

  /**
   * Wraps multiple async middleware functions with error handling
   * @param {Array<Function>} middlewares - Array of async middleware functions
   * @returns {Array<Function>} Array of wrapped middlewares with error handling
   *
   * @static
   *
   * @example
   * // Apply to multiple middlewares
   * app.use(AsyncMiddleware.wrapMultiple([middleware1, middleware2]));
   */
  static wrapMultiple(middlewares) {
    return middlewares.map((middleware) => this.wrap(middleware));
  }

  /**
   * Wraps all async methods in a controller object with error handling
   * @param {Object} controller - Controller object containing async methods
   * @returns {Object} New controller object with all methods wrapped
   *
   * @static
   *
   * @example
   * // Wrap entire controller
   * const wrappedController = AsyncMiddleware.wrapController(myController);
   */
  static wrapController(controller) {
    const wrappedController = {};

    for (const [key, method] of Object.entries(controller)) {
      if (typeof method === 'function') {
        // Bind method to maintain 'this' context and wrap with error handling
        wrappedController[key] = this.wrap(method.bind(controller));
      } else {
        // Copy non-function properties as-is
        wrappedController[key] = method;
      }
    }

    return wrappedController;
  }
}

// Initialize global error handlers immediately when module is imported
globalAsyncErrorHandler();

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { asyncErrorHandler, globalAsyncErrorHandler, AsyncMiddleware };
