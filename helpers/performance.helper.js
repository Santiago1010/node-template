// =============================================================================
// PERFORMANCE HELPER - Utilities for monitoring and optimizing API performance
// =============================================================================
//
// This module provides comprehensive performance monitoring, measurement,
// and optimization utilities for Node.js REST API backends.
//
// Features:
// - Request/response timing and metrics
// - Memory usage monitoring
// - Database query performance tracking
// - Rate limiting and throttling utilities
// - Performance profiling and benchmarking
// - Resource optimization helpers
//
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const cluster = require('cluster');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { performance } = require('perf_hooks');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const moment = require('moment');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const debugHelper = require('./debug.helper');
const { PATHS, PERFORMANCE_CONFIG } = require('../utils/constants.util');

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================
const PERFORMANCE_LOG_PATH = path.join(PATHS.LOGS, 'performance.log');

// Performance metrics cache
const metricsCache = new Map();
const requestMetrics = new Map();
const queryPerformance = new Map();

// =============================================================================
// TIMING AND MEASUREMENT UTILITIES
// =============================================================================

/**
 * Creates a high-precision timer for measuring execution time
 * @returns {Object} Timer object with start time and stop method
 */
const createTimer = () => {
  const startTime = performance.now();

  return {
    start: startTime,
    stop: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      return {
        duration: duration,
        durationMs: Math.round(duration * 100) / 100,
        start: startTime,
        end: endTime,
      };
    },
  };
};

/**
 * Measures the execution time of a function or promise
 * @param {Function|Promise} fn - Function to measure or promise
 * @param {string} [label] - Optional label for debugging
 * @returns {Promise<Object>} Result with timing information
 */
const measureExecution = async (fn, label = 'Anonymous Function') => {
  const timer = createTimer();

  try {
    let result;

    if (typeof fn === 'function') {
      result = await fn();
    } else if (fn && typeof fn.then === 'function') {
      result = await fn;
    } else {
      throw new Error('Invalid function or promise provided');
    }

    const timing = timer.stop();

    if (debugHelper.isDebugMode()) {
      debugHelper.clog('Performance Measurement', {
        label,
        duration: `${timing.durationMs}ms`,
        result: typeof result === 'object' ? '[Object]' : result,
      });
    }

    return {
      result,
      timing,
      label,
    };
  } catch (error) {
    const timing = timer.stop();

    if (debugHelper.isDebugMode()) {
      debugHelper.cerror('Performance Measurement Error', {
        label,
        duration: `${timing.durationMs}ms`,
        error: error.message,
      });
    }

    throw error;
  }
};

/**
 * Benchmarks a function by running it multiple times
 * @param {Function} fn - Function to benchmark
 * @param {number} [iterations=100] - Number of iterations
 * @param {string} [label] - Label for the benchmark
 * @returns {Object} Benchmark results
 */
const benchmark = async (fn, iterations = 100, label = 'Benchmark') => {
  const results = [];
  let totalDuration = 0;

  for (let i = 0; i < iterations; i++) {
    const timer = createTimer();

    try {
      await fn();
      const timing = timer.stop();
      results.push(timing.duration);
      totalDuration += timing.duration;
    } catch (error) {
      debugHelper.cerror('Benchmark Error', { iteration: i + 1, error: error.message });
      throw error;
    }
  }

  const average = totalDuration / iterations;
  const min = Math.min(...results);
  const max = Math.max(...results);
  const median = results.sort((a, b) => a - b)[Math.floor(results.length / 2)];

  const benchmarkResult = {
    label,
    iterations,
    totalDuration: Math.round(totalDuration * 100) / 100,
    average: Math.round(average * 100) / 100,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    median: Math.round(median * 100) / 100,
  };

  if (debugHelper.isDebugMode()) {
    debugHelper.clog('Benchmark Results', benchmarkResult);
  }

  return benchmarkResult;
};

// =============================================================================
// REQUEST PERFORMANCE TRACKING
// =============================================================================

/**
 * Express middleware for tracking request performance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const trackRequestPerformance = (req, res, next) => {
  const requestId = `${req.method}_${req.path}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timer = createTimer();

  // Store request start info
  req.performanceId = requestId;
  req.startTime = timer.start;

  // Override res.end to capture completion time
  const originalEnd = res.end;
  res.end = function (...args) {
    const timing = timer.stop();
    const endTime = moment();

    const requestMetric = {
      id: requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: timing.durationMs,
      timestamp: endTime.toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Store in cache
    requestMetrics.set(requestId, requestMetric);

    // Log slow requests
    if (timing.durationMs > 1000) {
      debugHelper.plog('Slow Request Detected', requestMetric);
    }

    // Clean up old metrics (keep last 1000)
    if (requestMetrics.size > 1000) {
      const oldestKey = requestMetrics.keys().next().value;
      requestMetrics.delete(oldestKey);
    }

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Gets performance statistics for recent requests
 * @param {number} [limit=100] - Number of recent requests to analyze
 * @returns {Object} Performance statistics
 */
const getRequestStats = (limit = 100) => {
  const recentMetrics = Array.from(requestMetrics.values()).slice(-limit);

  if (recentMetrics.length === 0) {
    return { message: 'No request metrics available' };
  }

  const durations = recentMetrics.map((m) => m.duration);
  const statusCodes = recentMetrics.reduce((acc, m) => {
    acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
    return acc;
  }, {});

  const methods = recentMetrics.reduce((acc, m) => {
    acc[m.method] = (acc[m.method] || 0) + 1;
    return acc;
  }, {});

  return {
    totalRequests: recentMetrics.length,
    averageResponseTime: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100,
    minResponseTime: Math.min(...durations),
    maxResponseTime: Math.max(...durations),
    statusCodeDistribution: statusCodes,
    methodDistribution: methods,
    timeRange: {
      from: recentMetrics[0]?.timestamp,
      to: recentMetrics[recentMetrics.length - 1]?.timestamp,
    },
  };
};

// =============================================================================
// DATABASE QUERY PERFORMANCE
// =============================================================================

/**
 * Wraps a database query to measure its performance
 * @param {Function} queryFn - Database query function
 * @param {string} queryName - Name/identifier for the query
 * @param {Object} [params] - Query parameters for logging
 * @returns {Promise} Query result with performance data
 */
const trackQueryPerformance = async (queryFn, queryName, params = {}) => {
  const timer = createTimer();
  const queryId = `${queryName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  try {
    const result = await queryFn();
    const timing = timer.stop();

    const queryMetric = {
      id: queryId,
      name: queryName,
      duration: timing.durationMs,
      timestamp: moment().toISOString(),
      params: Object.keys(params).length > 0 ? params : null,
      success: true,
      rowCount: Array.isArray(result) ? result.length : result?.rowCount || 'unknown',
    };

    queryPerformance.set(queryId, queryMetric);

    // Log slow queries
    if (timing.durationMs > 500) {
      debugHelper.plog('Slow Query Detected', queryMetric);
    }

    // Clean up old metrics
    if (queryPerformance.size > 500) {
      const oldestKey = queryPerformance.keys().next().value;
      queryPerformance.delete(oldestKey);
    }

    return result;
  } catch (error) {
    const timing = timer.stop();

    const queryMetric = {
      id: queryId,
      name: queryName,
      duration: timing.durationMs,
      timestamp: moment().toISOString(),
      params: Object.keys(params).length > 0 ? params : null,
      success: false,
      error: error.message,
    };

    queryPerformance.set(queryId, queryMetric);
    debugHelper.perror('Query Performance Error', queryMetric);

    throw error;
  }
};

/**
 * Gets database query performance statistics
 * @param {number} [limit=50] - Number of recent queries to analyze
 * @returns {Object} Query performance statistics
 */
const getQueryStats = (limit = 50) => {
  const recentQueries = Array.from(queryPerformance.values()).slice(-limit);

  if (recentQueries.length === 0) {
    return { message: 'No query metrics available' };
  }

  const successful = recentQueries.filter((q) => q.success);
  const failed = recentQueries.filter((q) => !q.success);
  const durations = successful.map((q) => q.duration);

  const queryNames = recentQueries.reduce((acc, q) => {
    acc[q.name] = (acc[q.name] || 0) + 1;
    return acc;
  }, {});

  return {
    totalQueries: recentQueries.length,
    successfulQueries: successful.length,
    failedQueries: failed.length,
    successRate: Math.round((successful.length / recentQueries.length) * 100),
    averageQueryTime:
      durations.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100 : 0,
    slowestQuery: durations.length > 0 ? Math.max(...durations) : 0,
    fastestQuery: durations.length > 0 ? Math.min(...durations) : 0,
    queryDistribution: queryNames,
  };
};

// =============================================================================
// SYSTEM MONITORING
// =============================================================================

/**
 * Gets current system performance metrics
 * @returns {Object} System performance data
 */
const getSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = usedMem / totalMem;

  const cpus = os.cpus();
  const loadAvg = os.loadavg();

  const metrics = {
    timestamp: moment().toISOString(),
    memory: {
      total: Math.round(totalMem / 1024 / 1024), // MB
      free: Math.round(freeMem / 1024 / 1024), // MB
      used: Math.round(usedMem / 1024 / 1024), // MB
      usagePercent: Math.round(memPercent * 100),
      process: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      },
    },
    cpu: {
      count: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      loadAverage: {
        '1min': Math.round(loadAvg[0] * 100) / 100,
        '5min': Math.round(loadAvg[1] * 100) / 100,
        '15min': Math.round(loadAvg[2] * 100) / 100,
      },
    },
    uptime: {
      system: Math.round(os.uptime()),
      process: Math.round(process.uptime()),
    },
  };

  // Check for warnings
  if (memPercent > PERFORMANCE_CONFIG.MEMORY_WARNING_THRESHOLD) {
    debugHelper.plog('High Memory Usage Warning', {
      currentUsage: `${Math.round(memPercent * 100)}%`,
      threshold: `${Math.round(PERFORMANCE_CONFIG.MEMORY_WARNING_THRESHOLD * 100)}%`,
    });
  }

  const avgCpuLoad = loadAvg[0] / cpus.length;
  if (avgCpuLoad > PERFORMANCE_CONFIG.CPU_WARNING_THRESHOLD) {
    debugHelper.plog('High CPU Load Warning', {
      currentLoad: `${Math.round(avgCpuLoad * 100)}%`,
      threshold: `${Math.round(PERFORMANCE_CONFIG.CPU_WARNING_THRESHOLD * 100)}%`,
    });
  }

  return metrics;
};

// =============================================================================
// THROTTLING AND RATE LIMITING
// =============================================================================

/**
 * Creates a throttled version of a function
 * @param {Function} fn - Function to throttle
 * @param {number} [delay=100] - Delay in milliseconds
 * @returns {Function} Throttled function
 */
const throttle = (fn, delay = PERFORMANCE_CONFIG.DEFAULT_THROTTLE_DELAY) => {
  let lastCall = 0;
  let timeoutId = null;

  return function (...args) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now();
          timeoutId = null;
          fn.apply(this, args);
        },
        delay - (now - lastCall)
      );
    }
  };
};

/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} [delay=300] - Delay in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (fn, delay = PERFORMANCE_CONFIG.DEFAULT_DEBOUNCE_DELAY) => {
  let timeoutId = null;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * Simple in-memory cache with TTL support
 */
class PerformanceCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Sets a cache entry with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl] - Time to live in milliseconds
   */
  set(key, value, ttl = null) {
    this.cache.set(key, value);

    if (ttl) {
      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Set new timer
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);

      this.timers.set(key, timer);
    }

    return value;
  }

  /**
   * Gets a cache entry
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Checks if a key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Deletes a cache entry
   * @param {string} key - Cache key
   * @returns {boolean} True if key was deleted
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    return this.cache.delete(key);
  }

  /**
   * Clears all cache entries
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      activeTimers: this.timers.size,
    };
  }
}

// =============================================================================
// PERFORMANCE LOGGING
// =============================================================================

/**
 * Logs performance data to file
 * @param {Object} data - Performance data to log
 * @param {string} [type='general'] - Type of performance log
 */
const logPerformance = async (data, type = 'general') => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
  const logEntry = {
    timestamp,
    type,
    data,
    pid: process.pid,
    worker: cluster.worker?.id || 'master',
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  try {
    // Ensure logs directory exists
    if (!fs.existsSync(PATHS.LOGS)) {
      fs.mkdirSync(PATHS.LOGS, { recursive: true });
    }

    fs.appendFileSync(PERFORMANCE_LOG_PATH, logLine);
  } catch (error) {
    debugHelper.perror('Performance Logging Error', error);
  }
};

/**
 * Generates a comprehensive performance report
 * @returns {Object} Complete performance report
 */
const generatePerformanceReport = () => {
  const report = {
    timestamp: moment().toISOString(),
    system: getSystemMetrics(),
    requests: getRequestStats(),
    queries: getQueryStats(),
    cache: {
      metrics: metricsCache.size,
      requests: requestMetrics.size,
      queries: queryPerformance.size,
    },
  };

  if (debugHelper.isDebugMode()) {
    debugHelper.cdir('Performance Report', report);
  }

  return report;
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Timing and measurement
  createTimer,
  measureExecution,
  benchmark,

  // Request performance
  trackRequestPerformance,
  getRequestStats,

  // Database performance
  trackQueryPerformance,
  getQueryStats,

  // System monitoring
  getSystemMetrics,

  // Throttling and optimization
  throttle,
  debounce,
  PerformanceCache,

  // Logging and reporting
  logPerformance,
  generatePerformanceReport,

  // Cache instance for general use
  cache: new PerformanceCache(),
};
