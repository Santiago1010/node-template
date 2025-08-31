const fs = require('fs');
const path = require('path');
const { logPerformance, generatePerformanceReport } = require('../../../../helpers/performance.helper');
const { PATHS } = require('../../../../helpers/constants.helper');

const PERFORMANCE_LOG_PATH = path.join(PATHS.LOGS, 'performance.log');

describe('Performance Helper - Logging and Reporting', () => {
  beforeEach(() => {
    // Ensure logs directory exists and clean up log file before each test
    if (!fs.existsSync(PATHS.LOGS)) {
      fs.mkdirSync(PATHS.LOGS, { recursive: true });
    }
    if (fs.existsSync(PERFORMANCE_LOG_PATH)) {
      fs.unlinkSync(PERFORMANCE_LOG_PATH);
    }
  });

  afterAll(() => {
    // Clean up log file after all tests
    if (fs.existsSync(PERFORMANCE_LOG_PATH)) {
      fs.unlinkSync(PERFORMANCE_LOG_PATH);
    }
  });

  describe('logPerformance', () => {
    it('should write a log entry to the performance log file', async () => {
      const data = { metric: 'test', value: 123 };
      await logPerformance(data, 'test-log');

      const logContent = fs.readFileSync(PERFORMANCE_LOG_PATH, 'utf-8');
      const logEntry = JSON.parse(logContent);

      expect(logEntry.type).toBe('test-log');
      expect(logEntry.data.metric).toBe('test');
      expect(logEntry.data.value).toBe(123);
    });

    it('should handle errors without crashing', async () => {
      // Mock fs.appendFileSync to throw an error
      const originalAppend = fs.appendFileSync;
      fs.appendFileSync = () => {
        throw new Error('Disk full');
      };

      // We expect it to fail silently (or log to stderr via debug helper)
      await expect(logPerformance({ a: 1 })).resolves.not.toThrow();

      // Restore original function
      fs.appendFileSync = originalAppend;
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate a report with system, request, and query stats', () => {
      const report = generatePerformanceReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('system');
      expect(report).toHaveProperty('requests');
      expect(report).toHaveProperty('queries');
      expect(report).toHaveProperty('cache');

      expect(typeof report.system.cpu.count).toBe('number');
    });
  });
});
