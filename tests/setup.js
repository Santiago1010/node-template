// =============================================================================
// Jest Global Test Configuration - Test Environment Setup and Cleanup
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Configures global test environment settings for Jest test suite
// - Sets global test timeout to prevent hanging tests
// - Modifies console behavior to reduce test output noise
// - Implements comprehensive test cleanup routines
// - Expected inputs: Jest test execution context
// - Expected outputs: Configured test environment with proper cleanup handlers
//
// ARCHITECTURAL DECISIONS:
// - Global timeout setting prevents indefinite test execution in CI environments
// - Console.log suppression maintains clean test output while preserving other console methods
// - Layered cleanup approach: afterEach for test isolation, afterAll for suite cleanup
// - Preserves original console functionality while overriding specific methods
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative: Individual test timeout settings
//   Trade-off: More verbose test code vs centralized configuration
//   Rationale: Global timeout ensures consistent behavior across all tests
// - Alternative: Complete console mock
//   Trade-off: Loses all console functionality vs selective suppression
//   Rationale: Preserving error/warning methods maintains test debugging capability
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for configuration operations
// - Space complexity: O(1) for stored references and mocks
// - Minimal overhead during test execution
// - Cleanup operations prevent memory leaks across test runs
//
// SECURITY CONSIDERATIONS:
// - No direct security implications in test configuration
// - Console suppression prevents potential information leakage in test output
// - Environment isolation prevents test interference
//
// USAGE EXAMPLES:
// - Basic: This configuration automatically applies to all test files
// - Override: Individual tests can override timeout with jest.setTimeout()
// - Debugging: Temporarily comment console.log mock for specific test debugging
//
// MAINTENANCE & TROUBLESHOOTING:
// - Issue: Tests failing due to timeout may need increased global timeout
// - Debugging: Comment out console.log mock to see logged output
// - Maintenance: Ensure cleanup routines don't interfere with custom test mocks
// - Enhancement: Add custom global utilities for test-specific helpers
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Jest ^24.0.0 or higher
// - Compatible with Node.js ^10.0.0 or higher
// - No third-party dependencies required
//
// =============================================================================

/**
 * Global Test Timeout Configuration
 * @description Sets the default timeout for all test cases in milliseconds
 * @default 10000ms (10 seconds)
 * @rationale Prevents tests from hanging indefinitely in CI environments
 * @override Individual tests can override with jest.setTimeout()
 */
jest.setTimeout(10000);

/**
 * Global Console Configuration
 * @description Modifies global console to reduce test output noise
 * @preservation Maintains all original console methods except log
 * @mock console.log is replaced with jest.fn() to suppress output
 */
global.console = {
  ...console, // Spread operator preserves original console methods
  /**
   * Mocked console.log function
   * @description Suppresses log output while maintaining call tracking
   * @usage jest.fn() allows verification of log calls if needed
   */
  log: jest.fn(),
};

/**
 * After Each Test Cleanup
 * @description Executes cleanup routines after each individual test
 * @clears jest.clearAllMocks() - Resets all mock call tracking
 * @restores jest.restoreAllMocks() - Restores original implementations
 */
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

/**
 * After All Tests Cleanup
 * @description Executes final cleanup after all tests complete
 * @resets jest.resetAllMocks() - Completely resets all mock implementations
 * @purpose Ensures clean test environment for subsequent test runs
 */
afterAll(() => {
  jest.resetAllMocks();
});

// =============================================================================
// MODULE EXPORTS
// =============================================================================
// Note: This file is loaded automatically by Jest through setupFilesAfterEnv
// configuration and does not require explicit exports
