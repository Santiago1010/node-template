const { deepClone, deepMerge, getNestedValue, setNestedValue } = require('../../../../helpers/utilities.helper');

describe('Object Manipulation Functions', () => {
  describe('deepClone', () => {
    it('should deep clone an object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const clone = deepClone(obj);
      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
      expect(clone.b).not.toBe(obj.b);
    });

    it('should deep clone an array', () => {
      const arr = [1, [2, 3]];
      const clone = deepClone(arr);
      expect(clone).toEqual(arr);
      expect(clone).not.toBe(arr);
      expect(clone[1]).not.toBe(arr[1]);
    });

    it('should handle null and primitive values', () => {
      expect(deepClone(null)).toBeNull();
      expect(deepClone(123)).toBe(123);
      expect(deepClone('hello')).toBe('hello');
    });

    it('should handle dates', () => {
      const date = new Date();
      const clone = deepClone(date);
      expect(clone).toEqual(date);
      expect(clone).not.toBe(date);
    });
  });

  describe('deepMerge', () => {
    it('should merge multiple objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      const obj3 = { a: 5 };
      const result = deepMerge(obj1, obj2, obj3);
      expect(result).toEqual({ a: 5, b: { c: 2, d: 3 }, e: 4 });
    });

    it('should handle empty and non-object inputs', () => {
      const obj1 = { a: 1 };
      const result = deepMerge(obj1, null, undefined, 123);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('getNestedValue', () => {
    const obj = { a: { b: { c: 42 } } };

    it('should get a nested value using dot notation', () => {
      const result = getNestedValue(obj, 'a.b.c');
      expect(result).toBe(42);
    });

    it('should return default value for non-existent path', () => {
      const result = getNestedValue(obj, 'a.b.d', 'default');
      expect(result).toBe('default');
    });

    it('should return undefined for non-existent path without default value', () => {
      const result = getNestedValue(obj, 'a.b.d');
      expect(result).toBeUndefined();
    });

    it('should return default value for invalid input', () => {
      const result = getNestedValue(null, 'a.b.c', 'default');
      expect(result).toBe('default');
    });
  });

  describe('setNestedValue', () => {
    it('should set a value in an object using dot notation', () => {
      const obj = {};
      const result = setNestedValue(obj, 'a.b.c', 42);
      expect(result).toEqual({ a: { b: { c: 42 } } });
    });

    it('should overwrite an existing value', () => {
      const obj = { a: { b: { c: 1 } } };
      const result = setNestedValue(obj, 'a.b.c', 42);
      expect(result).toEqual({ a: { b: { c: 42 } } });
    });

    it('should return null for invalid input', () => {
      const result = setNestedValue(null, 'a.b.c', 42);
      expect(result).toBeNull();
    });
  });
});
