# Application Context Configuration

This directory is responsible for managing application-wide, asynchronous context.

## File Structure

```
context/
└── index.js
```

---

### `index.js`

This file initializes and exports a singleton instance of Node.js's built-in `AsyncLocalStorage`.

**Purpose and Functionality:**

`AsyncLocalStorage` is a powerful feature that allows for the creation of an asynchronous state that is persistent across `async/await` calls and promise chains within a specific context. In a web application, this is most commonly used to maintain a **request-scoped context**.

**Why is this useful?**

In a typical Express application, when a request comes in, you might have data that is relevant to that request only (e.g., a transaction ID, a user's session information, a request correlation ID for logging). Without `AsyncLocalStorage`, passing this data down through multiple layers of your application (from middleware to services to database models) can be cumbersome and lead to cluttered function signatures. This is often called "prop drilling."

`AsyncLocalStorage` solves this problem by providing a "store" that is unique to each asynchronous execution context. You can set a value in the store at the beginning of a request, and it will be accessible from any other part of the code that runs as part of that same request's execution, without having to pass it around manually.

## How to Use

The `asyncLocalStorage` instance is typically used in a middleware to establish a new context for each incoming request.

**Example Middleware (`context.middleware.js`):**

```javascript
const asyncLocalStorage = require('@config/context');

function contextMiddleware(req, res, next) {
  // Create a new store for this request
  const store = new Map();

  // Run the rest of the request chain within this new async context
  asyncLocalStorage.run(store, () => {
    // Set initial values for this request's context
    // For example, a unique correlation ID for logging
    asyncLocalStorage.getStore().set('correlationId', req.correlationId);
    next();
  });
}
```

**Accessing Context Elsewhere:**

Now, any function called after this middleware (e.g., in a service or helper) can access the context without needing `req` to be passed to it.

```javascript
const asyncLocalStorage = require('@config/context');
const { logger } = require('@config/tools/logger.config.js');

function doSomethingImportant() {
  // Retrieve the store for the current async context
  const store = asyncLocalStorage.getStore();

  // Get the correlation ID that was set in the middleware
  const correlationId = store.get('correlationId');

  logger.info('Doing something important...', { correlationId });
}
```

This approach helps to decouple your business logic from the HTTP layer and keeps your code cleaner and more maintainable.
