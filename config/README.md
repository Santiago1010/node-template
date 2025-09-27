# Configuration

This directory contains all the application configuration, organized into modules to manage different aspects such as the database, cache, security, and development tools.

## Module Summary

Below is a summary of each configuration module:

### [Cache](./cache/README.md)

Manages the connection to **Redis** for in-memory caching. The configuration uses a singleton pattern to ensure a single instance of the client, handles automatic reconnection in case of failures, and provides a promise-based API for easy integration.

### [Context](./context/README.md)

Configures and manages an asynchronous context for the entire application using Node.js's `AsyncLocalStorage`. This allows maintaining a request-scoped state, such as a correlation ID or user information, accessible throughout asynchronous calls without the need to pass `req` through all functions.

### [Database](./database/README.md)

Contains the configuration for **Sequelize**, the project's ORM. It is divided into two main files: one for the application's runtime connection and another for the static configuration used by the **Sequelize CLI** for migrations and seeders. The connection is tested when the application starts, and models are automatically synchronized in the development environment.

### [Environment](./env/README.md)

Manages the application's environment variables. It uses **Zod** to define a validation schema that ensures all required variables are present and have the correct type. If validation fails, the application stops to prevent unexpected behavior due to incorrect configuration.

### [Internationalization (i18n)](./i18n/README.md)

Configures support for multiple languages using the `i18n-node` library. Translations are stored in JSON files, and the system can automatically detect the user's language through query parameters, cookies, or HTTP headers.

### [Security](./security/README.md)

Implements multiple security layers to protect the application:
-   **Helmet**: To set secure HTTP headers and prevent common vulnerabilities.
-   **CORS**: To manage Cross-Origin Resource Sharing and control which external domains can access the API.
-   **Rate Limiting**: To protect the API against brute-force and denial-of-service attacks.
-   **Cookies**: To manage secure cookies, with policies that adapt to the client's device type.

### [Tools](./tools/README.md)

Configures development and monitoring tools:
-   **Winston**: For a robust and flexible logging system, with different formats and transports for development and production.
-   **Morgan**: As a middleware to log all incoming HTTP requests, which is invaluable for debugging and monitoring.
