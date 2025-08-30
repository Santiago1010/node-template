const { debounce, throttle, compose, pipe } = require('../../../../helpers/utilities.helper');

describe('Functional Programming Helpers', () => {
  jest.useFakeTimers();

  describe('debounce', () => {
    it('should debounce a function', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);

      expect(func).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle a function', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);

      throttledFunc();

      expect(func).toHaveBeenCalledTimes(2);
    });
  });

  describe('compose', () => {
    it('should compose multiple functions from right to left', () => {
      const addOne = (x) => x + 1;
      const double = (x) => x * 2;
      const composed = compose(double, addOne);
      const result = composed(3);
      expect(result).toBe(8);
    });
  });

  describe('pipe', () => {
    it('should pipe a value through multiple functions from left to right', () => {
      const addOne = (x) => x + 1;
      const double = (x) => x * 2;
      const result = pipe(3, addOne, double);
      expect(result).toBe(8);
    });
  });
});
