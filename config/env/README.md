# Environment Configuration

This directory manages the application's environment variables, ensuring that the configuration is valid, type-safe, and easily accessible throughout the project.

## Overview

The system is designed to load environment variables from a `.env` file (for local development) and the host environment. It then validates these variables against a predefined schema to catch errors early and prevent the application from running with an improper setup.

## Key Files

### `schema.js`

**Purpose:** This file acts as the single source of truth for the application's environment variable requirements.

-   **Schema Definition:** It uses the **Zod** library to define a schema (`environmentSchema`) that specifies the expected data type for each variable (e.g., `string`, `number`).
-   **Validation Rules:** It enforces validation rules, such as required variables, default values for optional ones, and specific formats (like URLs).
-   **Type Safety:** By coercing string-based environment variables into their proper types (e.g., converting `"8080"` to `8080`), it provides type safety at runtime.

### `index.js`

**Purpose:** This is the main entry point for loading, validating, and exporting the application's configuration.

Its responsibilities are executed in the following order:

1.  **Load Variables:** It reads the `.env` file from the project root and loads its key-value pairs into the Node.js `process.env` object. This is done with a native parser, avoiding external dependencies.
2.  **Validate Schema:** It imports the `environmentSchema` from `schema.js` and uses it to validate the variables in `process.env`.
3.  **Handle Errors:** If validation fails (e.g., a required variable is missing or has the wrong type), it logs detailed, color-coded error messages to the console and immediately terminates the application. This **fail-fast** approach ensures the application never runs in an unstable or misconfigured state.
4.  **Export Configuration:** If validation is successful, it constructs and exports a single, structured `config` object. This object categorizes variables (e.g., `database`, `security`, `jwt`), making them clean and easy to access from other parts of the application.

## How to Use

### Initial Setup

1.  In the root of the project, find the `.env.example` file.
2.  Create a copy of it and rename the copy to `.env`.
3.  Fill in the necessary values in the `.env` file, such as database credentials and API keys. **Never commit the `.env` file to version control.**

### Adding a New Environment Variable

1.  **Add the variable** to your `.env` file.
    ```
    NEW_VARIABLE=some_value
    ```
2.  **Update the schema** in `config/env/schema.js`. If the variable is critical for the application, add it to the `environmentSchema` object with the appropriate Zod validator.
    ```javascript
    const environmentSchema = z.object({
      // ... existing variables
      NEW_VARIABLE: z.string().optional().default('some_default'),
    });
    ```
3.  **Access the variable** through the exported `config` object. You may need to add it to the structure in `config/env/index.js`.
    ```javascript
    // in config/env/index.js
    const config = {
      // ... other categories
      newCategory: {
        myVar: env.NEW_VARIABLE,
      }
    };

    // in another file
    const config = require('@config/env');
    console.log(config.newCategory.myVar);
    ```
