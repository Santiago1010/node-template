/**
 * Application Configuration Helper
 *
 * Centralizes and exports commonly used constants and paths throughout the application.
 *
 * Designed to be extensible - new constants can be added as needed while maintaining
 * the same export structure. All paths are derived from the application root directory.
 *
 * Usage: Destructure required constants from the imported object.
 * Example: const { paths, modes } = require('~/helpers/constants.helper.js');
 */

// Define different environment modes with their corresponding numeric values
const modes = { production: 4, development: 2, test: 1, local: 0 };

// Get the root directory of the application
const root = process.cwd();

// Define paths for different application components relative to the root directory
const paths = {
  templates: root + '/templates', // Path for template files
  controllers: root + '/controllers', // Path for controller files
  diagrams: root + '/context', // Path for context diagrams
  services: root + '/services', // Path for service files
  locales: root + '/configurations/i18n/locales', // Path for localization files
  routes: root + '/routes', // Path for route definitions
  models: root + '/models', // Path for data models
  sync_models: root + '/sync_models', // Path for synchronized models
  logs: root + '/logs', // Path for log files
  views: root + '/views', // Path for view files
  keys: root + '/kubernetes/keys', // Path for Kubernetes keys
};

// Define prefixes for different application modules/domains
const prefixes = {
  adm: 'administration', // Administration module
  config: 'configurations', // Configuration module
  data: 'data', // Data module
  doc: 'documents', // Documents module
  fin: 'financial', // Financial module
  geo: 'geographic', // Geographic module
  hr: 'human resources', // Human Resources module
  inv: 'inventories', // Inventory module
  logs: 'logs', // Logs module
  prj: 'projects', // Projects module
  rd: 'research and development', // R&D module
  sup: 'support', // Support module
  tmpl: 'templates', // Templates module
  usr: 'users', // Users module
};

// Define HTTP methods with their corresponding numeric values
const methods = {
  post: 1, // POST method
  get: 2, // GET method
  put: 3, // PUT method
  patch: 4, // PATCH method
  delete: 5, // DELETE method
  options: 6, // OPTIONS method
};

// Export all the constants to be used in other parts of the application
module.exports = { root, paths, modes, prefixes, methods };
