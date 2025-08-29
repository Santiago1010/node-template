// =============================================================================
// Logger Module Mock Configuration - Test Environment Isolation
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Creates Jest mock implementations for logger methods to isolate tests
// - Replaces actual logger functionality with controlled mock functions
// - Prevents actual logging during test execution to maintain clean output
// - Enables verification of logging calls and parameters in test assertions
// - Expected inputs: None (global Jest mock configuration)
// - Expected outputs: Mocked logger instance with spy functions
//
// ARCHITECTURAL DECISIONS:
// - Manual mock implementation preferred over automatic Jest mocking for explicit control
// - Complete interface mocking ensures all logger methods are controlled
// - Isolated mock prevents test contamination from actual logging side effects
// - Consistent mocking approach across all test suites
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative: Use Jest automocking with __mocks__ directory structure
//   Trade-off: More complex setup vs inline explicit mocking
//   Rationale: Inline mocking provides immediate visibility and simpler configuration
// - Alternative: Partial mocking with jest.spyOn() and mockImplementation()
//   Trade-off: More verbose setup vs complete module replacement
//   Rationale: Complete module mock ensures no accidental real logger usage
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) - Constant time mock initialization
// - Space complexity: O(1) - Fixed memory overhead for mock functions
// - No performance impact on test execution compared to real logger
// - Eliminates I/O overhead from actual logging operations
//
// SECURITY CONSIDERATIONS:
// - No security vulnerabilities introduced by mocking
// - Prevents potential sensitive data leakage through test logs
// - Maintains test environment isolation from production logging systems
//
// USAGE EXAMPLES:
// - Basic: Logger methods become jest.fn() available for call verification
// - Verification: expect(logger.info).toHaveBeenCalledWith('expected message')
// - Mock implementation: logger.error.mockImplementation(() => customBehavior)
//
// MAINTENANCE & TROUBLESHOOTING:
// - Issue: If logger interface changes, mock must be updated accordingly
// - Debugging: Use jest.clearAllMocks() between tests to reset call history
// - Enhancement: Add custom mock implementations for specific test scenarios
// - Compatibility: Keep mock in sync with actual logger configuration changes
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Jest ^24.0.0 or higher for mock functionality
// - Compatible with Node.js ^10.0.0 or higher
// - Must match interface of ../config/tools/logger.config
//
// =============================================================================

/**
 * Logger Configuration Module Mock
 * @description Complete mock replacement for logger configuration module
 * @replaces Original module with Jest mock functions for all logging methods
 * @purpose Isolate tests from actual logging implementation and output
 *
 * @example
 * // Basic usage - imported logger will have jest mock functions
 * const logger = require('../config/tools/logger.config');
 * logger.info('test message'); // Becomes jest.fn() call
 *
 * @example
 * // Test verification example
 * test('should log successful operation', () => {
 *   // Execute tested code that should log
 *   someFunctionThatLogs();
 *
 *   // Verify logging occurred
 *   expect(logger.info).toHaveBeenCalledWith(
 *     expect.stringContaining('Operation completed')
 *   );
 * });
 *
 * @since Version 1.0.0
 * @see {@link https://jestjs.io/docs/manual-mocks} Jest manual mocks documentation
 */
jest.mock('../config/tools/logger.config', () => ({
  /**
   * Mock info logger method
   * @type {jest.Mock}
   * @description Mock implementation of info level logging
   */
  info: jest.fn(),

  /**
   * Mock error logger method
   * @type {jest.Mock}
   * @description Mock implementation of error level logging
   */
  error: jest.fn(),

  /**
   * Mock warn logger method
   * @type {jest.Mock}
   * @description Mock implementation of warn level logging
   */
  warn: jest.fn(),

  /**
   * Mock debug logger method
   * @type {jest.Mock}
   * @description Mock implementation of debug level logging
   */
  debug: jest.fn(),
}));

// =============================================================================
// MODULE EXPORTS
// =============================================================================
// Note: This is a Jest global mock configuration that doesn't export anything
// The mock is automatically applied when modules import the logger
