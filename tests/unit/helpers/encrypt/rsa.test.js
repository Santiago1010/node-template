// =============================================================================
// RSA HELPER FUNCTIONS - Comprehensive Test Suite
// =============================================================================
// PRIMARY PURPOSE & FUNCTIONALITY:
// - Complete test coverage for RSA cryptographic operations
// - Validates key generation, encryption/decryption, and digital signatures
// - Tests file-based key persistence and loading functionality
// - Verifies error handling and edge cases for cryptographic operations
//
// ARCHITECTURAL DECISIONS:
// - Uses Jest testing framework for reliable test execution
// - Implements temporary directory for isolated file operations
// - Follows Arrange-Act-Assert pattern for test clarity
// - Includes both unit tests and integration tests
//
// ALTERNATIVE APPROACHES ANALYSIS:
// - Could use in-memory keys only, but file persistence is critical for real-world use
// - Mocking file system was considered but rejected to test actual I/O operations
// - Alternative test data formats were evaluated but string/buffer covers most cases
//
// PERFORMANCE CHARACTERISTICS:
// - Key generation: O(n³) where n is key size (modulus length)
// - Encryption/Decryption: O(n³) per operation
// - File I/O: Linear with key size (typically 1-4KB)
//
// SECURITY CONSIDERATIONS:
// - Tests validate cryptographic correctness and error conditions
// - Verifies proper handling of invalid keys and tampered data
// - Ensures separation of concerns between cryptographic operations
//
// USAGE EXAMPLES:
// - See individual test cases for specific usage patterns
// - Demonstrates complete encryption/decryption workflow
// - Shows proper signature generation and verification
//
// MAINTENANCE & TROUBLESHOOTING:
// - Temporary directory is automatically cleaned after tests
// - Each test group has proper setup/teardown
// - Clear error messages facilitate debugging failed tests
//
// DEPENDENCIES & COMPATIBILITY:
// - Requires Node.js 16+ with fs and path modules
// - Uses Jest testing framework
// - Depends on ../../../../helpers/encrypt.helper module
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const fs = require('fs'); // File system operations
const path = require('path'); // Path manipulation utilities

// =============================================================================
// TEST DEPENDENCIES
// =============================================================================
const {
  generateRSAKeyPair,
  loadRSAKeysFromFiles,
  saveRSAKeysToFiles,
  encryptWithRSA,
  decryptWithRSA,
  signWithRSA,
  verifyRSASignature,
} = require('../../../../helpers/encrypt.helper'); // RSA cryptographic operations

/**
 * RSA Helper Functions Test Suite
 *
 * @description Comprehensive validation of RSA cryptographic operations including
 * key generation, encryption/decryption, digital signatures, and file persistence.
 * Verifies both successful operations and error conditions using Jest testing framework.
 *
 * @group Cryptography/RSA
 * @requires jest/testing-framework
 * @see {@link ../../../../helpers/encrypt.helper} for implementation details
 */
describe('RSA Helper Functions', () => {
  const testDir = path.join(__dirname, 'temp-rsa-keys');
  const publicKeyPath = path.join(testDir, 'public.pem');
  const privateKeyPath = path.join(testDir, 'private.pem');
  const testData = 'Mensaje secreto para prueba RSA';
  let publicKey, privateKey;

  // Setup and teardown hooks
  beforeAll(() => {
    // Create isolated directory for test files
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
  });

  afterAll(() => {
    // Cleanup test artifacts to maintain test isolation
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * RSA Key Generation Tests
   *
   * @description Validates key pair generation functionality including
   * default and custom key sizes. Verifies proper PEM format and key structure.
   */
  describe('generateRSAKeyPair', () => {
    it('should generate valid RSA key pair', () => {
      const keyPair = generateRSAKeyPair();

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toMatch(/-----BEGIN PUBLIC KEY-----/);
      expect(keyPair.privateKey).toMatch(/-----BEGIN PRIVATE KEY-----/);
    });

    it('should generate keys with custom size', () => {
      const keyPair = generateRSAKeyPair(1024);

      // Note: 1024-bit keys are insecure for production but useful for testing
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
    });
  });

  /**
   * Key Persistence Tests
   *
   * @description Validates file system operations for storing and loading
   * RSA keys. Verifies file creation, data integrity, and error handling.
   */
  describe('saveRSAKeysToFiles y loadRSAKeysFromFiles', () => {
    it('should save and load keys correctly', () => {
      const keyPair = generateRSAKeyPair();

      saveRSAKeysToFiles(keyPair.publicKey, keyPair.privateKey, publicKeyPath, privateKeyPath);

      expect(fs.existsSync(publicKeyPath)).toBe(true);
      expect(fs.existsSync(privateKeyPath)).toBe(true);

      const loadedKeys = loadRSAKeysFromFiles(publicKeyPath, privateKeyPath);

      expect(loadedKeys.publicKey).toEqual(keyPair.publicKey);
      expect(loadedKeys.privateKey).toEqual(keyPair.privateKey);
    });

    it('should throw error when loading non-existent files', () => {
      expect(() => {
        loadRSAKeysFromFiles('ruta/inexistente/public.pem', 'ruta/inexistente/private.pem');
      }).toThrow(/Failed to load RSA keys from files/);
    });
  });

  /**
   * Encryption/Decryption Tests
   *
   * @description Validates RSA encryption and decryption round-trip functionality.
   * Tests both string and binary data, and verifies proper error handling with invalid keys.
   */
  describe('encryptWithRSA y decryptWithRSA', () => {
    beforeEach(() => {
      // Fresh key pair for each test to ensure test isolation
      const keyPair = generateRSAKeyPair();
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
    });

    it('should encrypt and decrypt text correctly', () => {
      const encrypted = encryptWithRSA(testData, publicKey);
      const decrypted = decryptWithRSA(encrypted, privateKey);

      expect(decrypted).toEqual(testData);
      expect(encrypted).not.toEqual(testData);
    });

    it('should handle binary data', () => {
      const binaryData = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
      const encrypted = encryptWithRSA(binaryData, publicKey);
      const decrypted = decryptWithRSA(encrypted, privateKey);

      expect(decrypted).toEqual(binaryData.toString('utf8'));
    });

    it('should fail with incorrect key', () => {
      const encrypted = encryptWithRSA(testData, publicKey);
      const wrongKeyPair = generateRSAKeyPair();

      expect(() => {
        decryptWithRSA(encrypted, wrongKeyPair.privateKey);
      }).toThrow(/RSA decryption failed/);
    });
  });

  /**
   * Digital Signature Tests
   *
   * @description Validates RSA digital signature generation and verification.
   * Tests signature tampering detection and data modification scenarios.
   */
  describe('signWithRSA y verifyRSASignature', () => {
    beforeEach(() => {
      const keyPair = generateRSAKeyPair();
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
    });

    it('should sign and verify correctly', () => {
      const signature = signWithRSA(testData, privateKey);
      const isValid = verifyRSASignature(testData, signature, publicKey);

      expect(isValid).toBe(true);
    });

    it('should detect invalid signature', () => {
      const signature = signWithRSA(testData, privateKey);
      const tamperedData = testData + 'modificación';

      const isValid = verifyRSASignature(tamperedData, signature, publicKey);
      expect(isValid).toBe(false);
    });

    it('should detect forged signature', () => {
      const signature = signWithRSA(testData, privateKey);
      const fakeSignature = signature.slice(0, -10) + 'abcdefghij';

      const isValid = verifyRSASignature(testData, fakeSignature, publicKey);
      expect(isValid).toBe(false);
    });
  });

  /**
   * Integration Test
   *
   * @description Validates complete RSA workflow including key persistence,
   * encryption, decryption, and digital signatures in a single test scenario.
   */
  describe('Integración completa', () => {
    it('should complete full encryption/signature flow', () => {
      const keyPair = generateRSAKeyPair();
      saveRSAKeysToFiles(keyPair.publicKey, keyPair.privateKey, publicKeyPath, privateKeyPath);

      const loadedKeys = loadRSAKeysFromFiles(publicKeyPath, privateKeyPath);

      const encrypted = encryptWithRSA(testData, loadedKeys.publicKey);
      const signature = signWithRSA(testData, loadedKeys.privateKey);

      const isSignatureValid = verifyRSASignature(testData, signature, loadedKeys.publicKey);
      const decrypted = decryptWithRSA(encrypted, loadedKeys.privateKey);

      expect(isSignatureValid).toBe(true);
      expect(decrypted).toEqual(testData);
    });
  });
});
