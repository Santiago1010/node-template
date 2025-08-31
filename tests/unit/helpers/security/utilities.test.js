const { generateSecureToken, getCurrentTimestamp } = require('../../../../helpers/security.helper');
const crypto = require('crypto');

describe('Security Helper - Utility Functions', () => {
  describe('generateSecureToken', () => {
    test('should generate a random token of the specified length', () => {
      const token = generateSecureToken(32);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // The token is hex-encoded, so its length will be twice the byte length.
      expect(token.length).toBe(64);
    });

    test('should throw an error if token generation fails', () => {
      jest.spyOn(crypto, 'randomBytes').mockImplementation(() => {
        throw new Error('Crypto error');
      });
      expect(() => generateSecureToken(32)).toThrow('Failed to generate secure token: Crypto error');
      crypto.randomBytes.mockRestore();
    });
  });

  describe('getCurrentTimestamp', () => {
    test('should return the current timestamp as a number', () => {
      const timestamp = getCurrentTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(1672531200000); // After 2023-01-01
    });
  });
});
