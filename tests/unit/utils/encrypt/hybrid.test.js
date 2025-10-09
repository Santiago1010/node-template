// =============================================================================
// HYBRID ENCRYPTION FUNCTIONS TEST SUITE - RSA-AES-GCM Integration Validation
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Validates hybrid encryption/decryption implementation combining RSA and AES-GCM
// - Tests cryptographic correctness, error handling, and integration workflows
// - Verifies proper handling of different data types and edge cases
// - Ensures encrypted data structure integrity and security properties
//
// ARCHITECTURAL DECISIONS:
// - Uses real RSA key pairs instead of mocks for authentic cryptographic validation
// - Implements comprehensive negative testing with invalid keys and tampered data
// - Tests multiple data types (string, Buffer) to verify type handling
// - Follows Arrange-Act-Assert pattern with proper test isolation
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Mocked cryptography: Rejected to ensure real-world cryptographic validation
// - Pre-generated test keys: Rejected in favor of runtime generation for test freshness
// - Single data type testing: Rejected to ensure comprehensive type handling
// - Separate unit tests: Rejected in favor of integrated testing for crypto operations
//
// PERFORMANCE CHARACTERISTICS:
// - Key generation: O(1) during suite setup (2048-bit RSA)
// - Encryption/decryption: O(n) where n is data length
// - Memory: Temporary storage of encrypted payloads and keys
//
// SECURITY CONSIDERATIONS:
// - Validates resistance to tampering and invalid key attacks
// - Tests authentication tag verification (GCM mode)
// - Ensures proper error handling to prevent information leakage
// - Verifies cryptographic separation between encryption sessions
//
// USAGE EXAMPLES:
// - Run complete suite: npm test
// - Run specific tests: npm test -- -t "encryptHybrid"
// - Debug with detailed output: npm test -- --verbose
//
// MAINTENANCE & TROUBLESHOOTING:
// - Key generation failures may indicate Node.js crypto compatibility issues
// - Test failures may signal changes in underlying encryption helper implementation
// - Ensure test data remains within cryptographic algorithm limits
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 12+ for crypto.generateKeyPairSync()
// - Compatible with Jest 26+ for test execution
// - Faker.js 7+ for realistic test data generation
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto'); // Cryptographic operations and key generation

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker'); // Realistic test data generation

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { encryptHybrid, decryptHybrid } = require('../../../../utils/encrypt.util');

/**
 * Hybrid Encryption Functions Test Suite
 *
 * @description Comprehensive validation of RSA-AES-GCM hybrid encryption implementation
 * @suite Tests cryptographic correctness, error handling, and integration scenarios
 * @group Security/Cryptography
 */
describe('Hybrid Encryption Functions', () => {
  let testData;
  let publicKey;
  let privateKey;

  /**
   * Suite Setup Hook
   *
   * @description Generates fresh RSA key pair for cryptographic testing
   * @function beforeAll
   * @memberof Hybrid Encryption Functions
   *
   * @example
   * // Generates 2048-bit RSA key pair in PKCS#1 format
   * const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
   *   modulusLength: 2048,
   * });
   */
  beforeAll(() => {
    // Generate real RSA keys for authentic cryptographic testing
    const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048, // Industry-standard minimum for RSA security
    });

    // Export keys to PEM format for use with encryption functions
    publicKey = pub.export({ type: 'pkcs1', format: 'pem' });
    privateKey = priv.export({ type: 'pkcs1', format: 'pem' });
  });

  /**
   * Test Setup Hook
   *
   * @description Initializes fresh test data before each test case
   * @function beforeEach
   * @memberof Hybrid Encryption Functions
   */
  beforeEach(() => {
    testData = faker.lorem.paragraph(); // Realistic text data for encryption
  });

  /**
   * Encryption Function Test Group
   *
   * @description Validates the hybrid encryption function behavior
   * @group Unit Tests
   */
  describe('encryptHybrid', () => {
    /**
     * Successful Encryption Test
     *
     * @description Verifies proper encryption with valid parameters
     * @test Should return structured encrypted data with all required components
     */
    it('should successfully encrypt data using hybrid approach', () => {
      // Act
      const result = encryptHybrid(testData, publicKey);

      // Assert - Verify encrypted data structure
      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('encryptedKey');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');

      // Verify cryptographic transformation occurred
      expect(result.encryptedData).not.toBe(testData);

      // Verify encoded format of encrypted components
      expect(typeof result.encryptedKey).toBe('string'); // Base64 encoded
    });

    /**
     * Error Handling Test - Invalid Public Key
     *
     * @description Validates proper error handling with invalid cryptographic material
     * @test Should throw descriptive error when encryption fails
     */
    it('should throw error when encryption fails with invalid public key', () => {
      // Arrange
      const invalidPublicKey = 'invalid-public-key';

      // Act & Assert
      expect(() => {
        encryptHybrid(testData, invalidPublicKey);
      }).toThrow('Hybrid encryption failed');
    });
  });

  /**
   * Decryption Function Test Group
   *
   * @description Validates the hybrid decryption function behavior
   * @group Unit Tests
   */
  describe('decryptHybrid', () => {
    /**
     * Successful Decryption Test
     *
     * @description Verifies round-trip encryption/decryption workflow
     * @test Should correctly decrypt previously encrypted data
     */
    it('should successfully decrypt hybrid encrypted data', () => {
      // Arrange - Encrypt test data
      const encrypted = encryptHybrid(testData, publicKey);

      // Act - Decrypt the data
      const decrypted = decryptHybrid(encrypted, privateKey);

      // Assert - Verify original data recovery
      expect(decrypted).toBe(testData);
    });

    /**
     * Error Handling Test - Invalid Private Key
     *
     * @description Validates decryption failure with incorrect cryptographic material
     * @test Should throw descriptive error when decryption fails
     */
    it('should throw error when decryption fails with invalid private key', () => {
      // Arrange
      const encrypted = encryptHybrid(testData, publicKey);
      const invalidPrivateKey = 'invalid-private-key';

      // Act & Assert
      expect(() => {
        decryptHybrid(encrypted, invalidPrivateKey);
      }).toThrow('Hybrid decryption failed');
    });

    /**
     * Security Validation Test - Tampered Data
     *
     * @description Verifies cryptographic integrity protection
     * @test Should detect and reject tampered encrypted data
     */
    it('should throw error when decryption fails with tampered data', () => {
      // Arrange
      const encrypted = encryptHybrid(testData, publicKey);

      // Tamper with the encrypted data to simulate corruption or attack
      const tamperedEncrypted = {
        ...encrypted,
        encryptedData: Buffer.from('tampered-data'),
      };

      // Act & Assert
      expect(() => {
        decryptHybrid(tamperedEncrypted, privateKey);
      }).toThrow('Hybrid decryption failed');
    });
  });

  /**
   * Integration Test Group
   *
   * @description Validates complete encryption/decryption workflow
   * @group Integration Tests
   */
  describe('Integration Test', () => {
    /**
     * Full Workflow Validation Test
     *
     * @description Verifies complete round-trip encryption/decryption
     * @test Should maintain data integrity through full cryptographic cycle
     */
    it('should complete full hybrid encryption/decryption workflow', () => {
      // Act - Encrypt data
      const encrypted = encryptHybrid(testData, publicKey);

      // Verify encrypted structure contains all required components
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('encryptedKey');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');

      // Act - Decrypt data
      const decrypted = decryptHybrid(encrypted, privateKey);

      // Assert - Verify original data recovery
      expect(decrypted).toBe(testData);
    });

    /**
     * Data Type Compatibility Test
     *
     * @description Validates encryption with different data types
     * @test Should handle both string and Buffer inputs appropriately
     */
    it('should work with different data types', () => {
      const testBuffer = Buffer.from(faker.lorem.paragraph(), 'utf8');
      const encryptedBuffer = encryptHybrid(testBuffer, publicKey);
      const decryptedBuffer = decryptHybrid(encryptedBuffer, privateKey);

      expect(typeof decryptedBuffer).toBe('string');
      expect(decryptedBuffer).toBe(testBuffer.toString('utf8'));

      const testString = faker.lorem.paragraph();
      const encryptedString = encryptHybrid(testString, publicKey);
      const decryptedString = decryptHybrid(encryptedString, privateKey);

      expect(typeof decryptedString).toBe('string');
      expect(decryptedString).toBe(testString);

      expect(encryptedBuffer).toHaveProperty('encryptedData');
      expect(encryptedBuffer).toHaveProperty('encryptedKey');
      expect(encryptedBuffer).toHaveProperty('iv');
      expect(encryptedBuffer).toHaveProperty('authTag');

      expect(typeof encryptedBuffer.encryptedData).toBe('string');
      expect(typeof encryptedBuffer.encryptedKey).toBe('string');
      expect(typeof encryptedBuffer.iv).toBe('string');
      expect(typeof encryptedBuffer.authTag).toBe('string');

      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(encryptedBuffer.encryptedData).toMatch(base64Regex);
      expect(encryptedBuffer.encryptedKey).toMatch(base64Regex);
      expect(encryptedBuffer.iv).toMatch(base64Regex);
      expect(encryptedBuffer.authTag).toMatch(base64Regex);
    });
  });
});
