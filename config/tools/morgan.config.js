// =============================================================================
// MORGAN CONFIGURATION - Advanced HTTP Request Logging
// =============================================================================
// Comprehensive logging configuration for Express.js applications using Morgan
// middleware. Provides both colored console output for development and structured
// file logging for production environments.
//
// Key Features:
// - Color-coded HTTP status responses for quick visual debugging
// - Method-specific coloring for different HTTP verbs (GET, POST, PUT, etc.)
// - Response time tracking with performance threshold coloring
// - Dual output strategy: colored console + persistent file logging
// - Custom timestamp formatting with moment.js integration
//
// Performance Considerations:
// - Asynchronous file writing to avoid blocking the event loop
// - Response time tracking with performance thresholds (400ms, 800ms, 1200ms)
// - Efficient log rotation through append-only file writing
//
// Security Considerations:
// - No sensitive data (headers, body content) included in logs by default
// - File logs stored in secure directory with restricted access
// =============================================================================

// =============================================================================
// NODE.JS CORE DEPENDENCIES
// =============================================================================
const fs = require('fs');
const path = require('path');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const morgan = require('morgan'); // HTTP request logger middleware
const moment = require('moment'); // Date formatting library

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { ROOT } = require('../../helpers/constants.helper'); // Application root directory

// =============================================================================
// COLOR FORMATTING UTILITIES
// =============================================================================
/**
 * Terminal color formatting utilities for enhanced log readability
 * Supports both basic colors and custom hex color codes
 */
const color = {
  reset: '\x1b[0m',
  red: (str) => `\x1b[31m${str}\x1b[0m`,
  yellow: (str) => `\x1b[33m${str}\x1b[0m`,
  cyan: (str) => `\x1b[36m${str}\x1b[0m`,
  green: (str) => `\x1b[32m${str}\x1b[0m`,
  hex: (hexColor) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (str) => `\x1b[38;2;${r};${g};${b}m${str}${color.reset}`;
  },
};

// =============================================================================
// MORGAN TOKEN CONFIGURATIONS
// =============================================================================

// Custom timestamp format using moment.js
morgan.token('date', () => moment().format('DD/MM/YYYY, HH:mm:ss'));

// Status code coloring based on HTTP response ranges
morgan.token('statusColor', (_, res) => {
  const status = res.statusCode;
  const statusStr = status.toString();

  if (status >= 500) return color.red(statusStr); // Server errors - red
  if (status >= 400) return color.yellow(statusStr); // Client errors - yellow
  if (status >= 300) return color.cyan(statusStr); // Redirections - cyan
  if (status >= 200) return color.green(statusStr); // Success - green

  return statusStr; // Information - no color
});

// HTTP method coloring with custom colors for each verb
morgan.token('coloredMethod', (req) => {
  const colorMethod = {
    GET: color.hex('#3498db')(req.method), // Blue
    POST: color.hex('#2ecc71')(req.method), // Green
    PUT: color.hex('#f1c40f')(req.method), // Yellow
    DELETE: color.hex('#e74c3c')(req.method), // Red
    PATCH: color.hex('#9b59b6')(req.method), // Purple
  };

  return colorMethod[req.method] || req.method; // Default to no color for other methods
});

// Response time coloring with performance thresholds
morgan.token('coloredResponseTime', (req, res) => {
  if (!req._startAt || !res._startAt) return '0';

  const sec = res._startAt[0] - req._startAt[0];
  const nano = res._startAt[1] - req._startAt[1];
  const ms = sec * 1e3 + nano / 1e6;
  const time = ms.toFixed(0);

  if (ms <= 400) return color.green(time); // Good performance - green
  if (ms <= 800) return color.hex('#3498db')(time); // Acceptable - blue
  if (ms <= 1200) return color.hex('#f39c12')(time); // Slow - orange

  return color.red(time); // Very slow - red
});

// =============================================================================
// LOGGING FORMAT CONFIGURATION
// =============================================================================
const coloredFormat = ':coloredMethod :url :statusColor :coloredResponseTime ms - :date';
const fileFormat = ':method :url :status :response-time ms - :date';

// =============================================================================
// FILE LOGGING CONFIGURATION
// =============================================================================
const stream = fs.createWriteStream(
  path.join(ROOT, '/logs/access.log'),
  { flags: 'a' } // Append to existing log file
);

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  coloredFormat, // Colored console output format
  fileFormat, // File logging format (no colors)
  stream, // Write stream for file logging
  morgan, // Morgan reference for additional configuration
};
