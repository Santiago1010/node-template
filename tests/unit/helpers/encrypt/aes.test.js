// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto'); // Node.js cryptographic functions

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { faker } = require('@faker-js/faker'); // Test data generation

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { KEY_SIZES } = require('../../../../helpers/constants.helper'); // Cryptographic constants
const {
  generateAESKey,
  deriveAESKeyFromPassword,
  generateIV,
  encryptWithAES,
  decryptWithAES,
} = require('../../../../helpers/encrypt.helper'); // AES cryptographic operations

/**
 * AES Key Generation Functions Test Suite
 */
describe('AES Key Generation Functions', () => {
  let testPassword;
  let testSalt;
  let testPlaintext;

  beforeEach(() => {
    testPassword = faker.internet.password({ length: 20 });
    testSalt = faker.string.alphanumeric(16);
    testPlaintext = faker.lorem.paragraph();
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
});
