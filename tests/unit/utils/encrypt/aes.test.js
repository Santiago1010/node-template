// =============================================================================
// AES KEY GENERATION & CRYPTOGRAPHIC OPERATIONS TEST SUITE
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Comprehensive test suite for AES cryptographic key generation and operations
// - Validates key generation, password-based key derivation, and encryption/decryption workflows
// - Tests error handling and edge cases for cryptographic operations
// - Ensures compatibility between internal and external cryptographic implementations
//
// ARCHITECTURAL DECISIONS:
// - Uses Jest testing framework for behavior-driven development (BDD) style tests
// - Leverages faker.js for realistic test data generation
// - Separates test concerns into distinct describe blocks for each cryptographic function
// - Uses beforeEach for test setup to ensure test isolation
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Considered using dedicated cryptographic test vectors but chose faker for broader coverage
// - Evaluated synchronous vs asynchronous key generation; chose sync for test simplicity
// - Could have used external test data files but opted for programmatic generation for maintainability
//
// PERFORMANCE CHARACTERISTICS:
// - Time complexity: O(1) for individual test cases, O(n) for overall test suite
// - Space complexity: Minimal memory usage for key generation and encryption operations
// - Cryptographic operations are CPU-intensive but optimized by Node.js crypto module
//
// SECURITY CONSIDERATIONS:
// - Tests validate proper error handling for invalid cryptographic parameters
// - Verifies deterministic key derivation from passwords with salt
// - Ensures IV uniqueness and proper encryption mode usage
// - Validates authentication tag verification in GCM mode
//
// USAGE EXAMPLES:
// - Basic key generation and encryption/decryption workflow validation
// - Password-based key derivation with custom parameters
// - Cross-validation between internal and external cryptographic implementations
//
// MAINTENANCE & TROUBLESHOOTING:
// - Failed tests typically indicate breaking changes in cryptographic helpers
// - Monitor for Node.js crypto module deprecations or changes
// - Update test data generation if faker.js API changes
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js v16+ for crypto module features
// - Compatible with Jest 28+ testing framework
// - Uses @faker-js/faker v8+ for test data generation
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto'); // Node.js cryptographic functions for random byte generation

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker'); // Test data generation for realistic password and text data

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { KEY_SIZES } = require('../../../../utils/constants.util'); // Cryptographic constants for key and IV sizes
const {
  generateAESKey,
  deriveAESKeyFromPassword,
  generateIV,
  encryptWithAES,
  decryptWithAES,
} = require('../../../../utils/encrypt.util'); // AES cryptographic operations implementation

/**
 * AES Key Generation Functions Test Suite
 *
 * @description Comprehensive validation suite for AES cryptographic operations including
 * key generation, password-based key derivation, encryption/decryption workflows,
 * and error condition handling. Tests ensure implementation correctness and security
 * best practices.
 *
 * @test {generateAESKey} Validates AES key generation with default and custom sizes
 * @test {deriveAESKeyFromPassword} Tests password-based key derivation functionality
 * @test {generateIV} Verifies initialization vector generation
 * @test {encryptWithAES} {decryptWithAES} Validates encryption/decryption round-trip
 *
 * @since 1.0.0
 * @see {@link module:../../../../utils/encrypt.util} for implementation details
 */
describe('AES Key Generation Functions', () => {
  let testPassword;
  let testSalt;
  let testPlaintext;
  let testKey;
  let encryptedData;

  /**
   * Test setup hook
   * @description Generates fresh test data before each test execution
   * @hook beforeEach
   */
  beforeEach(() => {
    testPassword = faker.internet.password({ length: 20 }); // Generate secure test password
    testSalt = faker.string.alphanumeric(16); // Create random salt
    testPlaintext = faker.lorem.paragraph(); // Generate realistic test data
  });

  describe('generateAESKey', () => {
    it('should generate a random AES key with default size', () => {
      const key = generateAESKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(KEY_SIZES.AES);
    });

    it('should generate a random AES key with custom size', () => {
      const customSize = 16;
      const key = generateAESKey(customSize);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(customSize);
    });

    it('should throw error for invalid key size', () => {
      expect(() => {
        generateAESKey('invalid_size');
      }).toThrow(/AES key generation failed/);
    });
  });

  describe('deriveAESKeyFromPassword', () => {
    it('should derive a key from password with default parameters', () => {
      const key = deriveAESKeyFromPassword(testPassword, testSalt);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(KEY_SIZES.AES);
    });

    it('should derive a key with custom parameters', () => {
      const customIterations = 50000;
      const customKeySize = 16;
      const key = deriveAESKeyFromPassword(testPassword, testSalt, customIterations, customKeySize);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(customKeySize);
    });

    it('should produce deterministic results with same inputs', () => {
      const key1 = deriveAESKeyFromPassword(testPassword, testSalt);
      const key2 = deriveAESKeyFromPassword(testPassword, testSalt);
      expect(key1).toEqual(key2);
    });

    it('should produce different results with different salts', () => {
      const key1 = deriveAESKeyFromPassword(testPassword, 'salt1');
      const key2 = deriveAESKeyFromPassword(testPassword, 'salt2');
      expect(key1).not.toEqual(key2);
    });

    it('should handle Buffer salt input', () => {
      const saltBuffer = Buffer.from(testSalt, 'utf8');
      const key = deriveAESKeyFromPassword(testPassword, saltBuffer);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(KEY_SIZES.AES);
    });

    it('should throw error for invalid parameters', () => {
      expect(() => {
        deriveAESKeyFromPassword(null, testSalt);
      }).toThrow(/AES key derivation failed/);
    });
  });

  describe('generateIV', () => {
    it('should generate a random IV with default size', () => {
      const iv = generateIV();
      expect(iv).toBeInstanceOf(Buffer);
      expect(iv.length).toBe(KEY_SIZES.IV);
    });

    it('should generate a random IV with custom size', () => {
      const customSize = 12;
      const iv = generateIV(customSize);
      expect(iv).toBeInstanceOf(Buffer);
      expect(iv.length).toBe(customSize);
    });

    it('should generate unique IVs each time', () => {
      const iv1 = generateIV();
      const iv2 = generateIV();
      expect(iv1).not.toEqual(iv2);
    });

    it('should throw error for invalid size', () => {
      expect(() => {
        generateIV('invalid_size');
      }).toThrow(/IV generation failed/);
    });
  });

  describe('Encryption/Decryption with External Keys', () => {
    it('should encrypt and decrypt using externally generated keys', () => {
      const externalKey = crypto.randomBytes(KEY_SIZES.AES);
      const externalIV = crypto.randomBytes(KEY_SIZES.IV);

      const encrypted = encryptWithAES(testPlaintext, externalKey, externalIV);
      const decrypted = decryptWithAES(encrypted.encrypted, externalKey, encrypted.iv, encrypted.authTag);

      expect(decrypted).toBe(testPlaintext);
    });

    it('should fail when using incorrect key for decryption', () => {
      const externalKey = crypto.randomBytes(KEY_SIZES.AES);
      const wrongKey = crypto.randomBytes(KEY_SIZES.AES);
      const iv = crypto.randomBytes(KEY_SIZES.IV);

      const encrypted = encryptWithAES(testPlaintext, externalKey, iv);

      expect(() => {
        decryptWithAES(encrypted.encrypted, wrongKey, encrypted.iv, encrypted.authTag);
      }).toThrow(/decryption failed|bad decrypt|Invalid key/);
    });

    it('should be compatible between internal and external keys', () => {
      const internalKey = generateAESKey();
      const externalKey = crypto.randomBytes(KEY_SIZES.AES);
      const iv = generateIV();

      const encryptedInternal = encryptWithAES(testPlaintext, internalKey, iv);

      expect(() => {
        decryptWithAES(encryptedInternal.encrypted, externalKey, encryptedInternal.iv, encryptedInternal.authTag);
      }).toThrow();

      const encryptedExternal = encryptWithAES(testPlaintext, externalKey, iv);

      expect(() => {
        decryptWithAES(encryptedExternal.encrypted, internalKey, encryptedExternal.iv, encryptedExternal.authTag);
      }).toThrow();
    });
  });

  describe('Integration Test', () => {
    it('should complete full AES encryption/decryption workflow', () => {
      const aesKey = generateAESKey();
      const iv = generateIV();

      const encrypted = encryptWithAES(testPlaintext, aesKey, iv);
      const decrypted = decryptWithAES(encrypted.encrypted, aesKey, encrypted.iv, encrypted.authTag);

      expect(decrypted).toBe(testPlaintext);
      expect(encrypted.encrypted).not.toBe(testPlaintext);
    });

    it('should work with password-derived keys', () => {
      const derivedKey = deriveAESKeyFromPassword(testPassword, testSalt);
      const iv = generateIV();

      const encrypted = encryptWithAES(testPlaintext, derivedKey, iv);
      const decrypted = decryptWithAES(encrypted.encrypted, derivedKey, encrypted.iv, encrypted.authTag);

      expect(decrypted).toBe(testPlaintext);
    });
  });

  describe('encryptWithAES Error Cases', () => {
    it('should throw error with invalid key', () => {
      const invalidKey = 'short'; // Key too short for AES-256
      expect(() => {
        encryptWithAES(testPlaintext, invalidKey);
      }).toThrow(/AES encryption failed/);
    });

    it('should throw error with non-string/Buffer data', () => {
      const validKey = generateAESKey();
      const invalidData = { some: 'object' }; // Invalid data type
      expect(() => {
        encryptWithAES(invalidData, validKey);
      }).toThrow(/AES encryption failed/);
    });

    it('should throw error with null data', () => {
      const validKey = generateAESKey();
      expect(() => {
        encryptWithAES(null, validKey);
      }).toThrow(/AES encryption failed/);
    });
  });

  describe('Parameter Type Handling (Branch Coverage)', () => {
    beforeEach(() => {
      testKey = generateAESKey();
      const iv = generateIV();
      encryptedData = encryptWithAES(testPlaintext, testKey, iv);
    });

    it('should handle string key parameter', () => {
      const keyAsString = testKey.toString('base64');

      const result = decryptWithAES(encryptedData.encrypted, keyAsString, encryptedData.iv, encryptedData.authTag);

      expect(result).toBe(testPlaintext);
    });

    it('should handle Buffer key parameter', () => {
      const result = decryptWithAES(encryptedData.encrypted, testKey, encryptedData.iv, encryptedData.authTag);

      expect(result).toBe(testPlaintext);
    });

    it('should handle string IV parameter', () => {
      const ivAsString = encryptedData.iv;

      const result = decryptWithAES(encryptedData.encrypted, testKey, ivAsString, encryptedData.authTag);

      expect(result).toBe(testPlaintext);
    });

    it('should handle Buffer IV parameter', () => {
      const ivAsBuffer = Buffer.from(encryptedData.iv, 'base64');

      const result = decryptWithAES(encryptedData.encrypted, testKey, ivAsBuffer, encryptedData.authTag);

      expect(result).toBe(testPlaintext);
    });

    it('should handle string authTag parameter', () => {
      const authTagAsString = encryptedData.authTag;

      const result = decryptWithAES(encryptedData.encrypted, testKey, encryptedData.iv, authTagAsString);

      expect(result).toBe(testPlaintext);
    });

    it('should handle Buffer authTag parameter', () => {
      const authTagAsBuffer = Buffer.from(encryptedData.authTag, 'base64');

      const result = decryptWithAES(encryptedData.encrypted, testKey, encryptedData.iv, authTagAsBuffer);

      expect(result).toBe(testPlaintext);
    });

    it('should handle mixed parameter types', () => {
      const keyAsString = testKey.toString('base64');
      const ivAsBuffer = Buffer.from(encryptedData.iv, 'base64');
      const authTagAsString = encryptedData.authTag;

      const result = decryptWithAES(encryptedData.encrypted, keyAsString, ivAsBuffer, authTagAsString);

      expect(result).toBe(testPlaintext);
    });
  });
});
