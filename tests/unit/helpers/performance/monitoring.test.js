const os = require('os');
const {
  getSystemMetrics,
  getRequestStats,
  getQueryStats,
  trackRequestPerformance,
  trackQueryPerformance,
} = require('../../../../helpers/performance.helper');

describe('Performance Helper - Monitoring', () => {
  describe('getSystemMetrics', () => {
    it('should return system metrics', () => {
      const metrics = getSystemMetrics();
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics.cpu.count).toBe(os.cpus().length);
    });

    it('should trigger high memory and CPU warnings', () => {
      const debugHelper = require('../../../../helpers/debug.helper');
      const plogSpy = jest.spyOn(debugHelper, 'plog');

      // Mock os.freemem and os.loadavg to trigger warnings
      const originalFreemem = os.freemem;
      const originalLoadavg = os.loadavg;
      os.freemem = () => 1024 * 1024; // 1MB free
      os.loadavg = () => [os.cpus().length, 0, 0]; // High load

      const metrics = getSystemMetrics();
      expect(metrics.memory.usagePercent).toBeGreaterThan(90);
      expect(plogSpy).toHaveBeenCalledWith('High Memory Usage Warning', expect.any(Object));
      expect(plogSpy).toHaveBeenCalledWith('High CPU Load Warning', expect.any(Object));

      // Restore mocks
      os.freemem = originalFreemem;
      os.loadavg = originalLoadavg;
      plogSpy.mockRestore();
    });
  });

  describe('getRequestStats', () => {
    it('should return a message when no metrics are available', () => {
      const stats = getRequestStats();
      expect(stats.message).toBe('No request metrics available');
    });

    it('should return request statistics', () => {
      // Simulate a few requests
      const req = { method: 'GET', path: '/', get: () => 'jest', connection: {} };
      const res = { statusCode: 200, end: jest.fn() };
      // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
      trackRequestPerformance(req, res, () => {});
      res.end();

      const stats = getRequestStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(stats.statusCodeDistribution['200']).toBe(1);
      expect(stats.timeRange.from).toBeDefined();
      expect(stats.timeRange.to).toBeDefined();
    });
  });

  describe('getQueryStats', () => {
    it('should return a message when no metrics are available', () => {
      const stats = getQueryStats();
      expect(stats.message).toBe('No query metrics available');
    });

    it('should return query statistics', async () => {
      // Simulate a query
      const queryFn = () => Promise.resolve([1, 2]);
      await trackQueryPerformance(queryFn, 'test-query');

      const stats = getQueryStats();
      expect(stats.totalQueries).toBe(1);
      expect(stats.successfulQueries).toBe(1);
      expect(stats.failedQueries).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.queryDistribution['test-query']).toBe(1);
    });

    it('should handle only failed queries', async () => {
      // Clear previous metrics by resetting the module
      jest.resetModules();
      const {
        trackQueryPerformance: trackQueryPerformanceNew,
        getQueryStats: getQueryStatsNew,
      } = require('../../../../helpers/performance.helper');

      const queryFn = () => Promise.reject(new Error('fail'));
      await expect(trackQueryPerformanceNew(queryFn, 'failed-query')).rejects.toThrow('fail');

      const stats = getQueryStatsNew();
      expect(stats.totalQueries).toBe(1);
      expect(stats.successfulQueries).toBe(0);
      expect(stats.failedQueries).toBe(1);
      expect(stats.successRate).toBe(0);
      expect(stats.averageQueryTime).toBe(0);
      expect(stats.slowestQuery).toBe(0);
      expect(stats.fastestQuery).toBe(0);
    });
  });
});
