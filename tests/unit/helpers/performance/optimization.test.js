const { throttle, debounce, PerformanceCache } = require('../../../../helpers/performance.helper');

describe('Performance Helper - Optimization', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('throttle', () => {
    it('should call the function immediately', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);
      throttled();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should not call the function again within the delay', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);
      throttled();
      throttled();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should call the function again after the delay', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);
      throttled();
      expect(func).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(100);
      throttled();
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should schedule a trailing call if called again within the delay', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);
      throttled(); // immediate call
      expect(func).toHaveBeenCalledTimes(1);

      throttled(); // should schedule a trailing call
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(2);

      // Advance time again to allow the next immediate call
      jest.advanceTimersByTime(100);
      throttled(); // immediate call again
      expect(func).toHaveBeenCalledTimes(3);
    });
  });

  describe('debounce', () => {
    it('should not call the function immediately', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);
      debounced();
      expect(func).not.toHaveBeenCalled();
    });

    it('should call the function after the delay', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);
      debounced();
      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should reset the timer if called again', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);
      debounced();
      jest.advanceTimersByTime(50);
      debounced();
      jest.advanceTimersByTime(50);
      expect(func).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('PerformanceCache', () => {
    let cache;

    beforeEach(() => {
      cache = new PerformanceCache();
    });

    it('should set and get a value', () => {
      cache.set('key', 'value');
      expect(cache.get('key')).toBe('value');
      expect(cache.has('key')).toBe(true);
    });

    it('should delete a value', () => {
      cache.set('key', 'value');
      cache.delete('key');
      expect(cache.get('key')).toBeUndefined();
      expect(cache.has('key')).toBe(false);
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.getStats().size).toBe(0);
    });

    it('should handle TTL', () => {
      cache.set('key', 'value', 100);
      expect(cache.get('key')).toBe('value');
      jest.advanceTimersByTime(100);
      expect(cache.get('key')).toBeUndefined();
    });

    it('should overwrite an existing TTL timer', () => {
      cache.set('key', 'value1', 200);
      cache.set('key', 'value2', 100);

      jest.advanceTimersByTime(100);
      expect(cache.get('key')).toBeUndefined();
    });

    it('should clear the TTL timer when a key is deleted', () => {
      cache.set('key', 'value', 100);
      cache.delete('key');
      jest.advanceTimersByTime(100);
      // If timer was not cleared, it would try to delete again, which is fine
      // but this ensures the timer is gone from the timers map.
      expect(cache.timers.has('key')).toBe(false);
    });

    it('should call clearTimeout when deleting a key with a TTL', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      cache.set('key', 'value', 100);
      cache.delete('key');
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
