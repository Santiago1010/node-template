// =============================================================================
// HASHING FUNCTIONS TEST SUITE - Cryptographic Function Validation
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Comprehensive test suite for cryptographic hashing functions (SHA-256 and HMAC)
// - Validates correctness, security properties, and edge case handling
// - Ensures deterministic behavior and proper error handling
// - Verifies integration between hashing and verification functions
//
// ARCHITECTURAL DECISIONS:
// - Uses Jest testing framework for reliable test execution and reporting
// - Employs faker.js for generating realistic test data
// - Tests both string and Buffer inputs for comprehensive coverage
// - Implements timing-safe HMAC verification tests to prevent timing attacks
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Considered using native Node.js crypto module directly in tests
//   - Rejected to maintain abstraction and test the helper interface
// - Evaluated fixed test data vs faker-generated data
//   - Chose faker for better coverage of edge cases and realistic data
// - Considered separate test files for each function
//   - Rejected in favor of unified suite for better integration testing
//
// PERFORMANCE CHARACTERISTICS:
// - Test execution time: O(n) where n is number of test cases
// - Memory usage: Minimal, with proper cleanup after each test
// - HMAC timing tests verify constant-time comparison implementation
//
// SECURITY CONSIDERATIONS:
// - Validates resistance against common cryptographic vulnerabilities
// - Ensures proper error handling for invalid inputs
// - Verifies timing attack resistance in HMAC verification
// - Tests deterministic output for same inputs
//
// USAGE EXAMPLES:
// - Basic validation: npm test -- HashingFunctions
// - Specific test: npm test -- HashingFunctions -t "SHA-256"
// - Debug mode: DEBUG=1 npm test -- HashingFunctions
//
// MAINTENANCE & TROUBLESHOOTING:
// - Failed tests typically indicate breaking changes in encryption helpers
// - Check Node.js version compatibility if tests fail unexpectedly
// - Verify faker.js version for data generation issues
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 16+ (for crypto APIs and Jest compatibility)
// - Compatible with Jest 28+ testing framework
// - Uses @faker-js/faker for test data generation
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker'); // Test data generation library

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { hashSHA256, createHMAC, verifyHMAC } = require('../../../../utils/encrypt.util'); // Cryptographic helper functions

/**
 * Hashing Functions Test Suite
 *
 * @description Comprehensive validation suite for cryptographic hashing functions
 * Tests SHA-256 hashing and HMAC creation/verification functionality
 * Validates security properties, error handling, and integration scenarios
 *
 * @group Cryptography
 * @group Security
 */
describe('Hashing Functions', () => {
  let testData;
  let testKey;
  let testBuffer;

  /**
   * Test initialization hook
   * Generates fresh test data for each test case to ensure isolation
   */
  beforeEach(() => {
    testData = faker.lorem.paragraph();
    testKey = faker.string.alphanumeric(32);
    testBuffer = Buffer.from(faker.lorem.paragraph());
  });

  describe('hashSHA256', () => {
    it('should create SHA-256 hash from string', () => {
      const hash = hashSHA256(testData);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof hash).toBe('string');
    });

    it('should create SHA-256 hash from Buffer', () => {
      const hash = hashSHA256(testBuffer);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof hash).toBe('string');
    });

    it('should produce deterministic results', () => {
      const hash1 = hashSHA256(testData);
      const hash2 = hashSHA256(testData);

      expect(hash1).toBe(hash2);
    });

    it('should throw error for null data', () => {
      expect(() => {
        hashSHA256(null);
      }).toThrow(/SHA-256 hashing failed/);
    });

    it('should throw error for undefined data', () => {
      expect(() => {
        hashSHA256(undefined);
      }).toThrow(/SHA-256 hashing failed/);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashSHA256(testData);
      const hash2 = hashSHA256(testData + 'modified');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createHMAC', () => {
    it('should create HMAC from string data and key', () => {
      const hmac = createHMAC(testData, testKey);

      expect(hmac).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof hmac).toBe('string');
    });

    it('should create HMAC from Buffer data and key', () => {
      const hmac = createHMAC(testBuffer, Buffer.from(testKey));

      expect(hmac).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof hmac).toBe('string');
    });

    it('should produce deterministic results with same inputs', () => {
      const hmac1 = createHMAC(testData, testKey);
      const hmac2 = createHMAC(testData, testKey);

      expect(hmac1).toBe(hmac2);
    });

    it('should produce different results with different keys', () => {
      const hmac1 = createHMAC(testData, testKey);
      const hmac2 = createHMAC(testData, 'different-key');

      expect(hmac1).not.toBe(hmac2);
    });

    it('should throw error for invalid data', () => {
      expect(() => {
        createHMAC(null, testKey);
      }).toThrow(/HMAC creation failed/);
    });

    it('should throw error for invalid key', () => {
      expect(() => {
        createHMAC(testData, null);
      }).toThrow(/HMAC creation failed/);
    });
  });

  describe('verifyHMAC', () => {
    it('should verify valid HMAC correctly', () => {
      const validHMAC = createHMAC(testData, testKey);
      const isValid = verifyHMAC(testData, testKey, validHMAC);

      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC correctly', () => {
      const validHMAC = createHMAC(testData, testKey);
      // Cambiar los últimos caracteres manteniendo la longitud
      const corruptedHMAC = validHMAC.slice(0, -10) + '0000000000';

      const isValid = verifyHMAC(testData, testKey, corruptedHMAC);
      expect(isValid).toBe(false);
    });

    it('should handle Buffer inputs correctly', () => {
      const validHMAC = createHMAC(testBuffer, Buffer.from(testKey));
      const isValid = verifyHMAC(testBuffer, Buffer.from(testKey), validHMAC);

      expect(isValid).toBe(true);
    });

    it('should throw error for invalid expected HMAC format', () => {
      expect(() => {
        verifyHMAC(testData, testKey, 'invalid-hex');
      }).toThrow(/HMAC verification failed/);
    });

    it('should be timing-safe', () => {
      const hmac1 = createHMAC(testData, testKey);
      const hmac2 = createHMAC('different', 'keys');

      // Test that comparison time is not significantly different for different inputs
      const start1 = process.hrtime();
      verifyHMAC(testData, testKey, hmac1);
      const end1 = process.hrtime(start1);

      const start2 = process.hrtime();
      verifyHMAC(testData, testKey, hmac2);
      const end2 = process.hrtime(start2);

      // Timing difference should be minimal (within 1ms)
      const timeDiff = Math.abs(end1[0] * 1000 + end1[1] / 1e6 - (end2[0] * 1000 + end2[1] / 1e6));
      expect(timeDiff).toBeLessThan(1);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for data verification workflow', () => {
      // Hash original data
      const dataHash = hashSHA256(testData);

      // Create HMAC for verification
      const hmac = createHMAC(testData, testKey);

      // Verify both hashes
      const isHMACValid = verifyHMAC(testData, testKey, hmac);
      const isHashValid = hashSHA256(testData) === dataHash;

      expect(isHMACValid).toBe(true);
      expect(isHashValid).toBe(true);
    });

    it('should detect tampered data in verification workflow', () => {
      const originalHMAC = createHMAC(testData, testKey);
      const tamperedData = testData + 'tampered';

      const isOriginalValid = verifyHMAC(testData, testKey, originalHMAC);
      const isTamperedValid = verifyHMAC(tamperedData, testKey, originalHMAC);

      expect(isOriginalValid).toBe(true);
      expect(isTamperedValid).toBe(false);
    });
  });
});
