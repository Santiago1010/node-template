# Security Configuration

This directory contains modules dedicated to configuring the application's security layers. These configurations help protect against common web vulnerabilities, control resource sharing, prevent abuse, and manage secure cookies. The modules are designed to be environment-aware, providing flexibility for development while enforcing strict security in production.

## Overview

Each file in this directory configures a specific aspect of application security, which are then applied as middleware in the main Express application setup.

## Key Files

### `helmet.config.js`

**Purpose:** Sets various HTTP headers to secure the application from common vulnerabilities.

-   **Technology:** Uses the **Helmet** library.
-   **Key Features:**
    -   **Content Security Policy (CSP):** Implements a strict security policy to mitigate Cross-Site Scripting (XSS) and other injection attacks. In production, it uses a `nonce`-based strategy, which is a modern standard that allows whitelisting specific inline scripts.
    -   **HTTP Strict Transport Security (HSTS):** Enforces the use of HTTPS across the site, preventing man-in-the-middle attacks.
    -   **Other Headers:** Sets other important headers like `X-Frame-Options` (to prevent clickjacking), `X-Content-Type-Options` (to prevent MIME-sniffing), and more.
    -   **Environment-Aware:** The policies are stricter in production. For example, HSTS has a long duration in production but a very short one in development.

### `cors.config.js`

**Purpose:** Manages Cross-Origin Resource Sharing (CORS), defining which external origins are permitted to access the API's resources.

-   **Key Features:**
    -   **Dynamic Origin Validation:** The configuration has different rules based on the environment.
        -   In **production**, it uses a strict whitelist of domains loaded from environment variables (e.g., `PRIMARY_DOMAIN`).
        -   In **development**, it automatically allows common local origins like `localhost` and `127.0.0.1` on any port to facilitate frontend development.
    -   **Credential Support:** It is configured to allow requests with credentials (like cookies and authorization headers).
    -   **Tiered Configurations:** It exports multiple configurations (`getStrictCorsConfiguration`, `getPermissiveCorsConfiguration`) for endpoints that may require different levels of security.

### `rateLimit.config.js`

**Purpose:** Protects the API from brute-force attacks and denial-of-service (DoS) by limiting the number of requests a client can make in a specific time window.

-   **Technology:** Uses the **express-rate-limit** library.
-   **Key Features:**
    -   **Tiered Protection:** Defines several pre-configured limiters for different use cases:
        -   `generalLimiter`: For most API endpoints.
        -   `authLimiter`: A stricter limit for sensitive routes like login and registration.
        -   `criticalLimiter`: For high-stakes operations like account deletion.
        -   `uploadLimiter`: To prevent abuse of file upload endpoints.
    -   **Smart Client Identification:** Uses a key generator that combines IP address, User-Agent, and language headers to more uniquely identify clients.
    -   **Development Mode:** Rate limiting is automatically disabled in the development environment to avoid interrupting testing and debugging.

### `cookies.config.js`

**Purpose:** Provides a robust and secure system for managing HTTP cookies.

-   **Key Features:**
    -   **Device-Aware Policies:** This is a sophisticated module that can generate different cookie policies based on the detected client device type (e.g., Web Browser, Mobile App, IoT Device). This allows for fine-tuned security, as a web browser has different security needs than a native mobile app.
    -   **Secure by Default:** It sets secure cookie attributes like `HttpOnly`, `Secure`, and `SameSite` by default, which are critical for preventing XSS and Cross-Site Request Forgery (CSRF) attacks.
    -   **Middleware:** It exports `deviceAwareCookieMiddleware`, which can be used in Express to automatically detect the device and provide helper methods on the response object (`res.setDeviceAwareCookie`) for easily setting compliant cookies.

## How to Use

These security modules are typically imported and applied as middleware in the main application file (`app.js` or `index.js`).

**Example:**

```javascript
// In your main application file
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const getHelmetConfiguration = require('@config/security/helmet.config');
const { getCorsConfiguration } = require('@config/security/cors.config');
const { generalLimiter, authLimiter } = require('@config/security/rateLimit.config');

const app = express();

// Apply global security middleware
app.use(helmet(getHelmetConfiguration()));
app.use(cors(getCorsConfiguration()));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);

// ... rest of your application setup
```
