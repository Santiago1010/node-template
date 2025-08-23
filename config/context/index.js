const { AsyncLocalStorage } = require('async_hooks');

// Create a singleton instance of AsyncLocalStorage
const asyncLocalStorage = new AsyncLocalStorage();

module.exports = asyncLocalStorage;
