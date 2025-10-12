const HTML_SANITIZE_OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'],
  allowedAttributes: {
    a: ['href', 'title', 'target'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto'],
  },
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
};

const STRICT_HTML_SANITIZE_OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'em'],
  allowedAttributes: {},
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
};

const SANITIZATION_MODES = {
  NONE: 'none',
  BASIC: 'basic',
  STRICT: 'strict',
  PARANOID: 'paranoid',
};

const SANITIZATION_RULES_BY_FIELD = {
  email: {
    mode: SANITIZATION_MODES.BASIC,
    maxLength: 254,
    trim: true,
    lowercase: true,
    allowHtml: false,
  },
  password: {
    mode: SANITIZATION_MODES.NONE,
    maxLength: 128,
    trim: false,
    allowHtml: false,
  },
  name: {
    mode: SANITIZATION_MODES.BASIC,
    maxLength: 100,
    trim: true,
    allowHtml: false,
  },
  description: {
    mode: SANITIZATION_MODES.BASIC,
    maxLength: 5000,
    trim: true,
    allowHtml: true,
  },
  url: {
    mode: SANITIZATION_MODES.STRICT,
    maxLength: 2048,
    trim: true,
    allowHtml: false,
  },
  phone: {
    mode: SANITIZATION_MODES.STRICT,
    maxLength: 20,
    trim: true,
    allowHtml: false,
  },
};

const FIELD_SPECIFIC_PATTERNS = {
  username: /^[a-zA-Z0-9_-]{3,30}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#[0-9A-F]{6}$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

const BLACKLIST_PATTERNS = [
  /eval\(/gi,
  /Function\(/gi,
  /setTimeout\(/gi,
  /setInterval\(/gi,
  /__proto__/gi,
  /constructor/gi,
  /prototype/gi,
];

const SANITIZATION_CONTEXT = {
  API_INPUT: 'api_input',
  DATABASE_QUERY: 'database_query',
  HTML_OUTPUT: 'html_output',
  LOG_OUTPUT: 'log_output',
  EMAIL_CONTENT: 'email_content',
};

const AUTO_SANITIZE_ROUTES = [
  { path: '/api/v1/users', methods: ['POST', 'PUT', 'PATCH'], mode: SANITIZATION_MODES.STRICT },
  { path: '/api/v1/accounts', methods: ['POST', 'PUT', 'PATCH'], mode: SANITIZATION_MODES.STRICT },
  { path: '/api/v1/comments', methods: ['POST', 'PUT'], mode: SANITIZATION_MODES.BASIC },
  { path: '/api/v1/posts', methods: ['POST', 'PUT'], mode: SANITIZATION_MODES.BASIC },
];

module.exports = {
  HTML_SANITIZE_OPTIONS,
  STRICT_HTML_SANITIZE_OPTIONS,
  SANITIZATION_MODES,
  SANITIZATION_RULES_BY_FIELD,
  FIELD_SPECIFIC_PATTERNS,
  BLACKLIST_PATTERNS,
  SANITIZATION_CONTEXT,
  AUTO_SANITIZE_ROUTES,
};
