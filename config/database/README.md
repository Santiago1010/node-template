# Database Configuration

This directory is responsible for configuring, initializing, and managing the application's database connection using Sequelize, the project's Object-Relational Mapper (ORM).

## Overview

The setup is split into two key files: one for the application's runtime connection (`connection.js`) and another for the Sequelize Command-Line Interface (CLI) tools (`sequelize.config.js`). This separation allows the application to have a robust, dynamic connection while providing a static configuration for development and deployment tasks like running migrations.

## Key Files

### `sequelize.config.js`

**Purpose:** This file provides the database configuration required by the **Sequelize CLI**.

-   **CLI Tooling:** It is used when you run commands from the terminal, such as `npx sequelize-cli db:migrate` or `npx sequelize-cli db:seed:all`.
-   **Static Configuration:** It exports a configuration object with keys for different environments (`development`, `test`, `production`). The CLI uses the configuration corresponding to the `NODE_ENV` you specify.
-   **Source of Truth:** The actual connection details (username, password, host, etc.) are imported from the main environment configuration (`@config/env`), ensuring that the CLI uses the same credentials as the application.

### `connection.js`

**Purpose:** This is the core file for the application's runtime database connection. It creates and manages the main `sequelize` instance that the rest of the application uses to interact with the database.

Its responsibilities are executed in the following order:

1.  **Create Sequelize Instance:** It initializes a new `Sequelize` instance with the connection details loaded from the environment configuration. This includes setting up the connection pool, dialect-specific options (e.g., for MySQL), and global model definitions (e.g., character set).
2.  **Register Models:** It calls the `setupModels(sequelize)` function, which is a critical step that discovers and associates all the application's data models (e.g., `User`, `Product`) with this Sequelize instance.
3.  **Establish and Test Connection:** It defines and immediately calls an `initializeConnection` function that attempts to authenticate with the database using `sequelize.authenticate()`. This serves as a startup health check to ensure the database is reachable and the credentials are correct. If the connection fails, the application will log a fatal error and fail to start.
4.  **Synchronize in Development:** For convenience during development, it automatically synchronizes the defined models with the database schema using `sequelize.sync()`. This feature is disabled in production to prevent accidental data loss; in production, schema changes must be handled through migrations.
5.  **Export Instance:** It exports the fully configured and connected `sequelize` instance. This object is then imported by services and other parts of the application to perform CRUD (Create, Read, Update, Delete) operations.

## How to Use

-   **For Application Logic:** When you need to query the database within a service or controller, you should import the `sequelize` instance from `connection.js` or the specific models from `@models`.

    ```javascript
    const { User } = require('@models');

    async function findUser(id) {
      const user = await User.findByPk(id);
      return user;
    }
    ```

-   **For Database Migrations:** To create or run migrations, use the Sequelize CLI from your terminal. The CLI will automatically use `sequelize.config.js`.

    ```bash
    # Create a new migration file
    npx sequelize-cli migration:generate --name create-new-table

    # Run all pending migrations
    npx sequelize-cli db:migrate
    ```
