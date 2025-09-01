# Parameter Schemas (`/schemas/params`)

This directory is dedicated to defining standardized parameter schemas for Swagger/OpenAPI specifications. Its primary goal is to ensure consistency and reusability in documenting and validating query parameters across different API endpoints.

## Structure and Files

The files in this directory define reusable parameters for common functionalities such as pagination, filtering, and searching.

### `common.params.js`

This file provides a set of common and grouped parameters used across multiple endpoints.

- **`idsFilter`**: Allows filtering records by a comma-separated list of IDs.
- **`fieldsFilter`**: Specifies which fields of a resource should be returned in the response.
- **`detailsParams`**: A set of parameters for endpoints retrieving a single resource, including the path identifier and the option to include history.
- **`activeParams`**: Filters records based on their status (active or inactive).
- **`commonListParams`**: Groups pagination parameters along with `ids` and `fields` filters for listing endpoints.

### `pagination.params.js`

Defines standard parameters for paginating results in listing endpoints.

- **`limit`**: Sets the maximum number of records to return per page.
- **`page`**: Specifies the page number to retrieve.

Additionally, this file imports and expands search parameters from `search.params.js`.

### `search.params.js`

Contains the definition of the free-text search parameter.

- **`search`**: Allows users to perform a text search across a resource’s fields. The search implementation leverages the `search` function from the `@helpers/database/utilities.helper.js` helper.

## Usage

These parameters are designed to be imported and used in the `parameters` section of the Swagger/OpenAPI documentation for each endpoint, promoting code reuse and API standardization.

```javascript
// Example usage in endpoint documentation
const { commonListParams } = require('@schemas/params/common.params');

// ...
  parameters: [...commonListParams],
// ...
```
