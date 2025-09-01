const { createTimer, measureExecution, benchmark } = require('../../../../helpers/performance.helper');

describe('Performance Helper - Timing and Measurement', () => {
  describe('createTimer', () => {
    it('should create a timer and return start time and a stop function', () => {
      const timer = createTimer();
      expect(timer).toHaveProperty('start');
      expect(typeof timer.start).toBe('number');
      expect(timer).toHaveProperty('stop');
      expect(typeof timer.stop).toBe('function');
    });

    it('should measure a duration when stopped', (done) => {
      const timer = createTimer();
      setTimeout(() => {
        const result = timer.stop();
        expect(result).toHaveProperty('duration');
        expect(result.duration).toBeGreaterThan(90);
        expect(result).toHaveProperty('durationMs');
        expect(result.durationMs).toBeGreaterThan(90);
        expect(result).toHaveProperty('start');
        expect(result).toHaveProperty('end');
        done();
      }, 100);
    });
  });

  describe('measureExecution', () => {
    it('should measure the execution of a synchronous function', async () => {
      const syncFunction = () => 'test';
      const result = await measureExecution(syncFunction, 'test-sync');
      expect(result.result).toBe('test');
      expect(result.timing.durationMs).toBeLessThan(10);
      expect(result.label).toBe('test-sync');
    });

    it('should measure the execution of an asynchronous function', async () => {
      const asyncFunction = () => new Promise((resolve) => setTimeout(() => resolve('done'), 50));
      const result = await measureExecution(asyncFunction, 'test-async');
      expect(result.result).toBe('done');
      expect(result.timing.durationMs).toBeGreaterThanOrEqual(45);
    });

    it('should handle errors in the executed function', async () => {
      const errorFunction = () => {
        throw new Error('test-error');
      };
      await expect(measureExecution(errorFunction)).rejects.toThrow('test-error');
    });
  });

  describe('benchmark', () => {
    it('should run a function multiple times and return stats', async () => {
      const fn = () => new Promise((resolve) => setTimeout(resolve, 1));
      const results = await benchmark(fn, 10, 'test-benchmark');

      expect(results.label).toBe('test-benchmark');
      expect(results.iterations).toBe(10);
      expect(results.totalDuration).toBeGreaterThan(9);
      expect(results.average).toBeGreaterThan(0);
      expect(results.min).toBeGreaterThan(0);
      expect(results.max).toBeGreaterThan(0);
      expect(results.median).toBeGreaterThan(0);
    });

    it('should handle errors during benchmark', async () => {
      const errorFn = () => {
        throw new Error('benchmark-fail');
      };
      await expect(benchmark(errorFn, 10)).rejects.toThrow('benchmark-fail');
    });
  });
});
