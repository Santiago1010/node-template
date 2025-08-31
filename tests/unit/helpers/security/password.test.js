const {
  validatePasswordStrength,
  isCommonPassword,
  hashPassword,
  verifyPassword,
} = require('../../../../helpers/security.helper');

describe('Security Helper - Password Security', () => {
  describe('validatePasswordStrength', () => {
    test('should approve a strong password', () => {
      const result = validatePasswordStrength('Str0ngP@ssw0rd!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('very_strong');
    });

    test('should reject a weak password', () => {
      const result = validatePasswordStrength('password');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isCommonPassword', () => {
    test('should identify a common password', () => {
      expect(isCommonPassword('password')).toBe(true);
    });

    test('should not flag a unique password', () => {
      expect(isCommonPassword('MySuperSecretP@ssw0rd')).toBe(false);
    });
  });

  describe('hashPassword and verifyPassword', () => {
    test('should hash and successfully verify a password', async () => {
      const password = 'my-secret-password';
      const hashedPassword = await hashPassword(password);
      const isMatch = await verifyPassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });
  });
});
