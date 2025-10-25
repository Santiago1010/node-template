# Tooling Configuration

This directory contains the configuration for various development and logging tools used throughout the application. These tools help improve debugging, monitoring, and overall code quality.

## File Structure

```
tools/
├── logger.config.js
└── morgan.config.js
```

---

### `logger.config.js`

This file configures **Winston**, a powerful and flexible logging library for Node.js. It provides a robust logging system that is environment-aware and highly customizable.

**Key Features:**

-   **Multiple Transports**: Logs are sent to different destinations (transports) based on their severity and the application environment.
    -   **Console**: For development, logs are printed to the console with color-coding for readability.
    -   **Rotating Files**: For production, logs are written to files that are automatically rotated daily (`combined-%DATE%.log`, `error-%DATE%.log`, `audit-%DATE%.log`). This prevents log files from growing too large.
-   **Environment-Aware Formatting**:
    -   In **development**, logs are formatted for human readability with timestamps, colors, and stack traces.
    -   In **production**, logs are structured as `JSON` for easy parsing by log management systems (like Splunk, Datadog, or the ELK stack).
-   **Sensitive Data Redaction**: Automatically redacts sensitive information (e.g., passwords, API keys) from logs to enhance security.
-   **Custom Log Levels**: Defines specific log levels (`error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`) and custom levels like `alert` and `notice` for different types of events.
-   **Specialized Loggers**: Provides dedicated functions for specific logging purposes:
    -   `securityLog`: For critical security events.
    -   `performanceLog`: For tracking the performance of operations.
    -   `transactionLog`: For logging business-critical transactions.
-   **Request Correlation**: Includes a middleware that assigns a unique `correlationId` to each incoming HTTP request, allowing all related logs to be traced back to a single request.

---

### `morgan.config.js`

This file configures **Morgan**, an HTTP request logger middleware for Express. Its primary purpose is to log the details of every incoming HTTP request, which is invaluable for debugging and monitoring server activity.

**Key Features:**

-   **Dual-Mode Logging**:
    -   In **development**, it provides a colorful, concise log format directly in the console. The colors help quickly identify the HTTP method, status code, and response time.
    -   In **production**, it writes logs to a file (`access.log`) in a structured, plain-text format suitable for analysis.
-   **Custom Tokens**: The configuration defines custom "tokens" to enhance the log output:
    -   `statusColor`: Color-codes the HTTP status code (e.g., `2xx` is green, `4xx` is yellow, `5xx` is red).
    -   `coloredMethod`: Assigns a unique color to each HTTP method (GET, POST, etc.).
    -   `coloredResponseTime`: Color-codes the response time to provide a quick visual indicator of performance (e.g., fast responses are green, slow ones are red).
-   **High-Precision Timestamps**: Uses `day.js` for consistent date and time formatting and `process.hrtime` for high-precision response time measurement.
-   **Asynchronous Logging**: Writes to log files using a non-blocking stream, ensuring that logging does not negatively impact application performance.

## How They Work Together

-   **Morgan** is specialized for HTTP requests. It provides the first layer of logging by capturing the entry and exit points of every API call.
-   **Winston** is a general-purpose logger used throughout the application logic. The `requestLoggingMiddleware` in `logger.config.js` uses Winston to create detailed logs for each request, enriched with a `correlationId` that allows for comprehensive tracing of the request's entire lifecycle.

Together, these tools provide a complete and professional logging solution that is essential for maintaining a healthy and observable application.
