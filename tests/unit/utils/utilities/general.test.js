const { randomString, generateUUID, sleep, capitalize, toBoolean, retry } = require('../../../../utils/utilities.util');

describe('Utility Functions', () => {
  describe('randomString', () => {
    it('should generate a random string of default length', () => {
      const result = randomString();
      expect(result).toHaveLength(8);
    });

    it('should generate a random string of specified length', () => {
      const result = randomString(12);
      expect(result).toHaveLength(12);
    });

    it('should generate a random string with custom characters', () => {
      const chars = 'abc';
      const result = randomString(5, chars);
      expect(result).toMatch(/^[abc]{5}$/);
    });
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });
  });

  describe('sleep', () => {
    it('should resolve after the specified time', async () => {
      const sleepTime = 10;
      const promise = sleep(sleepTime);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter of a string', () => {
      const result = capitalize('hello world');
      expect(result).toBe('Hello world');
    });

    it('should return null for invalid input', () => {
      const result = capitalize(123);
      expect(result).toBeNull();
    });
  });

  describe('toBoolean', () => {
    it('should convert various values to boolean', () => {
      expect(toBoolean('true')).toBe(true);
      expect(toBoolean('yes')).toBe(true);
      expect(toBoolean('1')).toBe(true);
      expect(toBoolean(1)).toBe(true);
      expect(toBoolean('false')).toBe(false);
      expect(toBoolean('no')).toBe(false);
      expect(toBoolean('0')).toBe(false);
      expect(toBoolean(0)).toBe(false);
      expect(toBoolean(true)).toBe(true);
      expect(toBoolean(false)).toBe(false);
      expect(toBoolean(null)).toBe(false);
      expect(toBoolean(undefined)).toBe(false);
    });
  });

  describe('retry', () => {
    it('should retry a function until it succeeds', async () => {
      const func = jest
        .fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValue('Success');

      const result = await retry(func, 3, 10);

      expect(result).toBe('Success');
      expect(func).toHaveBeenCalledTimes(3);
    });

    it('should throw an error after max attempts', async () => {
      const func = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(retry(func, 3, 10)).rejects.toThrow('Failed');
      expect(func).toHaveBeenCalledTimes(3);
    });
  });
});
