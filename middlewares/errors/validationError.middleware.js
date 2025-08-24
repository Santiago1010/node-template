// =============================================================================
// VALIDATION ERROR HANDLER MIDDLEWARE - Express Validation Error Handling and Transformation
// =============================================================================
// Comprehensive validation error handling middleware for Express applications.
// Provides multiple approaches to handle validation errors from different sources:
// - express-validator validation results
// - Zod schema validation
// - Custom validation with message customization
// - Multi-source validation (body, params, query simultaneously)
// - Validation with data sanitization support
//
// Key Features:
// - Standardized error formatting across different validation libraries
// - Support for grouped errors by field for better client-side handling
// - Boom integration for consistent HTTP error responses
// - Flexible validation source targeting (body, params, query)
// - Data sanitization capabilities
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const boom = require('@hapi/boom'); // HTTP error utilities
const { validationResult } = require('express-validator'); // Express validator result extraction

/**
 * Middleware to handle express-validator validation errors
 * Extracts validation errors, formats them consistently, and passes to error handler
 * @param {Request} req - Express request object
 * @param {Response} _ - Express response object (unused)
 * @param {NextFunction} next - Express next function
 *
 * @example
 * // In route definition:
 * router.post('/user', [
 *   check('email').isEmail(),
 *   check('password').isLength({ min: 6 }),
 *   validationErrorHandler
 * ], userController.create);
 */
const validationErrorHandler = (req, _, next) => {
  // Extract validation errors from request
  const errors = validationResult(req);

  // If validation errors exist, format and pass to error handler
  if (!errors.isEmpty()) {
    // Format individual errors with consistent structure
    const formattedErrors = errors.array().map((error) => ({
      field: error.param || error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
      nestedErrors: error.nestedErrors || undefined, // Include nested errors if present
    }));

    // Group errors by field for easier client-side processing
    const groupedErrors = formattedErrors.reduce((acc, error) => {
      const field = error.field;
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push({
        message: error.message,
        value: error.value,
        location: error.location,
      });
      return acc;
    }, {});

    // Create Boom error with detailed validation information
    const boomError = boom.badRequest('Validation error in submitted data', {
      errors: formattedErrors,
      groupedErrors,
      totalErrors: formattedErrors.length,
    });

    return next(boomError);
  }

  // No validation errors, continue to next middleware
  next();
};

/**
 * Middleware factory for Zod schema validation
 * Validates request data against a Zod schema and formats any errors
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Request property to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function with Zod validation
 *
 * @example
 * // Define Zod schema
 * const userSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(6)
 * });
 *
 * // In route definition:
 * router.post('/user', zodValidationHandler(userSchema), userController.create);
 */
const zodValidationHandler = (schema, source = 'body') => {
  return (req, _, next) => {
    try {
      // Extract data from specified source
      const dataToValidate = req[source];

      // Validate against schema (throws ZodError if invalid)
      const validatedData = schema.parse(dataToValidate);

      // Replace request data with validated (and potentially coerced) data
      req[source] = validatedData;
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        // Format Zod errors consistently
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.received,
          expected: err.expected,
        }));

        // Create Boom error with Zod validation details
        const boomError = boom.badRequest('Schema validation error', {
          errors: formattedErrors,
          source,
          totalErrors: formattedErrors.length,
        });

        return next(boomError);
      }
      // Pass non-Zod errors to general error handler
      next(error);
    }
  };
};

/**
 * Factory class for creating custom validation error handlers
 * Provides various utility methods for common validation scenarios
 */
class ValidationErrorFactory {
  /**
   * Creates a validator with a custom error message
   * @param {Array} validatorChain - Express-validator validation chain
   * @param {string} customMessage - Custom error message for validation failures
   * @returns {Array} Array containing validator chain and error handler
   *
   * @static
   *
   * @example
   * router.post('/user',
   *   ValidationErrorFactory.createWithCustomMessage([
   *     check('email').isEmail(),
   *     check('password').isLength({ min: 6 })
   *   ], 'Invalid user data format')
   * );
   */
  static createWithCustomMessage(validatorChain, customMessage) {
    return [
      validatorChain,
      (req, _, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const boomError = boom.badRequest(customMessage, {
            errors: errors.array(),
            totalErrors: errors.array().length,
          });
          return next(boomError);
        }
        next();
      },
    ];
  }

  /**
   * Creates a validator that validates multiple request sources simultaneously
   * @param {Object} schemas - Object mapping source names to Zod schemas
   * @param {Object} options - Configuration options
   * @param {boolean} options.replaceValidatedData - Whether to replace request data with validated data
   * @returns {Function} Express middleware function for multi-source validation
   *
   * @static
   *
   * @example
   * const schemas = {
   *   body: userSchema,
   *   params: idSchema,
   *   query: paginationSchema
   * };
   *
   * router.put('/user/:id',
   *   ValidationErrorFactory.createMultiSourceValidator(schemas)
   * );
   */
  static createMultiSourceValidator(schemas, options = {}) {
    return (req, _, next) => {
      const errors = [];
      const validatedData = {};

      // Validate each specified source
      for (const [source, schema] of Object.entries(schemas)) {
        try {
          if (req[source] && schema) {
            const result = schema.parse(req[source]);
            validatedData[source] = result;
          }
        } catch (error) {
          if (error.name === 'ZodError') {
            errors.push(
              ...error.errors.map((err) => ({
                source,
                field: err.path.join('.'),
                message: err.message,
                code: err.code,
                value: err.received,
              }))
            );
          }
        }
      }

      // If errors found, create Boom error with all validation issues
      if (errors.length > 0) {
        const boomError = boom.badRequest('Validation error across multiple sources', {
          errors,
          totalErrors: errors.length,
          sources: Object.keys(schemas),
        });
        return next(boomError);
      }

      // Replace request data with validated data if configured
      if (options.replaceValidatedData) {
        Object.assign(req, validatedData);
      }

      next();
    };
  }

  /**
   * Creates a validator with data sanitization capabilities
   * @param {Object} config - Configuration object
   * @param {Array} config.validators - Express-validator validation chains
   * @param {Array} config.sanitizers - Sanitization functions
   * @param {string} config.source - Request property to validate ('body', 'params', 'query')
   * @returns {Function} Express middleware function with sanitization and validation
   *
   * @static
   *
   * @example
   * ValidationErrorFactory.createWithSanitization({
   *   validators: [check('email').isEmail()],
   *   sanitizers: [trimFields, escapeHtml],
   *   source: 'body'
   * })
   */
  static createWithSanitization(config) {
    return (req, _, next) => {
      const { validators, sanitizers, source = 'body' } = config;

      // Apply sanitizers if provided
      if (sanitizers) {
        for (const sanitizer of sanitizers) {
          req[source] = sanitizer(req[source]);
        }
      }

      // Run all validators and handle results
      Promise.all(validators.map((validator) => validator.run(req)))
        .then(() => {
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            const boomError = boom.badRequest('Validation error after sanitization', {
              errors: errors.array(),
              totalErrors: errors.array().length,
            });
            return next(boomError);
          }
          next();
        })
        .catch(next);
    };
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = { validationErrorHandler, zodValidationHandler, ValidationErrorFactory };
