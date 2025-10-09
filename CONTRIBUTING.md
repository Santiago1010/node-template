# Contributing to node-template

First off, thank you for considering contributing to `node-template`! It's people like you that make open source such a great community. Your help is appreciated, and every contribution is welcome.

This document provides guidelines for contributing to the project.

## How to Contribute

There are many ways to contribute, from writing tutorials or blog posts, improving the documentation, submitting bug reports and feature requests or writing code which can be incorporated into the main project.

### Reporting Bugs

If you find a bug, please make sure to report it by opening an issue on our [GitHub issue tracker](https://github.com/Santiago1010/node-template/issues). Please provide a detailed description of the bug, including steps to reproduce it, the expected behavior, and the actual behavior.

### Suggesting Enhancements

If you have an idea for a new feature or an enhancement to an existing one, please open an issue to discuss it. This allows us to coordinate our efforts and avoid duplicating work.

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through `good first issue` and `help wanted` issues:

- **Good first issues** - issues which should only require a few lines of code, and a test or two.
- **Help wanted** - issues which should be a bit more involved than `good first issue` issues.

## Development Setup

Before you can contribute code, you'll need to set up your development environment. Please refer to the [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) file for detailed instructions on how to get the project up and running.

A quick summary of the steps:

1.  Fork the repository.
2.  Clone your fork locally: `git clone https://github.com/your-username/node-template.git`
3.  Install dependencies: `npm install`
4.  Set up your `.env` file: `cp .env.example .env`
5.  Run the application using Docker or locally.

## Pull Request Process

1.  **Create a branch:** Create a new branch from `main` for your feature or bug fix.
    ```bash
    git checkout -b feat/my-awesome-feature
    ```

2.  **Make your changes:** Make your changes to the codebase.

3.  **Run code quality checks:** Before committing, ensure your code adheres to the project's standards.
    ```bash
    npm run format:write # Format the code
    npm run lint:fix     # Lint and fix any issues
    ```

4.  **Run tests:** Make sure all tests pass.
    ```bash
    npm test
    ```

5.  **Commit your changes:** Commit your changes using a descriptive commit message that follows our [Commit Message Guidelines](#commit-message-guidelines).

6.  **Push to your fork:**
    ```bash
    git push origin feat/my-awesome-feature
    ```

7.  **Submit a Pull Request:** Open a pull request from your fork to the `main` branch of the original repository. Provide a clear description of the changes and link to any relevant issues.

## Coding Standards

- **Formatting and Linting:** We use **Biome** to maintain a consistent code style. The configuration can be found in the `biome.json` file. Pre-commit hooks are in place to automatically format and lint your code.
- **JavaScript:** All code should be written in modern JavaScript (ES6+).

## Testing

We use **Jest** for unit and integration testing. All new features should be accompanied by tests, and bug fixes should include a test that reproduces the bug.

- To run the entire test suite, use `npm test`.
- Test files are located in the `tests/` directory.

## Commit Message Guidelines

This project follows the **Conventional Commits** specification. This helps us automate changelog generation and versioning.

Each commit message consists of a **header**, a **body**, and a **footer**.

The header has a special format that includes a **type**, a **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **docs**: Documentation only changes
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **test**: Adding missing tests or correcting existing tests
- **chore**: Other changes that don't modify `src` or `test` files
- **revert**: Reverts a previous commit

### Example

```
feat(auth): add password reset functionality

- Implements the password reset endpoint and service.
- Sends a password reset email to the user.

Fixes #123
```
