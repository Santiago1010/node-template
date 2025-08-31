const { trackLoginAttempt, isLockedOut } = require('../../../../helpers/security.helper');

// Mock contextHelper
jest.mock('../../../../helpers/context.helper', () => ({
  getCurrentSessionId: jest.fn(),
  getCurrentUserAgent: jest.fn(() => 'test-agent'),
  getCurrentIpAddress: jest.fn(() => '127.0.0.1'),
  getCurrentUserId: jest.fn(() => 'test-user'),
  setCustomData: jest.fn(),
}));

describe('Security Helper - Login Security', () => {
  const identifier = 'test-user';

  describe('trackLoginAttempt', () => {
    test('should track a successful login', () => {
      const result = trackLoginAttempt(identifier, true);
      expect(result.allowed).toBe(true);
      expect(result.message).toBe('Login successful');
    });

    test('should track a failed login and not lock out immediately', () => {
      const result = trackLoginAttempt(identifier, false);
      expect(result.allowed).toBe(true);
      expect(result.attemptsRemaining).toBe(4); // Assuming max 3 attempts before action
    });
  });

  describe('isLockedOut', () => {
    test('should return false for a user that is not locked out', () => {
      expect(isLockedOut(identifier)).toBe(false);
    });
  });
});
