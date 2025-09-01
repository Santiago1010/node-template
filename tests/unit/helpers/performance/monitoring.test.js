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
  });
});
