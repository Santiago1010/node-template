# Developer Setup Guide

Welcome to the `node-template` project! This guide will walk you through setting up your local development environment. This project is a Node.js, Express, and Sequelize API REST template designed to be run with Docker.

## 1. Prerequisites

Before you begin, ensure you have the following tools installed on your system:

- **Node.js**: We recommend using the latest LTS version.
- **Docker & Docker Compose**: For running the application and its services (database, cache) in containers.
- **Git**: For version control.
- **A MySQL/MariaDB client** (Optional): For interacting with the database directly (e.g., DBeaver, TablePlus, MySQL Workbench).

## 2. Initial Setup

First, clone the project repository to your local machine:

```bash
git clone https://github.com/Santiago1010/node-template.git
cd node-template
```

## 3. Environment Configuration

The application uses environment variables for configuration. These are managed in a `.env` file.

1.  **Create the `.env` file:**
    Copy the example file to create your own local configuration:
    ```bash
    cp .env.example .env
    ```

2.  **Review the variables:**
    Open the `.env` file in your editor. The default values are configured for the Docker setup. For a local setup, you will need to adjust the `DB_*` and `REDIS_*` variables to match your local services.

## 4. Running the Application

We recommend using Docker for the most straightforward setup, but a manual local setup is also possible.

### Docker Setup (Recommended)

This method uses Docker Compose to build and run the application, database, and cache services.

1.  **Enable the Database Service:**
    In the `docker-compose.yml` file, the `mysql` service is commented out by default. Uncomment the entire `mysql` service block to enable it.

2.  **Build and Start the Containers:**
    Run the following command from the project root:
    ```bash
    docker-compose up --build
    ```
    This command will:
    - Build the Node.js application image as defined in the `Dockerfile`.
    - Start the application container.
    - Start the `redis` container.
    - Start the `mysql` container (if you uncommented it).

The API will be available at `http://localhost:8080` (or the `PORT` you specified in `.env`).

### Local (Manual) Setup

This method requires you to run the database and cache services on your host machine.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Services:**
    - Ensure you have a **MySQL/MariaDB** and a **Redis** server running locally.
    - Create a database for the application.

3.  **Configure `.env`:**
    Update the `.env` file with the connection details for your local database and Redis instances. Pay special attention to:
    - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
    - `REDIS_HOST_LOCAL`, `REDIS_URL_LOCAL`

4.  **Run Database Migrations:**
    The project uses Sequelize for database migrations. To set up the database schema, run:
    ```bash
    npx sequelize-cli db:migrate
    ```

5.  **Start the Application:**
    Run the app in development mode with file watching:
    ```bash
    npm run dev
    ```
    The API will be available at `http://localhost:8080`.

## 5. Code Quality

The project uses **Biome** for linting and formatting.

- **To format all files:**
  ```bash
  npm run format:write
  ```
- **To lint and automatically fix issues:**
  ```bash
  npm run lint:fix
  ```

Husky pre-commit hooks are set up to automatically run these checks before you commit changes.

## 6. Testing

The project uses **Jest** for testing.

- **Run all tests:**
  ```bash
  npm test
  ```
- **Run tests in watch mode:**
  ```bash
  npm run test:watch
  ```
- **Generate a coverage report:**
  ```bash
  npm run test:coverage
  ```

## 7. Database Management

- **Migrations**: The Sequelize CLI is used for database migrations. You can find the configuration in `.sequelizerc`.
  - Create a new migration: `npx sequelize-cli migration:generate --name <migration-name>`
  - Run migrations: `npx sequelize-cli db:migrate`
  - Rollback a migration: `npx sequelize-cli db:migrate:undo`

- **Model Generation**: The project includes a custom script to generate Sequelize models from your database schema.
  ```bash
  npm run models:generate
  ```

## 8. Git Contribution

This project follows the **Conventional Commits** specification. A `commitlint` configuration is in place to enforce this. When you commit, a pre-commit hook will run, and your commit message will be validated.
