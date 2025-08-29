// =============================================================================
// ENCRYPT HELPER - Complete encryption/decryption utilities
// =============================================================================
// This module provides comprehensive encryption and decryption functions
// using RSA (public/private key) and AES algorithms, along with utility
// functions for key generation, hashing, and secure random generation.
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto');
const fs = require('fs');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const bcrypt = require('bcrypt');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { KEY_SIZES, ALGORITHMS } = require('./constants.helper');

// =============================================================================
// RSA KEY MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Generates a new RSA key pair (public and private keys)
 * @param {number} keySize - RSA key size in bits (default: 2048)
 * @returns {Object} Object containing publicKey and privateKey as PEM strings
 */
const generateRSAKeyPair = (keySize = KEY_SIZES.RSA) => {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  } catch (error) {
    throw new Error(`RSA key pair generation failed: ${error.message}`);
  }
};

/**
 * Loads RSA keys from file paths
 * @param {string} publicKeyPath - Path to public key file
 * @param {string} privateKeyPath - Path to private key file
 * @returns {Object} Object containing publicKey and privateKey strings
 */
const loadRSAKeysFromFiles = (publicKeyPath, privateKeyPath) => {
  try {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    return { publicKey, privateKey };
  } catch (error) {
    throw new Error(`Failed to load RSA keys from files: ${error.message}`);
  }
};

/**
 * Saves RSA keys to file paths
 * @param {string} publicKey - Public key PEM string
 * @param {string} privateKey - Private key PEM string
 * @param {string} publicKeyPath - Path to save public key
 * @param {string} privateKeyPath - Path to save private key
 */
const saveRSAKeysToFiles = (publicKey, privateKey, publicKeyPath, privateKeyPath) => {
  try {
    fs.writeFileSync(publicKeyPath, publicKey);
    fs.writeFileSync(privateKeyPath, privateKey);
  } catch (error) {
    throw new Error(`Failed to save RSA keys to files: ${error.message}`);
  }
};

// =============================================================================
// RSA ENCRYPTION/DECRYPTION FUNCTIONS
// =============================================================================

/**
 * Encrypts data using RSA public key
 * @param {string|Buffer} data - Data to encrypt
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {string} Base64 encoded encrypted data
 */
const encryptWithRSA = (data, publicKey) => {
  try {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  } catch (error) {
    throw new Error(`RSA encryption failed: ${error.message}`);
  }
};

/**
 * Decrypts RSA encrypted data using private key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} Decrypted data as string
 */
const decryptWithRSA = (encryptedData, privateKey) => {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`RSA decryption failed: ${error.message}`);
  }
};

/**
 * Signs data using RSA private key
 * @param {string|Buffer} data - Data to sign
 * @param {string} privateKey - RSA private key in PEM format
 * @returns {string} Base64 encoded signature
 */
const signWithRSA = (data, privateKey) => {
  try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    const signature = sign.sign(privateKey);
    return signature.toString('base64');
  } catch (error) {
    throw new Error(`RSA signing failed: ${error.message}`);
  }
};

/**
 * Verifies RSA signature using public key
 * @param {string|Buffer} data - Original data
 * @param {string} signature - Base64 encoded signature
 * @param {string} publicKey - RSA public key in PEM format
 * @returns {boolean} True if signature is valid
 */
const verifyRSASignature = (data, signature, publicKey) => {
  try {
    if (!publicKey.includes('-----BEGIN PUBLIC KEY-----')) return false;

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    const signatureBuffer = Buffer.from(signature, 'base64');

    return verify.verify(publicKey, signatureBuffer);
  } catch (error) {
    console.error('Unexpected error in RSA verification:', error);
    return false;
  }
};

// =============================================================================
// AES KEY GENERATION FUNCTIONS
// =============================================================================

/**
 * Generates a random AES key
 * @param {number} keySize - Key size in bytes (default: 32 for AES-256)
 * @returns {Buffer} Random AES key
 */
const generateAESKey = (keySize = KEY_SIZES.AES) => {
  try {
    return crypto.randomBytes(keySize);
  } catch (error) {
    throw new Error(`AES key generation failed: ${error.message}`);
  }
};

/**
 * Derives an AES key from a password using PBKDF2
 * @param {string} password - Password to derive key from
 * @param {Buffer|string} salt - Salt for key derivation
 * @param {number} iterations - Number of iterations (default: 100000)
 * @param {number} keySize - Key size in bytes (default: 32)
 * @returns {Buffer} Derived AES key
 */
const deriveAESKeyFromPassword = (password, salt, iterations = 100000, keySize = KEY_SIZES.AES) => {
  try {
    const saltBuffer = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'utf8');
    return crypto.pbkdf2Sync(password, saltBuffer, iterations, keySize, ALGORITHMS.HASH);
  } catch (error) {
    throw new Error(`AES key derivation failed: ${error.message}`);
  }
};

/**
 * Generates a random initialization vector (IV)
 * @param {number} size - IV size in bytes (default: 16)
 * @returns {Buffer} Random IV
 */
const generateIV = (size = KEY_SIZES.IV) => {
  try {
    return crypto.randomBytes(size);
  } catch (error) {
    throw new Error(`IV generation failed: ${error.message}`);
  }
};

// =============================================================================
// AES ENCRYPTION/DECRYPTION FUNCTIONS
// =============================================================================

/**
 * Encrypts data using AES-256-GCM
 * @param {string|Buffer} data - Data to encrypt
 * @param {Buffer|string} key - AES encryption key
 * @param {string} [iv] - Initialization vector (optional)
 * @returns {Object} Object containing base64 encoded encrypted data, IV, and authentication tag
 */
const encryptWithAES = (data, key, iv = null) => {
  try {
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'base64');
    const ivBuffer = iv || generateIV();
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');

    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    cipher.setAAD(Buffer.from('authenticated'));

    let encrypted = cipher.update(dataBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: ivBuffer.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  } catch (error) {
    throw new Error(`AES encryption failed: ${error.message}`);
  }
};

/**
 * Decrypts data using AES-256-GCM
 * @param {string|Buffer} encryptedData - Base64 encoded encrypted data
 * @param {Buffer|string} key - AES encryption key
 * @param {string} iv - Initialization vector (base64 encoded)
 * @param {string} authTag - Authentication tag (base64 encoded)
 * @returns {string} Decrypted data
 */
const decryptWithAES = (encryptedData, key, iv, authTag) => {
  try {
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'base64');
    const ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, 'base64');
    const encryptedBuffer = Buffer.isBuffer(encryptedData) ? encryptedData : Buffer.from(encryptedData, 'base64');
    const authTagBuffer = Buffer.isBuffer(authTag) ? authTag : Buffer.from(authTag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    decipher.setAAD(Buffer.from('authenticated'));

    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`AES decryption failed: ${error.message}`);
  }
};

// =============================================================================
// HYBRID ENCRYPTION FUNCTIONS (RSA + AES)
// =============================================================================

/**
 * Encrypts data using hybrid encryption (RSA for key, AES for data)
 * @param {string|Buffer} data - Data to encrypt
 * @param {string} publicKey - RSA public key for encrypting AES key
 * @returns {Object} Object containing encrypted data and encrypted AES key
 */
const encryptHybrid = (data, publicKey) => {
  try {
    // Generate random AES key and IV
    const aesKey = generateAESKey();
    const iv = generateIV();

    // Encrypt data with AES
    const aesResult = encryptWithAES(data, aesKey, iv);

    // Convert AES key to base64 string and encrypt with RSA
    const encryptedAESKey = encryptWithRSA(aesKey.toString('base64'), publicKey);

    return {
      encryptedData: aesResult.encrypted,
      encryptedKey: encryptedAESKey,
      iv: aesResult.iv,
      authTag: aesResult.authTag,
    };
  } catch (error) {
    throw new Error(`Hybrid encryption failed: ${error.message}`);
  }
};

/**
 * Decrypts hybrid encrypted data (RSA + AES)
 * @param {Object} encryptedPackage - Object containing encrypted data and key
 * @param {string} privateKey - RSA private key for decrypting AES key
 * @returns {string} Decrypted data
 */
const decryptHybrid = (encryptedPackage, privateKey) => {
  try {
    const { encryptedData, encryptedKey, iv, authTag } = encryptedPackage;

    // Decrypt AES key with RSA and convert from base64 to Buffer
    const aesKeyBase64 = decryptWithRSA(encryptedKey, privateKey);
    const aesKey = Buffer.from(aesKeyBase64, 'base64');

    // Decrypt data with AES
    return decryptWithAES(encryptedData, aesKey, iv, authTag);
  } catch (error) {
    throw new Error(`Hybrid decryption failed: ${error.message}`);
  }
};

// =============================================================================
// HASHING FUNCTIONS
// =============================================================================

/**
 * Creates SHA-256 hash of data
 * @param {string|Buffer} data - Data to hash
 * @returns {string} Hex encoded hash
 */
const hashSHA256 = (data) => {
  try {
    return crypto.createHash(ALGORITHMS.HASH).update(data).digest('hex');
  } catch (error) {
    throw new Error(`SHA-256 hashing failed: ${error.message}`);
  }
};

/**
 * Creates HMAC (keyed hash) of data
 * @param {string|Buffer} data - Data to hash
 * @param {string|Buffer} key - Secret key for HMAC
 * @returns {string} Hex encoded HMAC
 */
const createHMAC = (data, key) => {
  try {
    return crypto.createHmac(ALGORITHMS.HMAC, key).update(data).digest('hex');
  } catch (error) {
    throw new Error(`HMAC creation failed: ${error.message}`);
  }
};

/**
 * Verifies HMAC
 * @param {string|Buffer} data - Original data
 * @param {string|Buffer} key - Secret key used for HMAC
 * @param {string} expectedHMAC - Expected HMAC to verify against
 * @returns {boolean} True if HMAC is valid
 */
const verifyHMAC = (data, key, expectedHMAC) => {
  try {
    const calculatedHMAC = createHMAC(data, key);
    return crypto.timingSafeEqual(Buffer.from(calculatedHMAC, 'hex'), Buffer.from(expectedHMAC, 'hex'));
  } catch (error) {
    throw new Error(`HMAC verification failed: ${error.message}`);
  }
};

// =============================================================================
// PASSWORD HASHING FUNCTIONS
// =============================================================================

/**
 * Hashes a password using bcrypt
 * @param {string} password - Password to hash
 * @param {number} saltRounds - Number of salt rounds (default: 12)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, saltRounds = 12) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Verifies a password against its bcrypt hash
 * @param {string} password - Password to verify
 * @param {string} hashedPassword - Previously hashed password
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates cryptographically secure random bytes
 * @param {number} size - Number of bytes to generate
 * @returns {Buffer} Random bytes
 */
const generateRandomBytes = (size) => {
  try {
    return crypto.randomBytes(size);
  } catch (error) {
    throw new Error(`Random bytes generation failed: ${error.message}`);
  }
};

/**
 * Generates a cryptographically secure random string
 * @param {number} length - Length of the string
 * @param {string} charset - Character set to use (default: alphanumeric)
 * @returns {string} Random string
 */
const generateRandomString = (length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  try {
    const randomBytes = crypto.randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }

    return result;
  } catch (error) {
    throw new Error(`Random string generation failed: ${error.message}`);
  }
};

/**
 * Generates a secure token (URL-safe base64)
 * @param {number} byteLength - Number of bytes for the token (default: 32)
 * @returns {string} URL-safe base64 encoded token
 */
const generateSecureToken = (byteLength = 32) => {
  try {
    return crypto.randomBytes(byteLength).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    throw new Error(`Secure token generation failed: ${error.message}`);
  }
};

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 */
const constantTimeEquals = (a, b) => {
  try {
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (error) {
    throw new Error(`Constant time comparison failed: ${error.message}`);
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // RSA Functions
  generateRSAKeyPair,
  loadRSAKeysFromFiles,
  saveRSAKeysToFiles,
  encryptWithRSA,
  decryptWithRSA,
  signWithRSA,
  verifyRSASignature,

  // AES Functions
  generateAESKey,
  deriveAESKeyFromPassword,
  generateIV,
  encryptWithAES,
  decryptWithAES,

  // Hybrid Encryption
  encryptHybrid,
  decryptHybrid,

  // Hashing Functions
  hashSHA256,
  createHMAC,
  verifyHMAC,

  // Password Functions
  hashPassword,
  verifyPassword,

  // Utility Functions
  generateRandomBytes,
  generateRandomString,
  generateSecureToken,
  constantTimeEquals,
};
