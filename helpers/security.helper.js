// =============================================================================
// SECURITY HELPER - Comprehensive security utilities and validations
// =============================================================================
// This module provides multiple layers of security including input validation,
// sanitization, rate limiting, CSRF protection, XSS prevention, SQL injection
// protection, session management, and security headers configuration.
// =============================================================================

// =============================================================================
// CORE NODE.JS DEPENDENCIES
// =============================================================================
const crypto = require('crypto');
const url = require('url');

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const jwt = require('jsonwebtoken');
const moment = require('moment');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const contextHelper = require('./context.helper');
const config = require('../config/env');
const i18n = require('../config/i18n');
const { THREAT_LEVELS, SECURITY_CONFIG, SECURITY_PATTERNS } = require('./constants.helper');
const { cerror } = require('./debug.helper');

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

// In-memory storage for rate limiting and security tracking
const securityStorage = {
  rateLimits: new Map(),
  csrfTokens: new Map(),
  suspiciousIPs: new Map(),
  securityEvents: [],
  loginAttempts: new Map(),
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Secure random string
 */
const generateSecureToken = (length = 32) => {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    throw new Error(`Failed to generate secure token: ${error.message}`);
  }
};

/**
 * Gets current timestamp using moment.js
 * @returns {number} Current timestamp in milliseconds
 */
const getCurrentTimestamp = () => {
  return moment().valueOf();
};

/**
 * Logs security events for audit purposes
 * @param {string} event - Event type
 * @param {Object} details - Event details
 * @param {string} level - Threat level
 */
const logSecurityEvent = (event, details = {}, level = THREAT_LEVELS.LOW) => {
  try {
    const securityEvent = {
      id: generateSecureToken(16),
      event,
      level,
      timestamp: getCurrentTimestamp(),
      userAgent: contextHelper.getCurrentUserAgent(),
      ipAddress: contextHelper.getCurrentIpAddress(),
      userId: contextHelper.getCurrentUserId(),
      sessionId: contextHelper.getCurrentSessionId(),
      details: sanitizeLogData(details),
    };

    securityStorage.securityEvents.push(securityEvent);

    // Keep only last 1000 events
    if (securityStorage.securityEvents.length > 1000) {
      securityStorage.securityEvents = securityStorage.securityEvents.slice(-1000);
    }

    // Set security context for current request
    contextHelper.setCustomData('lastSecurityEvent', securityEvent);

    return securityEvent.id;
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

/**
 * Sanitizes data for logging to prevent log injection
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
const sanitizeLogData = (data) => {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t]/g, ' ').substring(0, 500);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    Object.entries(data).forEach(([key, value]) => {
      sanitized[key] = sanitizeLogData(value);
    });
    return sanitized;
  }
  return data;
};

// =============================================================================
// INPUT VALIDATION AND SANITIZATION
// =============================================================================

/**
 * Validates and sanitizes string input
 * @param {string} input - Input string to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with sanitized value
 */
const validateAndSanitizeString = (input, options = {}) => {
  try {
    const {
      minLength = 0,
      maxLength = SECURITY_CONFIG.VALIDATION.MAX_STRING_LENGTH,
      allowHTML = false,
      allowSpecialChars = true,
      pattern = null,
      required = false,
    } = options;

    const errors = [];

    // Check if required
    if (required && (!input || input.trim() === '')) {
      errors.push('Field is required');
      return { isValid: false, errors, sanitized: '' };
    }

    // If not required and empty, return early
    if (!required && (!input || input.trim() === '')) {
      return { isValid: true, errors: [], sanitized: '' };
    }

    let sanitized = input.toString().trim();

    // Length validation
    if (sanitized.length < minLength) {
      errors.push(`Minimum length is ${minLength} characters`);
    }
    if (sanitized.length > maxLength) {
      errors.push(`Maximum length is ${maxLength} characters`);
      sanitized = sanitized.substring(0, maxLength);
    }

    // XSS prevention
    if (SECURITY_PATTERNS.XSS.test(sanitized)) {
      errors.push('Potentially malicious script detected');
      logSecurityEvent('XSS_ATTEMPT', { input: sanitized }, THREAT_LEVELS.HIGH);
    }

    // HTML sanitization
    if (!allowHTML) {
      sanitized = sanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
    }

    // Special character handling
    if (!allowSpecialChars) {
      sanitized = sanitized.replace(SECURITY_PATTERNS.SPECIAL_CHARS, '');
    }

    // Pattern validation
    if (pattern && !pattern.test(sanitized)) {
      errors.push('Input does not match required format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  } catch (error) {
    logSecurityEvent('VALIDATION_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    return {
      isValid: false,
      errors: ['Validation failed'],
      sanitized: '',
    };
  }
};

/**
 * Validates email address format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
const validateEmail = (email) => {
  const result = validateAndSanitizeString(email, {
    pattern: SECURITY_PATTERNS.EMAIL,
    maxLength: 254,
    allowHTML: false,
    allowSpecialChars: true,
    required: true,
  });

  if (!result.isValid) {
    result.errors = ['Invalid email format'];
  }

  return result;
};

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
const validatePhone = (phone) => {
  const result = validateAndSanitizeString(phone, {
    pattern: SECURITY_PATTERNS.PHONE,
    minLength: 10,
    maxLength: 20,
    allowHTML: false,
    required: true,
  });

  if (!result.isValid) {
    result.errors = ['Invalid phone number format'];
  }

  return result;
};

/**
 * Validates URL format and checks for malicious content
 * @param {string} inputUrl - URL to validate
 * @param {Array} allowedDomains - Allowed domains (optional)
 * @returns {Object} Validation result
 */
const validateUrl = (inputUrl, allowedDomains = []) => {
  try {
    const result = validateAndSanitizeString(inputUrl, {
      pattern: SECURITY_PATTERNS.URL,
      maxLength: 2048,
      allowHTML: false,
      required: true,
    });

    if (!result.isValid) {
      return result;
    }

    const parsedUrl = url.parse(result.sanitized);
    const errors = [];

    // Protocol validation
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      errors.push('Only HTTP and HTTPS protocols are allowed');
    }

    // Domain whitelist check
    if (allowedDomains.length > 0 && !allowedDomains.includes(parsedUrl.hostname)) {
      errors.push('Domain not allowed');
      logSecurityEvent(
        'UNAUTHORIZED_DOMAIN_ACCESS',
        {
          url: result.sanitized,
          domain: parsedUrl.hostname,
        },
        THREAT_LEVELS.MEDIUM
      );
    }

    // Check for suspicious patterns
    const suspiciousPatterns = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    const lowerUrl = result.sanitized.toLowerCase();

    if (suspiciousPatterns.some((pattern) => lowerUrl.includes(pattern))) {
      errors.push('Potentially malicious URL detected');
      logSecurityEvent('MALICIOUS_URL_ATTEMPT', { url: result.sanitized }, THREAT_LEVELS.HIGH);
    }

    return {
      isValid: errors.length === 0,
      errors: [...result.errors, ...errors],
      sanitized: result.sanitized,
      parsed: parsedUrl,
    };
  } catch (error) {
    cerror('URL_VALIDATION_ERROR', error.message);

    return {
      isValid: false,
      errors: ['Invalid URL format'],
      sanitized: '',
      parsed: null,
    };
  }
};

/**
 * Validates and sanitizes object input with depth protection
 * @param {Object} obj - Object to validate
 * @param {number} maxDepth - Maximum allowed depth
 * @param {number} currentDepth - Current depth (internal)
 * @returns {Object} Validation result
 */
const validateAndSanitizeObject = (obj, maxDepth = SECURITY_CONFIG.VALIDATION.MAX_OBJECT_DEPTH, currentDepth = 0) => {
  try {
    if (currentDepth > maxDepth) {
      return {
        isValid: false,
        errors: ['Object depth exceeds maximum allowed'],
        sanitized: {},
      };
    }

    if (typeof obj !== 'object' || obj === null) {
      return {
        isValid: false,
        errors: ['Input is not a valid object'],
        sanitized: {},
      };
    }

    const sanitized = {};
    const errors = [];

    Object.entries(obj).forEach(([key, value]) => {
      // Sanitize key
      const keyResult = validateAndSanitizeString(key, {
        maxLength: 100,
        allowHTML: false,
        allowSpecialChars: false,
      });

      if (!keyResult.isValid) {
        errors.push(`Invalid key: ${key}`);
        return;
      }

      // Sanitize value based on type
      if (typeof value === 'string') {
        const valueResult = validateAndSanitizeString(value);
        sanitized[keyResult.sanitized] = valueResult.sanitized;
        if (!valueResult.isValid) {
          errors.push(...valueResult.errors.map((err) => `${key}: ${err}`));
        }
      } else if (typeof value === 'object' && value !== null) {
        const valueResult = validateAndSanitizeObject(value, maxDepth, currentDepth + 1);
        sanitized[keyResult.sanitized] = valueResult.sanitized;
        if (!valueResult.isValid) {
          errors.push(...valueResult.errors.map((err) => `${key}: ${err}`));
        }
      } else {
        sanitized[keyResult.sanitized] = value;
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  } catch (error) {
    logSecurityEvent('OBJECT_VALIDATION_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    return {
      isValid: false,
      errors: ['Object validation failed'],
      sanitized: {},
    };
  }
};

/**
 * Checks for SQL injection patterns in input
 * @param {string} input - Input to check
 * @returns {Object} Detection result
 */
const detectSQLInjection = (input) => {
  try {
    const isSuspicious = SECURITY_PATTERNS.SQL_INJECTION.test(input);

    if (isSuspicious) {
      logSecurityEvent('SQL_INJECTION_ATTEMPT', { input }, THREAT_LEVELS.CRITICAL);
    }

    return {
      isSuspicious,
      input: isSuspicious ? '' : input, // Clear suspicious input
    };
  } catch (error) {
    cerror('SQL_INJECTION_DETECTION_ERROR', error.message);

    return {
      isSuspicious: true,
      input: '',
    };
  }
};

/**
 * Sanitizes HTML content with configurable options
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized HTML
 */
const sanitizeHTML = (html, options = {}) => {
  const {
    allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes = ['class', 'style'],
    stripDangerousTags = true,
  } = options;

  let sanitized = html;

  if (stripDangerousTags) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }

  const tagPattern = new RegExp(`</?(?!(${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
  sanitized = sanitized.replace(tagPattern, '');

  // Sanitizar atributos
  sanitized = sanitized.replace(/<(\w+)([^>]*)>/gi, (_, tag, attributes) => {
    if (!allowedTags.includes(tag)) return '';

    const allowedAttrsPattern = new RegExp(`\\s+(${allowedAttributes.join('|')})\\s*=\\s*(["'])(.*?)\\2`, 'gi');
    const safeAttributes = (attributes.match(allowedAttrsPattern) || []).join(' ');

    return `<${tag}${safeAttributes ? ' ' + safeAttributes : ''}>`;
  });

  return sanitized;
};

/**
 * Detects potential XSS attacks in HTML content
 * @param {string} content - Content to check
 * @returns {boolean} True if XSS patterns detected
 */
const detectXSS = (content) => {
  const xssPatterns = [
    /<script\b/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /alert\(/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(content));
};

// =============================================================================
// PASSWORD SECURITY
// =============================================================================

/**
 * Validates password strength according to security policy
 * @param {string} password - Password to validate
 * @param {Object} customPolicy - Custom password policy (optional)
 * @returns {Object} Validation result with strength score
 */
const validatePasswordStrength = (password, customPolicy = {}) => {
  try {
    const policy = { ...SECURITY_CONFIG.PASSWORD_POLICY, ...customPolicy };
    const errors = [];
    let score = 0;

    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        errors: ['Password is required'],
        strength: 'invalid',
        score: 0,
      };
    }

    // Length validation
    if (password.length < policy.MIN_LENGTH) {
      errors.push(`Password must be at least ${policy.MIN_LENGTH} characters long`);
    } else {
      score += 2;
    }

    if (password.length > policy.MAX_LENGTH) {
      errors.push(`Password must not exceed ${policy.MAX_LENGTH} characters`);
    }

    // Character requirements
    if (policy.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (policy.REQUIRE_UPPERCASE) {
      score += 1;
    }

    if (policy.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (policy.REQUIRE_LOWERCASE) {
      score += 1;
    }

    if (policy.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (policy.REQUIRE_NUMBERS) {
      score += 1;
    }

    if (
      policy.REQUIRE_SPECIAL &&
      !new RegExp(`[${policy.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)
    ) {
      errors.push('Password must contain at least one special character');
    } else if (policy.REQUIRE_SPECIAL) {
      score += 2;
    }

    // Additional strength checks
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters

    // Determine strength level
    let strength;
    if (score >= 7) strength = 'very_strong';
    else if (score >= 5) strength = 'strong';
    else if (score >= 3) strength = 'medium';
    else if (score >= 1) strength = 'weak';
    else strength = 'very_weak';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score: Math.max(0, score),
    };
  } catch (error) {
    cerror('Password Validation', `Error validating password: ${error.message}`);

    return {
      isValid: false,
      errors: ['Password validation failed'],
      strength: 'invalid',
      score: 0,
    };
  }
};

/**
 * Checks if password is commonly used (basic blacklist)
 * @param {string} password - Password to check
 * @returns {boolean} True if password is common
 */
const isCommonPassword = (password) => {
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'password1',
    'qwerty123',
    '123123',
    '111111',
    '000000',
    'iloveyou',
    'dragon',
  ];

  return commonPasswords.includes(password.toLowerCase());
};

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Implements rate limiting for requests
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {Object} options - Rate limiting options
 * @returns {Object} Rate limit result
 */
const checkRateLimit = (identifier, options = {}) => {
  try {
    const {
      windowMs = SECURITY_CONFIG.RATE_LIMIT.DEFAULT_WINDOW,
      maxRequests = SECURITY_CONFIG.RATE_LIMIT.DEFAULT_MAX_REQUESTS,
      keyPrefix = 'rate_limit',
    } = options;

    const key = `${keyPrefix}:${identifier}`;
    const now = getCurrentTimestamp();

    if (!securityStorage.rateLimits.has(key)) {
      securityStorage.rateLimits.set(key, {
        requests: [],
        windowStart: now,
      });
    }

    const rateLimitData = securityStorage.rateLimits.get(key);

    // Clean old requests outside the window
    const windowStart = now - windowMs;
    rateLimitData.requests = rateLimitData.requests.filter((timestamp) => timestamp > windowStart);

    // Check if rate limit exceeded
    if (rateLimitData.requests.length >= maxRequests) {
      const resetTime = rateLimitData.requests[0] + windowMs;

      logSecurityEvent(
        'RATE_LIMIT_EXCEEDED',
        {
          identifier,
          requestCount: rateLimitData.requests.length,
          maxRequests,
        },
        THREAT_LEVELS.MEDIUM
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime: moment(resetTime).toISOString(),
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    // Add current request
    rateLimitData.requests.push(now);

    return {
      allowed: true,
      remaining: maxRequests - rateLimitData.requests.length,
      resetTime: moment(now + windowMs).toISOString(),
      retryAfter: 0,
    };
  } catch (error) {
    logSecurityEvent('RATE_LIMIT_ERROR', { error: error.message }, THREAT_LEVELS.LOW);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: 0,
      resetTime: moment().toISOString(),
      retryAfter: 0,
    };
  }
};

/**
 * Implements strict rate limiting for sensitive operations
 * @param {string} identifier - Unique identifier
 * @returns {Object} Strict rate limit result
 */
const checkStrictRateLimit = (identifier) => {
  return checkRateLimit(identifier, {
    windowMs: SECURITY_CONFIG.RATE_LIMIT.STRICT_WINDOW,
    maxRequests: SECURITY_CONFIG.RATE_LIMIT.STRICT_MAX_REQUESTS,
    keyPrefix: 'strict_rate_limit',
  });
};

// =============================================================================
// CSRF PROTECTION
// =============================================================================

/**
 * Generates a CSRF token for the current session
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
  try {
    const sessionId = contextHelper.getCurrentSessionId();
    if (!sessionId) {
      throw new Error('No active session found');
    }

    const token = generateSecureToken(SECURITY_CONFIG.CSRF.TOKEN_LENGTH);
    const expiry = getCurrentTimestamp() + SECURITY_CONFIG.CSRF.TOKEN_EXPIRY;

    securityStorage.csrfTokens.set(token, {
      sessionId,
      expiry,
      used: false,
    });

    // Clean expired tokens
    cleanupExpiredCSRFTokens();

    logSecurityEvent('CSRF_TOKEN_GENERATED', { sessionId }, THREAT_LEVELS.LOW);

    return token;
  } catch (error) {
    logSecurityEvent('CSRF_TOKEN_GENERATION_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    throw new Error(`CSRF token generation failed: ${error.message}`);
  }
};

/**
 * Validates a CSRF token
 * @param {string} token - CSRF token to validate
 * @param {boolean} oneTimeUse - Whether token should be invalidated after use
 * @returns {boolean} True if token is valid
 */
const validateCSRFToken = (token, oneTimeUse = true) => {
  try {
    if (!token) {
      logSecurityEvent('CSRF_TOKEN_MISSING', {}, THREAT_LEVELS.HIGH);
      return false;
    }

    const tokenData = securityStorage.csrfTokens.get(token);
    if (!tokenData) {
      logSecurityEvent('CSRF_TOKEN_INVALID', { token: token.substring(0, 8) + '...' }, THREAT_LEVELS.HIGH);
      return false;
    }

    // Check expiry
    if (getCurrentTimestamp() > tokenData.expiry) {
      securityStorage.csrfTokens.delete(token);
      logSecurityEvent('CSRF_TOKEN_EXPIRED', {}, THREAT_LEVELS.MEDIUM);
      return false;
    }

    // Check if already used (for one-time tokens)
    if (oneTimeUse && tokenData.used) {
      logSecurityEvent('CSRF_TOKEN_REUSE_ATTEMPT', {}, THREAT_LEVELS.HIGH);
      return false;
    }

    // Validate session
    const currentSessionId = contextHelper.getCurrentSessionId();
    if (tokenData.sessionId !== currentSessionId) {
      logSecurityEvent('CSRF_TOKEN_SESSION_MISMATCH', {}, THREAT_LEVELS.HIGH);
      return false;
    }

    // Mark as used if one-time use
    if (oneTimeUse) {
      tokenData.used = true;
    }

    logSecurityEvent('CSRF_TOKEN_VALIDATED', {}, THREAT_LEVELS.LOW);
    return true;
  } catch (error) {
    logSecurityEvent('CSRF_VALIDATION_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    return false;
  }
};

/**
 * Cleans up expired CSRF tokens
 */
const cleanupExpiredCSRFTokens = () => {
  try {
    const now = getCurrentTimestamp();
    const expiredTokens = [];

    securityStorage.csrfTokens.forEach((tokenData, token) => {
      if (now > tokenData.expiry) {
        expiredTokens.push(token);
      }
    });

    expiredTokens.forEach((token) => {
      securityStorage.csrfTokens.delete(token);
    });
  } catch (error) {
    console.error('CSRF token cleanup failed:', error);
  }
};

// =============================================================================
// SESSION SECURITY
// =============================================================================

/**
 * Validates session security and freshness
 * @param {Object} sessionData - Session data to validate
 * @returns {Object} Session validation result
 */
const validateSessionSecurity = (sessionData) => {
  try {
    const errors = [];
    const now = getCurrentTimestamp();

    if (!sessionData || typeof sessionData !== 'object') {
      errors.push('Invalid session data');
      return { isValid: false, errors, shouldRenew: false };
    }

    // Check session age
    const sessionAge = now - (sessionData.createdAt || 0);
    if (sessionAge > SECURITY_CONFIG.SESSION.MAX_AGE) {
      errors.push('Session expired due to age');
      logSecurityEvent('SESSION_AGE_EXPIRED', { sessionAge }, THREAT_LEVELS.LOW);
    }

    // Check idle timeout
    const idleTime = now - (sessionData.lastActivity || sessionData.createdAt || 0);
    if (idleTime > SECURITY_CONFIG.SESSION.IDLE_TIMEOUT) {
      errors.push('Session expired due to inactivity');
      logSecurityEvent('SESSION_IDLE_EXPIRED', { idleTime }, THREAT_LEVELS.LOW);
    }

    // Check absolute timeout
    const absoluteAge = now - (sessionData.createdAt || 0);
    if (absoluteAge > SECURITY_CONFIG.SESSION.ABSOLUTE_TIMEOUT) {
      errors.push('Session expired due to absolute timeout');
      logSecurityEvent('SESSION_ABSOLUTE_EXPIRED', { absoluteAge }, THREAT_LEVELS.LOW);
    }

    // Check IP consistency (if enabled)
    const currentIp = contextHelper.getCurrentIpAddress();
    if (sessionData.ipAddress && currentIp && sessionData.ipAddress !== currentIp) {
      errors.push('IP address mismatch detected');
      logSecurityEvent(
        'SESSION_IP_MISMATCH',
        {
          originalIp: sessionData.ipAddress,
          currentIp,
        },
        THREAT_LEVELS.HIGH
      );
    }

    // Check user agent consistency (basic check)
    const currentUserAgent = contextHelper.getCurrentUserAgent();
    if (sessionData.userAgent && currentUserAgent) {
      const agentChanged = !currentUserAgent.includes(sessionData.userAgent.split(' ')[0]);
      if (agentChanged) {
        logSecurityEvent('SESSION_USER_AGENT_CHANGE', {}, THREAT_LEVELS.MEDIUM);
      }
    }

    const shouldRenew = sessionAge > SECURITY_CONFIG.SESSION.MAX_AGE * 0.75; // Renew when 75% of max age

    return {
      isValid: errors.length === 0,
      errors,
      shouldRenew,
    };
  } catch (error) {
    logSecurityEvent('SESSION_VALIDATION_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    return {
      isValid: false,
      errors: ['Session validation failed'],
      shouldRenew: false,
    };
  }
};

/**
 * Creates secure session data
 * @param {string} userId - User ID
 * @param {Object} additionalData - Additional session data
 * @returns {Object} Secure session data
 */
const createSecureSession = (userId, additionalData = {}) => {
  try {
    const now = getCurrentTimestamp();
    const sessionId = generateSecureToken(32);

    const sessionData = {
      sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      ipAddress: contextHelper.getCurrentIpAddress(),
      userAgent: contextHelper.getCurrentUserAgent(),
      csrfToken: generateCSRFToken(),
      ...sanitizeLogData(additionalData),
    };

    logSecurityEvent('SESSION_CREATED', { userId, sessionId }, THREAT_LEVELS.LOW);

    return sessionData;
  } catch (error) {
    logSecurityEvent('SESSION_CREATION_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    throw new Error(`Session creation failed: ${error.message}`);
  }
};

// =============================================================================
// LOGIN ATTEMPT TRACKING
// =============================================================================

/**
 * Tracks and validates login attempts to prevent brute force attacks
 * @param {string} identifier - Login identifier (email, username, IP)
 * @param {boolean} success - Whether login was successful
 * @returns {Object} Login attempt validation result
 */
const trackLoginAttempt = (identifier, success = false) => {
  try {
    const now = getCurrentTimestamp();
    const key = `login:${identifier}`;

    if (!securityStorage.loginAttempts.has(key)) {
      securityStorage.loginAttempts.set(key, {
        attempts: [],
        lockoutUntil: null,
        successfulLogins: [],
      });
    }

    const loginData = securityStorage.loginAttempts.get(key);

    // Clean old attempts (older than 1 hour)
    const hourAgo = now - 60 * 60 * 1000;
    loginData.attempts = loginData.attempts.filter((attempt) => attempt.timestamp > hourAgo);
    loginData.successfulLogins = loginData.successfulLogins.filter((login) => login > hourAgo);

    if (success) {
      // Reset failed attempts on successful login
      loginData.attempts = [];
      loginData.lockoutUntil = null;
      loginData.successfulLogins.push(now);

      logSecurityEvent('LOGIN_SUCCESS', { identifier }, THREAT_LEVELS.LOW);

      return {
        allowed: true,
        attemptsRemaining: 5,
        lockoutUntil: null,
        message: 'Login successful',
      };
    } else {
      // Track failed attempt
      loginData.attempts.push({
        timestamp: now,
        ipAddress: contextHelper.getCurrentIpAddress(),
        userAgent: contextHelper.getCurrentUserAgent(),
      });

      const recentAttempts = loginData.attempts.length;

      // Progressive lockout
      let lockoutDuration = 0;
      let maxAttempts = 5;

      if (recentAttempts >= 10) {
        lockoutDuration = 60 * 60 * 1000; // 1 hour
        maxAttempts = 10;
      } else if (recentAttempts >= 5) {
        lockoutDuration = 15 * 60 * 1000; // 15 minutes
        maxAttempts = 5;
      } else if (recentAttempts >= 3) {
        lockoutDuration = 5 * 60 * 1000; // 5 minutes
        maxAttempts = 3;
      }

      if (lockoutDuration > 0) {
        loginData.lockoutUntil = now + lockoutDuration;

        logSecurityEvent(
          'LOGIN_LOCKOUT',
          {
            identifier,
            attempts: recentAttempts,
            lockoutDuration: lockoutDuration / 1000,
          },
          THREAT_LEVELS.HIGH
        );
      } else {
        logSecurityEvent(
          'LOGIN_FAILURE',
          {
            identifier,
            attempts: recentAttempts,
          },
          THREAT_LEVELS.MEDIUM
        );
      }

      return {
        allowed: recentAttempts < maxAttempts,
        attemptsRemaining: Math.max(0, maxAttempts - recentAttempts),
        lockoutUntil: loginData.lockoutUntil ? moment(loginData.lockoutUntil).toISOString() : null,
        message: recentAttempts >= maxAttempts ? 'Account temporarily locked' : 'Invalid credentials',
      };
    }
  } catch (error) {
    logSecurityEvent('LOGIN_TRACKING_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    // Fail safe - allow login if tracking fails
    return {
      allowed: true,
      attemptsRemaining: 5,
      lockoutUntil: null,
      message: 'Login tracking unavailable',
    };
  }
};

/**
 * Checks if identifier is currently locked out
 * @param {string} identifier - Login identifier to check
 * @returns {boolean} True if locked out
 */
const isLockedOut = (identifier) => {
  try {
    const key = `login:${identifier}`;
    const loginData = securityStorage.loginAttempts.get(key);

    if (!loginData || !loginData.lockoutUntil) {
      return false;
    }

    const now = getCurrentTimestamp();
    if (now > loginData.lockoutUntil) {
      // Lockout expired
      loginData.lockoutUntil = null;
      return false;
    }

    return true;
  } catch (error) {
    cerror('IS_LOCKED_OUT_ERROR', error.message);

    return false; // Fail safe
  }
};

// =============================================================================
// IP ADDRESS SECURITY
// =============================================================================

/**
 * Tracks suspicious IP addresses
 * @param {string} ipAddress - IP address to track
 * @param {string} reason - Reason for suspicion
 * @param {string} severity - Severity level
 */
const markSuspiciousIP = (ipAddress, reason, severity = THREAT_LEVELS.MEDIUM) => {
  try {
    if (!securityStorage.suspiciousIPs.has(ipAddress)) {
      securityStorage.suspiciousIPs.set(ipAddress, {
        incidents: [],
        blockedUntil: null,
        totalIncidents: 0,
      });
    }

    const ipData = securityStorage.suspiciousIPs.get(ipAddress);
    const now = getCurrentTimestamp();

    ipData.incidents.push({
      timestamp: now,
      reason,
      severity,
    });
    ipData.totalIncidents++;

    // Auto-block based on severity and frequency
    if (severity === THREAT_LEVELS.CRITICAL || ipData.totalIncidents >= 10) {
      ipData.blockedUntil = now + 24 * 60 * 60 * 1000; // 24 hours
    } else if (severity === THREAT_LEVELS.HIGH || ipData.totalIncidents >= 5) {
      ipData.blockedUntil = now + 60 * 60 * 1000; // 1 hour
    }

    logSecurityEvent(
      'SUSPICIOUS_IP_MARKED',
      {
        ipAddress,
        reason,
        severity,
        totalIncidents: ipData.totalIncidents,
      },
      severity
    );
  } catch (error) {
    console.error('Failed to mark suspicious IP:', error);
  }
};

/**
 * Checks if IP address is blocked
 * @param {string} ipAddress - IP address to check
 * @returns {Object} IP status result
 */
const checkIPStatus = (ipAddress) => {
  try {
    const ipData = securityStorage.suspiciousIPs.get(ipAddress);

    if (!ipData) {
      return {
        isBlocked: false,
        isSuspicious: false,
        blockedUntil: null,
        incidentCount: 0,
      };
    }

    const now = getCurrentTimestamp();

    // Check if block expired
    if (ipData.blockedUntil && now > ipData.blockedUntil) {
      ipData.blockedUntil = null;
    }

    return {
      isBlocked: ipData.blockedUntil !== null,
      isSuspicious: ipData.incidents.length > 0,
      blockedUntil: ipData.blockedUntil ? moment(ipData.blockedUntil).toISOString() : null,
      incidentCount: ipData.totalIncidents,
    };
  } catch (error) {
    cerror('IP_STATUS_CHECK_ERROR', error.message);

    return {
      isBlocked: false,
      isSuspicious: false,
      blockedUntil: null,
      incidentCount: 0,
    };
  }
};

// =============================================================================
// AUDIT AND MONITORING
// =============================================================================

/**
 * Gets recent security events for monitoring
 * @param {Object} filters - Event filters
 * @returns {Array} Filtered security events
 */
const getSecurityEvents = (filters = {}) => {
  try {
    const {
      level = null,
      eventType = null,
      timeRange = 24 * 60 * 60 * 1000, // 24 hours
      limit = 100,
    } = filters;

    const now = getCurrentTimestamp();
    const cutoff = now - timeRange;

    let events = securityStorage.securityEvents.filter((event) => event.timestamp > cutoff);

    if (level) {
      events = events.filter((event) => event.level === level);
    }

    if (eventType) {
      events = events.filter((event) => event.event.includes(eventType.toUpperCase()));
    }

    // Sort by timestamp (newest first) and limit
    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.error('Failed to get security events:', error);
    return [];
  }
};

/**
 * Gets security statistics summary
 * @param {number} timeRange - Time range in milliseconds
 * @returns {Object} Security statistics
 */
const getSecurityStats = (timeRange = 24 * 60 * 60 * 1000) => {
  try {
    const events = getSecurityEvents({ timeRange, limit: 10000 });

    const stats = {
      totalEvents: events.length,
      eventsByLevel: {
        [THREAT_LEVELS.LOW]: 0,
        [THREAT_LEVELS.MEDIUM]: 0,
        [THREAT_LEVELS.HIGH]: 0,
        [THREAT_LEVELS.CRITICAL]: 0,
      },
      eventsByType: {},
      uniqueIPs: new Set(),
      suspiciousIPs: securityStorage.suspiciousIPs.size,
      activeRateLimits: securityStorage.rateLimits.size,
      activeSessions: 0, // This would need to be tracked separately
    };

    events.forEach((event) => {
      stats.eventsByLevel[event.level]++;

      const eventType = event.event.split('_')[0];
      stats.eventsByType[eventType] = (stats.eventsByType[eventType] || 0) + 1;

      if (event.ipAddress) {
        stats.uniqueIPs.add(event.ipAddress);
      }
    });

    stats.uniqueIPs = stats.uniqueIPs.size;

    return stats;
  } catch (error) {
    console.error('Failed to get security stats:', error);
    return {
      totalEvents: 0,
      eventsByLevel: {},
      eventsByType: {},
      uniqueIPs: 0,
      suspiciousIPs: 0,
      activeRateLimits: 0,
      activeSessions: 0,
      error: 'Statistics unavailable',
    };
  }
};

/**
 * Performs security health check
 * @returns {Object} Security health status
 */
const performSecurityHealthCheck = () => {
  try {
    const checks = {
      contextAvailable: contextHelper.hasContext(),
      rateLimitingActive: securityStorage.rateLimits.size < 10000, // Prevent memory overflow
      csrfTokensManaged: securityStorage.csrfTokens.size < 1000,
      eventLoggingActive: securityStorage.securityEvents.length > 0,
      suspiciousIPTracking: true,
      loginAttemptTracking: true,
    };

    const failedChecks = Object.entries(checks).filter(([, status]) => !status);
    const isHealthy = failedChecks.length === 0;

    return {
      isHealthy,
      checks,
      failedChecks: failedChecks.map(([check]) => check),
      timestamp: moment().toISOString(),
    };
  } catch (error) {
    return {
      isHealthy: false,
      checks: {},
      failedChecks: ['health_check_failed'],
      error: error.message,
      timestamp: moment().toISOString(),
    };
  }
};

// =============================================================================
// CLEANUP AND MAINTENANCE
// =============================================================================

/**
 * Performs cleanup of expired security data
 * @returns {Object} Cleanup result
 */
const performSecurityCleanup = () => {
  try {
    const now = getCurrentTimestamp();
    let cleaned = 0;

    // Cleanup expired CSRF tokens
    cleanupExpiredCSRFTokens();

    // Cleanup old rate limit entries
    securityStorage.rateLimits.forEach((data, key) => {
      const windowStart = now - 15 * 60 * 1000; // 15 minutes
      data.requests = data.requests.filter((timestamp) => timestamp > windowStart);

      if (data.requests.length === 0) {
        securityStorage.rateLimits.delete(key);
        cleaned++;
      }
    });

    // Cleanup old login attempts
    securityStorage.loginAttempts.forEach((data, key) => {
      const hourAgo = now - 60 * 60 * 1000;
      data.attempts = data.attempts.filter((attempt) => attempt.timestamp > hourAgo);

      if (data.attempts.length === 0 && !data.lockoutUntil) {
        securityStorage.loginAttempts.delete(key);
        cleaned++;
      }
    });

    // Cleanup old security events (keep only last 1000)
    if (securityStorage.securityEvents.length > 1000) {
      const removed = securityStorage.securityEvents.length - 1000;
      securityStorage.securityEvents = securityStorage.securityEvents.slice(-1000);
      cleaned += removed;
    }

    // Cleanup expired IP blocks
    securityStorage.suspiciousIPs.forEach((data, ip) => {
      if (data.blockedUntil && now > data.blockedUntil) {
        data.blockedUntil = null;
      }

      // Clean old incidents (older than 24 hours)
      const dayAgo = now - 24 * 60 * 60 * 1000;
      data.incidents = data.incidents.filter((incident) => incident.timestamp > dayAgo);

      if (data.incidents.length === 0 && !data.blockedUntil) {
        securityStorage.suspiciousIPs.delete(ip);
        cleaned++;
      }
    });

    logSecurityEvent('SECURITY_CLEANUP', { itemsCleaned: cleaned }, THREAT_LEVELS.LOW);

    return {
      success: true,
      itemsCleaned: cleaned,
      timestamp: moment().toISOString(),
    };
  } catch (error) {
    logSecurityEvent('SECURITY_CLEANUP_ERROR', { error: error.message }, THREAT_LEVELS.MEDIUM);
    return {
      success: false,
      error: error.message,
      itemsCleaned: 0,
      timestamp: moment().toISOString(),
    };
  }
};

// =============================================================================
// JWT FUNCTIONS
// =============================================================================

/**
 * Creates a JWT token with the given payload and secret.
 *
 * @param {Object} payload - Payload to be signed.
 * @param {string} secret - Secret used for signing.
 * @param {Object} [options] - Additional options for the token.
 * @param {string} [options.algorithm] - Algorithm to use (default: {@link module:config/env~config.jwt.algorithm}).
 * @param {string|number} [options.expiresIn] - Expiration time (default: none).
 * @param {string|number} [options.notBefore] - "Not before" time (default: 0 seconds).
 * @param {string} [options.audience] - Audience for the token (default: none).
 * @param {string} [options.issuer] - Issuer of the token (default: none).
 * @param {string} [options.jwtid] - JWT ID (default: random value).
 * @param {string} [options.subject] - Subject of the token (default: none).
 * @param {string} [options.encoding] - Encoding of the payload (default: UTF-8).
 *
 * @returns {string} The signed JWT token.
 *
 * @throws {Error} If the token creation fails.
 */
const createJWT = (payload, secret, options = {}) => {
  try {
    const defaultOptions = {
      algorithm: config.jwt.algorithm,
      expiresIn: undefined,
      notBefore: '0s',
      audience: undefined,
      issuer: undefined,
      jwtid: Math.random().toString(36).substring(7),
      subject: undefined,
      encoding: 'utf8',
    };

    const finalOptions = { ...defaultOptions, ...options };

    return jwt.sign(payload, secret, finalOptions);
  } catch (error) {
    throw new Error(`Failed to create JWT: ${error.message}`);
  }
};

const verifyJWT = (token, secret, options = {}) => {
  try {
    const defaultOptions = {
      algorithms: [config.jwt.algorithm],
      clockTolerance: 60,
    };

    const finalOptions = { ...defaultOptions, ...options };

    return jwt.verify(token, secret, finalOptions);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error(i18n.__('error.invalid_token'));
    } else if (error.name === 'TokenExpiredError') {
      const tokenError = new Error(i18n.__('error.expired_token'));
      tokenError.name = 'TokenExpiredError';
      throw tokenError;
    } else if (error.name === 'NotBeforeError') {
      const tokenError = new Error(i18n.__('error.token_not_active'));
      tokenError.name = 'JsonWebTokenError';
      throw tokenError;
    } else {
      throw new Error(`Failed to verify JWT: ${error.message}`);
    }
  }
};

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = {
  // Input Validation and Sanitization
  validateAndSanitizeString,
  validateEmail,
  validatePhone,
  validateUrl,
  validateAndSanitizeObject,
  detectSQLInjection,
  sanitizeHTML,
  detectXSS,

  // Password Security
  validatePasswordStrength,
  isCommonPassword,

  // Rate Limiting
  checkRateLimit,
  checkStrictRateLimit,

  // CSRF Protection
  generateCSRFToken,
  validateCSRFToken,

  // Session Security
  validateSessionSecurity,
  createSecureSession,

  // Login Security
  trackLoginAttempt,
  isLockedOut,

  // IP Security
  markSuspiciousIP,
  checkIPStatus,

  // Security Logging and Events
  logSecurityEvent,
  getSecurityEvents,
  getSecurityStats,

  // Monitoring and Maintenance
  performSecurityHealthCheck,
  performSecurityCleanup,

  // Utility Functions
  generateSecureToken,
  getCurrentTimestamp,

  // JWT Functions
  createJWT,
  verifyJWT,
};
