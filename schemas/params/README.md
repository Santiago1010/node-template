# API Request Parameters

This document explains the reusable parameters used for building API requests. These parameters help standardize how you can filter, paginate (view data in pages), and select the data you want to receive from the API.

---

## `common.params.js`

This file defines a set of common parameters that can be reused across different API endpoints. This ensures consistency and saves time.

### `idsFilter`
-   **Purpose:** Filters a list of items to get only the ones matching specific IDs.
-   **How to use:** Provide a comma-separated list of IDs.
-   **Example:** `GET /api/users?ids=1,5,10` - This will return users with IDs 1, 5, and 10.

### `fieldsFilter`
-   **Purpose:** Specifies which fields (or properties) of an object you want to receive in the response. This is useful for reducing the amount of data transferred.
-   **How to use:** Provide a comma-separated list of field names.
-   **Example:** `GET /api/users/1?fields=name,email` - This will return only the `name` and `email` of the user with ID 1.

### `identifierParam`
-   **Purpose:** A required parameter used in the URL path to uniquely identify a single resource.
-   **How to use:** It's part of the URL itself.
-   **Example:** `GET /api/users/123` - Here, `123` is the identifier.

### `detailsParams`
-   **Purpose:** A group of parameters for fetching a single item. It combines `identifierParam`, `fieldsFilter`, and an option to include historical data.
-   **`includeHistory`**: If set to `true`, the response will include a history of changes for the requested item.
-   **Example:** `GET /api/products/42?fields=name,price&includeHistory=true`

### `activeParams`
-   **Purpose:** Filters items based on their active or inactive status.
-   **How to use:** Set the `active` parameter to `true` or `false`.
-   **Example:** `GET /api/users?active=true` - This will return only active users.

### `activeBody`
-   **Purpose:** Used when creating or updating an item to set its active status.
-   **How to use:** Include the `active` field in the JSON body of your `POST` or `PUT` request.
-   **Example:** `POST /api/users` with body `{"name": "New User", "active": true}`

### `commonListParams`
-   **Purpose:** A convenient bundle of parameters for endpoints that return a list of items. It includes pagination (`limit`, `page`), `idsFilter`, and `fieldsFilter`.

---

## `dynamic.params.js`

This file contains a special function to help generate standardized documentation for API parameters. It's mostly for internal use to keep the API documentation consistent.

### `setReference(required, description, tag, operationId)`
-   **Purpose:** Creates a formatted reference string for API documentation, including whether a parameter is required and a link to more details.
-   **Example (internal use):** `setReference(true, "User ID", "Users", "getUserById")`

---

## `pagination.params.js`

This file defines parameters used for pagination, which is the process of splitting a large set of results into smaller, manageable pages.

### `limit`
-   **Purpose:** Specifies the maximum number of items to return in a single page.
-   **How to use:** A number, typically between 1 and 100.
-   **Example:** `GET /api/articles?limit=10` - This will return up to 10 articles.

### `page`
-   **Purpose:** Specifies which page of results you want to retrieve.
-   **How to use:** A number, starting from 1. Must be used with `limit`.
-   **Example:** `GET /api/articles?limit=10&page=2` - This will return the second page of articles (items 11-20).

---

## `search.params.js`

This file defines a parameter for performing a text-based search across all fields of the items.

### `search`
-   **Purpose:** Filters the list of items to only those that contain the provided search term in any of their fields. The search is case-insensitive.
-   **How to use:** Provide any string of text.
-   **Example:** `GET /api/products?search=laptop` - This will return all products that have the word "laptop" in their name, description, or any other text field.
