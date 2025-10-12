const crypto = require('crypto');

const { SECURITY_PATTERNS } = require('./constants.util');

class SecurityUtils {
  static generateNonce(length = 32) {
    return crypto.randomBytes(length).toString('base64url');
  }

  static generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateFingerprint(req) {
    const components = [
      req.ip,
      req.get('user-agent') || '',
      req.get('accept-language') || '',
      req.get('accept-encoding') || '',
    ].join('|');

    return crypto.createHash('sha256').update(components).digest('hex');
  }

  static hashSensitiveData(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(String(data)).digest('hex');
  }

  static maskEmail(email) {
    if (!email || typeof email !== 'string') return '';

    const [local, domain] = email.split('@');
    if (!local || !domain) return email;

    const visibleChars = Math.min(2, Math.floor(local.length / 2));
    const masked = local.substring(0, visibleChars) + '***';

    return `${masked}@${domain}`;
  }

  static maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return '';

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';

    return `***${digits.slice(-4)}`;
  }

  static maskCardNumber(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') return '';

    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 4) return '****';

    return `****-****-****-${digits.slice(-4)}`;
  }

  static isValidInput(input, type = 'alphanumeric') {
    const patterns = {
      alphanumeric: SECURITY_PATTERNS.ALPHANUMERIC,
      email: SECURITY_PATTERNS.EMAIL,
      phone: SECURITY_PATTERNS.PHONE,
      url: SECURITY_PATTERNS.URL,
      uuid: SECURITY_PATTERNS.UUID,
      slug: SECURITY_PATTERNS.SLUG,
    };

    const pattern = patterns[type];
    return pattern ? pattern.test(input) : false;
  }

  static detectSQLInjection(input) {
    if (typeof input !== 'string') return false;

    return SECURITY_PATTERNS.SQL_INJECTION.some((pattern) => pattern.test(input));
  }

  static detectXSS(input) {
    if (typeof input !== 'string') return false;

    return SECURITY_PATTERNS.XSS.some((pattern) => pattern.test(input));
  }

  static detectPathTraversal(input) {
    if (typeof input !== 'string') return false;

    return SECURITY_PATTERNS.PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(input));
  }

  static sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') return '';

    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  static generateSecurePassword(length = 16) {
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    const allChars = Object.values(charset).join('');
    let password = '';

    for (let charType of Object.values(charset)) {
      const randomIndex = crypto.randomInt(0, charType.length);
      password += charType[randomIndex];
    }

    for (let i = password.length; i < length; i++) {
      const randomIndex = crypto.randomInt(0, allChars.length);
      password += allChars[randomIndex];
    }

    return password
      .split('')
      .sort(() => crypto.randomInt(-1, 2))
      .join('');
  }

  static validatePasswordStrength(password) {
    const strength = {
      score: 0,
      feedback: [],
      isValid: false,
    };

    if (!password || typeof password !== 'string') {
      strength.feedback.push('Password is required');
      return strength;
    }

    if (password.length < 8) {
      strength.feedback.push('Password must be at least 8 characters');
    } else {
      strength.score += 1;
    }

    if (password.length >= 12) {
      strength.score += 1;
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      strength.score += 1;
    } else {
      strength.feedback.push('Password must contain both uppercase and lowercase letters');
    }

    if (/\d/.test(password)) {
      strength.score += 1;
    } else {
      strength.feedback.push('Password must contain at least one number');
    }

    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      strength.score += 1;
    } else {
      strength.feedback.push('Password must contain at least one special character');
    }

    const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
    if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
      strength.score -= 2;
      strength.feedback.push('Password contains common patterns');
    }

    strength.isValid = strength.score >= 4;
    strength.level = strength.score >= 5 ? 'strong' : strength.score >= 3 ? 'medium' : 'weak';

    return strength;
  }

  static rateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const requests = this._requestMap.get(key) || [];

    const validRequests = requests.filter((timestamp) => now - timestamp < windowMs);

    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: validRequests[0] + windowMs,
      };
    }

    validRequests.push(now);
    this._requestMap.set(key, validRequests);

    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetAt: now + windowMs,
    };
  }

  static timingSafeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  static encryptData(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  static decryptData(encryptedData, key, iv, authTag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  static generateAPIKey(prefix = 'sk') {
    const randomPart = crypto.randomBytes(32).toString('base64url');
    return `${prefix}_${randomPart}`;
  }

  static hashAPIKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}

SecurityUtils._requestMap = new Map();

module.exports = SecurityUtils;
