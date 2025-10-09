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
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const {
  generateRSAKeyPair,
  loadRSAKeysFromFiles,
  saveRSAKeysToFiles,
  encryptWithRSA,
  decryptWithRSA,
  signWithRSA,
  verifyRSASignature,
} = require('../../../../utils/encrypt.util');

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
  let publicKey, privateKey;

  // Setup and teardown hooks
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('generateRSAKeyPair', () => {
    it('should generate valid RSA key pair with default size', () => {
      const keyPair = generateRSAKeyPair();

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toMatch(/-----BEGIN PUBLIC KEY-----/);
      expect(keyPair.privateKey).toMatch(/-----BEGIN PRIVATE KEY-----/);
    });

    it('should generate keys with custom size', () => {
      const keySize = 1024;
      const keyPair = generateRSAKeyPair(keySize);

      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
    });

    it('should generate unique key pairs on multiple calls', () => {
      const keyPair1 = generateRSAKeyPair();
      const keyPair2 = generateRSAKeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });

    it('should throw error when RSA key generation fails', () => {
      const originalGenerateKeyPairSync = crypto.generateKeyPairSync;
      crypto.generateKeyPairSync = jest.fn(() => {
        throw new Error('Key generation failed');
      });

      expect(() => generateRSAKeyPair()).toThrow('RSA key pair generation failed: Key generation failed');

      crypto.generateKeyPairSync = originalGenerateKeyPairSync;
    });
  });

  describe('saveRSAKeysToFiles and loadRSAKeysFromFiles', () => {
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
        loadRSAKeysFromFiles('nonexistent/public.pem', 'nonexistent/private.pem');
      }).toThrow(/Failed to load RSA keys from files/);
    });

    it('should throw error when writing files fails', () => {
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn(() => {
        throw new Error('Write error');
      });

      expect(() => saveRSAKeysToFiles('publicKey', 'privateKey', 'public.pem', 'private.pem')).toThrow(
        'Failed to save RSA keys to files: Write error'
      );

      fs.writeFileSync = originalWriteFileSync;
    });
  });

  describe('encryptWithRSA and decryptWithRSA', () => {
    beforeEach(() => {
      const keyPair = generateRSAKeyPair();
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
    });

    it('should encrypt and decrypt text correctly', () => {
      const testMessage = faker.string.alphanumeric(50);
      const encrypted = encryptWithRSA(testMessage, publicKey);
      const decrypted = decryptWithRSA(encrypted, privateKey);

      expect(decrypted).toEqual(testMessage);
      expect(encrypted).not.toEqual(testMessage);
    });

    it('should handle empty string', () => {
      const encrypted = encryptWithRSA('', publicKey);
      const decrypted = decryptWithRSA(encrypted, privateKey);
      expect(decrypted).toEqual('');
    });

    it('should handle binary data', () => {
      const binaryData = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
      const encrypted = encryptWithRSA(binaryData, publicKey);
      const decrypted = decryptWithRSA(encrypted, privateKey);

      expect(decrypted).toEqual(binaryData.toString('utf8'));
    });

    it('should fail with incorrect key', () => {
      const testMessage = faker.lorem.sentence();
      const encrypted = encryptWithRSA(testMessage, publicKey);
      const wrongKeyPair = generateRSAKeyPair();

      expect(() => {
        decryptWithRSA(encrypted, wrongKeyPair.privateKey);
      }).toThrow(/RSA decryption failed/);
    });

    it('should handle special characters', () => {
      const testMessage = 'Mensaje con caractéres especiales: áéíóúñÑ!@#$%^&*()';
      const encrypted = encryptWithRSA(testMessage, publicKey);
      const decrypted = decryptWithRSA(encrypted, privateKey);

      expect(decrypted).toEqual(testMessage);
    });
  });

  describe('signWithRSA and verifyRSASignature', () => {
    beforeEach(() => {
      const keyPair = generateRSAKeyPair();
      publicKey = keyPair.publicKey;
      privateKey = keyPair.privateKey;
    });

    it('should sign and verify correctly', () => {
      const testMessage = faker.string.alphanumeric(100);
      const signature = signWithRSA(testMessage, privateKey);
      const isValid = verifyRSASignature(testMessage, signature, publicKey);

      expect(isValid).toBe(true);
    });

    it('should detect invalid signature', () => {
      const testMessage = faker.lorem.sentence();
      const signature = signWithRSA(testMessage, privateKey);
      const tamperedData = testMessage + 'tampered';

      const isValid = verifyRSASignature(tamperedData, signature, publicKey);
      expect(isValid).toBe(false);
    });

    it('should detect forged signature', () => {
      const testMessage = faker.lorem.sentence();
      const signature = signWithRSA(testMessage, privateKey);
      const fakeSignature = signature.slice(0, -10) + 'abcdefghij';

      const isValid = verifyRSASignature(testMessage, fakeSignature, publicKey);
      expect(isValid).toBe(false);
    });

    it('should handle empty string', () => {
      const signature = signWithRSA('', privateKey);
      const isValid = verifyRSASignature('', signature, publicKey);
      expect(isValid).toBe(true);
    });

    it('should handle binary data signatures', () => {
      const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04]);
      const signature = signWithRSA(binaryData, privateKey);
      const isValid = verifyRSASignature(binaryData, signature, publicKey);

      expect(isValid).toBe(true);
    });

    it('should handle unexpected verification errors and return false', () => {
      const originalCreateVerify = crypto.createVerify;
      crypto.createVerify = jest.fn(() => {
        return {
          update: jest.fn(),
          verify: jest.fn(() => {
            throw new Error('Unexpected crypto error');
          }),
        };
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = verifyRSASignature('data', 'signature', '-----BEGIN PUBLIC KEY-----');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected error in RSA verification:', expect.any(Error));

      crypto.createVerify = originalCreateVerify;
      consoleSpy.mockRestore();
    });

    it('should return false for invalid public key format', () => {
      const testMessage = faker.lorem.sentence();
      const signature = signWithRSA(testMessage, privateKey);

      const isValid = verifyRSASignature(testMessage, signature, 'invalid-public-key');
      expect(isValid).toBe(false);
    });
  });

  describe('Full Integration Test', () => {
    it('should complete full encryption/signature flow', () => {
      const testMessage = faker.lorem.sentence();
      const keyPair = generateRSAKeyPair();

      saveRSAKeysToFiles(keyPair.publicKey, keyPair.privateKey, publicKeyPath, privateKeyPath);
      const loadedKeys = loadRSAKeysFromFiles(publicKeyPath, privateKeyPath);

      const encrypted = encryptWithRSA(testMessage, loadedKeys.publicKey);
      const signature = signWithRSA(testMessage, loadedKeys.privateKey);

      const isSignatureValid = verifyRSASignature(testMessage, signature, loadedKeys.publicKey);
      const decrypted = decryptWithRSA(encrypted, loadedKeys.privateKey);

      expect(isSignatureValid).toBe(true);
      expect(decrypted).toEqual(testMessage);
    });

    it('should handle multiple operations consistently', () => {
      const testData = faker.string.alphanumeric(75);
      const keyPair = generateRSAKeyPair();

      // Multiple encryption/decryption cycles
      let encrypted, decrypted;
      for (let i = 0; i < 3; i++) {
        encrypted = encryptWithRSA(testData, keyPair.publicKey);
        decrypted = decryptWithRSA(encrypted, keyPair.privateKey);
        expect(decrypted).toEqual(testData);
      }

      // Multiple signing/verification cycles
      let signature, isValid;
      for (let i = 0; i < 3; i++) {
        signature = signWithRSA(testData, keyPair.privateKey);
        isValid = verifyRSASignature(testData, signature, keyPair.publicKey);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should throw error when encrypting with invalid public key', () => {
      expect(() => {
        encryptWithRSA('test', 'invalid-public-key');
      }).toThrow(/RSA encryption failed/);
    });

    it('should throw error when decrypting with invalid private key', () => {
      const encrypted = encryptWithRSA('test', publicKey);
      expect(() => {
        decryptWithRSA(encrypted, 'invalid-private-key');
      }).toThrow(/RSA decryption failed/);
    });

    it('should throw error when signing with invalid private key', () => {
      expect(() => {
        signWithRSA('test', 'invalid-private-key');
      }).toThrow(/RSA signing failed/);
    });

    it('should return false when verifying with invalid public key', () => {
      const signature = signWithRSA('test', privateKey);
      const isValid = verifyRSASignature('test', signature, 'invalid-public-key');
      expect(isValid).toBe(false);
    });

    it('should handle decryption of tampered data', () => {
      const encrypted = encryptWithRSA('test', publicKey);
      const tamperedEncrypted = encrypted.slice(0, -10) + 'abcdefghij';

      expect(() => {
        decryptWithRSA(tamperedEncrypted, privateKey);
      }).toThrow(/RSA decryption failed/);
    });
  });
});
