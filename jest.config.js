// =============================================================================
// Jest Test Configuration - Node.js Application Testing Suite
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Centralized configuration for Jest testing framework in Node.js projects
// - Defines test discovery patterns, coverage reporting, and module resolution
// - Configures environment setup and test execution parameters
// - Expected inputs: Test files following naming conventions
// - Expected outputs: Test results, coverage reports, and JUnit XML reports
//
// ARCHITECTURAL DECISIONS:
// - Uses Babel for JavaScript transformation to support modern syntax
// - Implements module aliasing for cleaner import paths in tests
// - Combines multiple test pattern matching for flexible test discovery
// - Uses separate setup files for environment configuration and test initialization
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Alternative: Use zero-config testing with default Jest settings
//   Trade-off: Less control over test structure and module resolution
//   Rationale: Explicit configuration provides better project-specific optimization
// - Alternative: Use TypeScript for configuration
//   Trade-off: Additional compilation step for config file
//   Rationale: JavaScript configuration provides simpler runtime execution
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(n) where n is number of test files
// - Space complexity: O(1) for configuration overhead
// - Parallel test execution by default for optimal performance
// - File system caching enabled for faster subsequent test runs
//
// SECURITY CONSIDERATIONS:
// - No direct security implications as this is test configuration
// - Environment variables are isolated to test environment
// - Coverage reports exclude sensitive directory structures
//
// USAGE EXAMPLES:
// - Basic: Run all tests - `npm test` or `jest`
// - Coverage: Generate coverage report - `jest --coverage`
// - Watch mode: Develop with hot-reload - `jest --watch`
//
// MAINTENANCE & TROUBLESHOOTING:
// - Common issues: Ensure Babel configuration matches project syntax
// - Debugging: Use --verbose flag for detailed test output
// - Performance: Monitor test timeouts for slow integration tests
// - Enhancement: Add custom reporters for specialized reporting needs
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js ^12.0.0 or higher
// - Compatible with Jest ^27.0.0
// - Requires babel-jest for JavaScript transformation
// - Compatible with CommonJS and ES Module systems
//
// =============================================================================

/** @type {import('jest').Config} Jest configuration type definition */
const config = {
  /**
   * Root Directory
   * @description Base directory for test resolution and module lookup
   * @default process.cwd() - Current working directory
   */
  rootDir: process.cwd(),

  /**
   * Test Match Patterns
   * @description Glob patterns for test file discovery
   * @pattern Matches files in tests directory with .test.js, .spec.js, test.js, or spec.js extensions
   */
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/tests/**/test.js',
    '<rootDir>/tests/**/spec.js',
  ],

  /**
   * Test Path Ignore Patterns
   * @description Directories excluded from test discovery
   * @excludes Development, configuration, and generated directories
   */
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.debug/',
    '/.github/',
    '/.vscode/',
    '/docker/',
    '/kubernetes/',
    '/migrations/',
    '/seeders/',
    '/schemas/',
    '/templates/',
    '/config/',
  ],

  /**
   * Coverage Collection Configuration
   * @description Files included in coverage analysis
   * @includes All JavaScript files excluding dependencies, tests, and generated files
   */
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!<rootDir>/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!**/migrations/**',
    '!**/seeders/**',
    '!**/scripts/**',
    '!**/docker/**',
    '!**/kubernetes/**',
    '!**/.debug/**',
    '!**/.github/**',
    '!**/.vscode/**',
    '!**/config/**',
    '!**/docs/**',
    '!**/templates/**',
    '!**/schemas/**',
    '!**/sync_models/**',
    '!**/models/**',
  ],

  /**
   * Coverage Directory
   * @description Output location for coverage reports
   * @default <rootDir>/coverage
   */
  coverageDirectory: '<rootDir>/coverage',

  /**
   * Coverage Reporters
   * @description Output formats for coverage analysis
   * @format text: Console output, lcov: IDE integration, html: Browseable report
   */
  coverageReporters: ['text', 'lcov', 'html'],

  /**
   * Setup Files After Environment
   * @description Initialization scripts run after test environment setup
   * @usage Global test setup, mocking, and extended assertions
   */
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  /**
   * Module Transformation
   * @description File transformation configuration
   * @transformer babel-jest: Transforms modern JavaScript using Babel
   */
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  /**
   * Module Name Mapper
   * @description Import alias resolution for cleaner module paths
   * @mapping Maps @prefix paths to corresponding directories
   */
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@helpers/(.*)$': '<rootDir>/helpers/$1',
    '^@middlewares/(.*)$': '<rootDir>/middlewares/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1',
    '^@schemas/(.*)$': '<rootDir>/schemas/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@validations/(.*)$': '<rootDir>/helpers/validations/$1',
  },

  /**
   * Test Environment Configuration
   * @description Runtime environment and setup configuration
   * @environment node: Node.js environment for backend testing
   * @setupFiles Environment variable and global test configuration
   */
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env-setup.js'],

  /**
   * Test Timeout
   * @description Maximum execution time per test case (milliseconds)
   * @default 10000ms (10 seconds)
   * @adjustment Increase for integration/e2e tests, decrease for unit tests
   */
  testTimeout: 10000,

  /**
   * Verbose Output
   * @description Detailed test execution reporting
   * @default true - Enable detailed test hierarchy and results
   */
  verbose: true,

  /**
   * Watch Plugins
   * @description Enhanced watch mode functionality
   * @plugin jest-watch-typeahead: Filter tests by filename or test name
   */
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  coverageProvider: 'v8',
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = config;
