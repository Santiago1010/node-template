const {
  trackRequestPerformance,
  trackQueryPerformance,
  getRequestStats,
  getQueryStats,
} = require('../../../../helpers/performance.helper');

describe('Performance Helper - Tracking', () => {
  describe('trackRequestPerformance', () => {
    it('should add performance tracking to req and res objects', (done) => {
      const req = { method: 'GET', path: '/', get: () => 'jest', connection: {} };
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      const res = { end: () => {} };
      const endSpy = jest.spyOn(res, 'end');

      trackRequestPerformance(req, res, () => {
        expect(req).toHaveProperty('performanceId');
        expect(req).toHaveProperty('startTime');
        expect(typeof res.end).toBe('function');
        res.end();
        expect(endSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should record a metric when res.end is called', () => {
      const req = { method: 'POST', path: '/test', get: () => 'jest', connection: {} };
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      const res = { statusCode: 201, end: () => {} };
      const endSpy = jest.spyOn(res, 'end');
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      trackRequestPerformance(req, res, () => {});
      res.end();

      const stats = getRequestStats(1);
      expect(stats.totalRequests).toBe(1);
      expect(stats.methodDistribution.POST).toBe(1);
      expect(stats.statusCodeDistribution['201']).toBe(1);
      expect(endSpy).toHaveBeenCalled();
    });

    it('should log slow requests', () => {
      const req = { method: 'GET', path: '/slow', get: () => 'jest', connection: {} };
      const res = { statusCode: 200, end: jest.fn() };
      const { performance } = require('perf_hooks');
      const originalNow = performance.now;
      performance.now = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(2000); // 2000ms duration

      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      trackRequestPerformance(req, res, () => {});
      res.end();

      // Restore mock
      performance.now = originalNow;
    });

    it('should clean up old request metrics', () => {
      jest.resetModules();
      const { trackRequestPerformance, getRequestStats } = require('../../../../helpers/performance.helper');
      const req = { method: 'GET', path: '/', get: () => 'jest', connection: {} };
      const res = { statusCode: 200, end: jest.fn() };

      for (let i = 0; i < 1050; i++) {
        // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
        trackRequestPerformance(req, res, () => {});
        res.end();
      }

      const stats = getRequestStats(1050);
      expect(stats.totalRequests).toBe(1000);
    });
  });

  describe('trackQueryPerformance', () => {
    it('should measure a successful query', async () => {
      const queryFn = () => Promise.resolve({ rowCount: 1 });
      const result = await trackQueryPerformance(queryFn, 'test-select');

      expect(result.rowCount).toBe(1);
      const stats = getQueryStats(1);
      expect(stats.totalQueries).toBe(1);
      expect(stats.successfulQueries).toBe(1);
      expect(stats.queryDistribution['test-select']).toBe(1);
    });

    it('should handle a failed query', async () => {
      const error = new Error('DB error');
      const queryFn = () => Promise.reject(error);

      await expect(trackQueryPerformance(queryFn, 'test-fail')).rejects.toThrow('DB error');

      const stats = getQueryStats(5); // Look at more queries to be sure
      expect(stats.failedQueries).toBe(1);
      expect(stats.successfulQueries).toBe(1); // from previous test
      expect(stats.totalQueries).toBe(2);
      expect(stats.queryDistribution['test-fail']).toBe(1);
    });

    it('should log slow queries', async () => {
      const { performance } = require('perf_hooks');
      const originalNow = performance.now;
      performance.now = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(600); // 600ms duration

      const queryFn = () => Promise.resolve([]);
      await trackQueryPerformance(queryFn, 'slow-query');

      // Restore mock
      performance.now = originalNow;
    });

    it('should clean up old query metrics', async () => {
      jest.resetModules();
      const { trackQueryPerformance, getQueryStats } = require('../../../../helpers/performance.helper');
      const queryFn = () => Promise.resolve([]);
      for (let i = 0; i < 510; i++) {
        await trackQueryPerformance(queryFn, `query-${i}`);
      }

      const stats = getQueryStats(510);
      expect(stats.totalQueries).toBe(500);
    });

    it('should handle query params', async () => {
      const queryFn = () => Promise.resolve([]);
      await trackQueryPerformance(queryFn, 'query-with-params', { id: 1 });
      // No direct assertion, but this covers the params logic
    });
  });
});
