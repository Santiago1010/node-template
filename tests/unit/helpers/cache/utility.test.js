const { buildKey } = require('../../../../helpers/cache.helper');

describe('Cache Helper - Utility Functions', () => {
  describe('buildKey', () => {
    it('should join multiple parts with colons', () => {
      const result = buildKey('users', '123', 'profile');
      expect(result).toBe('users:123:profile');
    });

    it('should filter out falsy values', () => {
      const result = buildKey('cache', null, 'user', undefined, '123', false, 'data');
      expect(result).toBe('cache:user:123:data');
    });

    it('should handle single part', () => {
      const result = buildKey('singleKey');
      expect(result).toBe('singleKey');
    });

    it('should handle empty string parts', () => {
      const result = buildKey('cache', '', 'key');
      expect(result).toBe('cache:key');
    });

    it('should handle zero as valid part', () => {
      const result = buildKey('user', 0, 'profile');
      expect(result).toBe('user:0:profile');
    });

    it('should handle all falsy values', () => {
      const result = buildKey(null, undefined, false, '');
      expect(result).toBe('');
    });

    it('should handle numeric parts', () => {
      const result = buildKey('cache', 123, 456);
      expect(result).toBe('cache:123:456');
    });

    it('should handle mixed types', () => {
      const result = buildKey('prefix', 123, 'middle', true, 'suffix');
      expect(result).toBe('prefix:123:middle:true:suffix');
    });
  });
});
