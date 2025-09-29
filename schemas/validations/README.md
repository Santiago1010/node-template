# Validation Schemas

This directory contains validation schemas for query parameters, primarily for use in Express routes. These schemas are built using `express-validator`.

## Available Schemas

### `index.js`

This file serves as the central export point for all validation schemas in this directory, making them easily accessible from other parts of the application.

### `filters.schema.js`

This module provides dynamic validation schemas for filtering data.

-   `filtersSchemas(model)`: A function that returns validation schemas for:
    -   `ids`: Validates a list of entity IDs.
    -   `fields`: Validates a list of model attributes to be returned.

### `pagination.schema.js`

This module provides a validation schema for pagination query parameters.

-   `paginationSchema`: An object containing validation rules for:
    -   `limit`: The number of items per page (optional, min: 1, max: 100).
    -   `page`: The page number (optional, min: 1).

### `search.schema.js`

This module provides a validation schema for search functionality.

-   `searchSchema`: An object containing validation rules for:
    -   `search`: The search term (optional, min length: 1).

## Usage Example

You can import and use these schemas in your route definitions to validate incoming requests.

```javascript
const { Router } = require('express');
const { checkSchema } = require('express-validator');
const { paginationSchema, searchSchema } = require('../schemas/validations');

const router = Router();

router.get(
    '/',
    checkSchema({ ...paginationSchema, ...searchSchema }),
    (req, res) => {
        // Your logic here
    }
);

module.exports = router;
```
