# Internationalization (i18n) Configuration

This directory is responsible for managing the internationalization (i18n) of the application, allowing it to support multiple languages easily.

## File Structure

```
i18n/
├── locales/
│   ├── en.json
│   └── es.json
└── index.js
```

---

### `index.js`

This is the main configuration file for the `i18n` setup. It initializes and configures the [i18n-node](https://www.npmjs.com/package/i18n) library, which handles the translation logic.

**Key Configurations:**

-   **Locales**: The application currently supports two languages: English (`en`) and Spanish (`es`).
-   **Default Locale**: The default language is set from the environment configuration (`config.lang`) and falls back to `en` if not specified.
-   **Language Detection**: The user's preferred language is automatically detected in the following order:
    1.  A query parameter in the URL (e.g., `?lang=es`).
    2.  A cookie named `lang`.
    3.  The `Accept-Language` HTTP header sent by the browser.
-   **Translation Storage**: Translation files are located in the `locales/` directory.
-   **Auto-Reload**: In development mode, any changes to the JSON translation files will automatically be reloaded without needing to restart the server.

The configured `i18n` instance is exported from this file, making it available for use throughout the application.

---

### `locales/` Directory

This directory contains the JSON files for each supported language. Each file is named with the corresponding language code (e.g., `en.json`).

#### Translation Files (`en.json`, `es.json`)

These files store the key-value pairs for all translatable strings in the application. The keys are organized in a nested JSON structure for better organization (e.g., `validations.required`).

**Example from `en.json`:**

```json
{
  "validations": {
    "required": "The {field} field is required"
  }
}
```

-   **Keys**: A string identifier used in the code (e.g., `validations.required`).
-   **Values**: The translated text that will be displayed to the user.
-   **Dynamic Values**: The translations can include placeholders like `{field}`. These are replaced dynamically in the code with actual values, allowing for more flexible messages.

## How to Use

To get a translated string in any part of the application, you can use the `__` method (double underscore) from the exported `i18n` instance.

**Example:**

```javascript
const i18n = require('@config/i18n');

// Simple translation
const message = i18n.__('fields.test'); // -> "Test variable" (if locale is 'en')

// Translation with dynamic values
const errorMessage = i18n.__('validations.required', { field: 'Username' }); // -> "The Username field is required"
```

## How to Add or Update Translations

### Add a New String

1.  Open both `locales/en.json` and `locales/es.json`.
2.  Add the same new key to both files.
3.  Provide the corresponding translation for each language.

### Add a New Language

1.  Create a new JSON file in the `locales/` directory (e.g., `fr.json` for French).
2.  Copy the structure from `en.json` and translate all the values.
3.  Open `index.js` and add the new language code to the `locales` array:
    ```javascript
    const i18n = new I18n({
      locales: ['es', 'en', 'fr'], // Add 'fr' here
      // ... other configurations
    });
    ```
