// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { encryptHybrid, decryptHybrid } = require('../../../../helpers/encrypt.helper');

/**
 * Hybrid Encryption Functions Test Suite
 */
describe('Hybrid Encryption Functions', () => {
  let testData;
  let publicKey;
  let privateKey;

  beforeAll(() => {
    // Generate real RSA keys for testing
    const { publicKey: pub, privateKey: priv } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    publicKey = pub.export({ type: 'pkcs1', format: 'pem' });
    privateKey = priv.export({ type: 'pkcs1', format: 'pem' });
  });

  beforeEach(() => {
    testData = faker.lorem.paragraph();
    mockAESKey = crypto.randomBytes(32);
    mockIV = crypto.randomBytes(16);
    mockAuthTag = crypto.randomBytes(16);
  });

  describe('encryptHybrid', () => {
    it('should successfully encrypt data using hybrid approach', () => {
      const result = encryptHybrid(testData, publicKey);

      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('encryptedKey');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('authTag');

      // Verify that encrypted data is different from original
      expect(result.encryptedData).not.toBe(testData);

      // Verify that encrypted key is a string (base64 encoded)
      expect(typeof result.encryptedKey).toBe('string');
    });

    it('should throw error when encryption fails with invalid public key', () => {
      const invalidPublicKey = 'invalid-public-key';

      expect(() => {
        encryptHybrid(testData, invalidPublicKey);
      }).toThrow('Hybrid encryption failed');
    });
  });

  describe('decryptHybrid', () => {
    it('should successfully decrypt hybrid encrypted data', () => {
      // First encrypt the data
      const encrypted = encryptHybrid(testData, publicKey);

      // Then decrypt it
      const decrypted = decryptHybrid(encrypted, privateKey);

      expect(decrypted).toBe(testData);
    });

    it('should throw error when decryption fails with invalid private key', () => {
      const encrypted = encryptHybrid(testData, publicKey);
      const invalidPrivateKey = 'invalid-private-key';

      expect(() => {
        decryptHybrid(encrypted, invalidPrivateKey);
      }).toThrow('Hybrid decryption failed');
    });

    it('should throw error when decryption fails with tampered data', () => {
      const encrypted = encryptHybrid(testData, publicKey);

      // Tamper with the encrypted data
      const tamperedEncrypted = {
        ...encrypted,
        encryptedData: Buffer.from('tampered-data'),
      };

      expect(() => {
        decryptHybrid(tamperedEncrypted, privateKey);
      }).toThrow('Hybrid decryption failed');
    });
  });

  describe('Integration Test', () => {
    it('should complete full hybrid encryption/decryption workflow', () => {
      // Encrypt
      const encrypted = encryptHybrid(testData, publicKey);

      // Verify encrypted structure
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('encryptedKey');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');

      // Decrypt
      const decrypted = decryptHybrid(encrypted, privateKey);

      // Verify decryption
      expect(decrypted).toBe(testData);
    });

    it('should work with different data types', () => {
      const testBuffer = Buffer.from(faker.lorem.paragraph(), 'utf8');
      const testBufferString = testBuffer.toString('utf8'); // Convert to string for comparison

      // Encrypt and decrypt Buffer
      const encryptedBuffer = encryptHybrid(testBuffer, publicKey);
      const decrypted = decryptHybrid(encryptedBuffer, privateKey);

      // decryptHybrid always returns string, so we compare with string representation
      expect(typeof decrypted).toBe('string');
      expect(decrypted).toBe(testBufferString);

      // Encrypt and decrypt string
      const testString = faker.lorem.paragraph();
      const encryptedString = encryptHybrid(testString, publicKey);
      const decryptedString = decryptHybrid(encryptedString, privateKey);

      expect(typeof decryptedString).toBe('string');
      expect(decryptedString).toBe(testString);
    });
  });
});
