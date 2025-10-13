

## [1.14.3] - 2025-10-13

**Released:** 2025-10-13 22:43:42 UTC

### [Update Redis secret path and gitignore](https://github.com/Santiago1010/node-template/pull/66)

#### 📋 Summary
Update Redis configuration to use new secret path and add backup script to gitignore

#### 🔍 What Changed
### Changed
- Redis secret path from 'redis' to 'cache/redis' in configuration
- Updated .gitignore to exclude scripts/backups-secrets.script.js

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: security
- Commits: 1

**Commits:**
- [`55113c0`](https://github.com/Santiago1010/node-template/commit/55113c032b8f57b8abb3ff1f62780c43ece39beb) chore(config): update redis secret path and gitignore

---



## [1.14.2] - 2025-10-13

**Released:** 2025-10-13 19:47:39 UTC

### [Secure Secrets Management with HashiCorp Vault Integration](https://github.com/Santiago1010/node-template/pull/65)

#### 📋 Summary
This PR implements a comprehensive secure secrets management system using HashiCorp Vault, migrating all sensitive credentials from environment variables to Vault while maintaining backward compatibility and improving security posture.

#### 🔍 What Changed
### Added
- Vault helper with secure secrets retrieval, management, and health checks
- Project name configuration for Vault namespacing
- New security configurations (BOLA, CSRF, anomaly detection)
- Localized error messages for rate limiting and internal errors
- Documentation linting script

### Changed
- Environment configuration simplified with sensitive data moved to Vault
- Database connection now uses async initialization with Vault credentials
- Redis configuration integrates Vault for password management
- All services converted to instance-based pattern with async initialization
- JWT secrets now retrieved from Vault instead of environment variables
- Session service updated to use Vault for token secrets

### Fixed
- Variable naming conflicts in session controller
- Test configurations to support async database connections
- Model reference issues in service methods

### Removed
- All sensitive credentials from environment configuration
- Redundant environment variables and comments
- Unused service configurations (AI, analytics, messaging, OAuth providers)
- Vault test script (replaced with integrated approach)

#### 📝 Additional Notes
- Vault secrets are namespaced by project and environment (project/env/path)
- Database connection uses lazy loading to handle Vault dependency
- All services now require explicit initialization before use
- Breaking changes require Vault setup for all sensitive credentials
- Fallback mechanisms maintained for development environments

**Type of Change:** Refactoring

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: developer experience, refactor, security
- Commits: 10

**Commits:**
- [`4d20a30`](https://github.com/Santiago1010/node-template/commit/4d20a3002b2448695d7d6caccef64b3f3e81d868) feat(vault): implement secure secrets management with HashiCorp Vault integration
- [`102e0a0`](https://github.com/Santiago1010/node-template/commit/102e0a055d26cefbf29adf7ea4d92fb098692163) refactor(vault): simplify vault helper and integrate with database connection
- [`f03afc7`](https://github.com/Santiago1010/node-template/commit/f03afc7bd1678e6376861f53ad516b176abd18db) refactor(auth): convert session service to instance-based with async initialization
- [`f3f51e7`](https://github.com/Santiago1010/node-template/commit/f3f51e7b9c008aea3a89bc99a80a71ddf180c4a8) refactor(services): convert all services to instance-based pattern with async initialization
- [`97b79af`](https://github.com/Santiago1010/node-template/commit/97b79af917e6db785555f4a5604e87df0500eccc) refactor(config): simplify environment configuration and update socket database access
- [`dda9a7e`](https://github.com/Santiago1010/node-template/commit/dda9a7e1b140c1ff9e32b30aec9d90e2d05f963b) chore(structure): update project structure documentation
- [`47db226`](https://github.com/Santiago1010/node-template/commit/47db2268c15c352b40af848f640150aa79475da7) feat(cache): integrate vault for redis password management
- [`fd055c0`](https://github.com/Santiago1010/node-template/commit/fd055c04706c5c19a759ae863154a83386f08d1c) feat(auth): integrate vault for jwt secret management and update tests
- [`5facbd4`](https://github.com/Santiago1010/node-template/commit/5facbd41c982fbf53279d08da128e4ca06b0a5fe) fix(auth): resolve variable naming conflict in session controller
- [`a5a2087`](https://github.com/Santiago1010/node-template/commit/a5a20871ca89f6f7a370b1b86dd5619b49176349) feat(i18n): add localized error messages for rate limiting and internal errors

---



## [1.14.1] - 2025-10-12

**Released:** 2025-10-12 20:49:25 UTC

### [Add endpoint documentation validation hook](https://github.com/Santiago1010/node-template/pull/61)

#### 📋 Summary
This PR adds automated validation to ensure Express endpoints are properly documented in the OpenAPI specification. It introduces a new linting script and integrates it into the pre-push Git hook to prevent pushes with undocumented endpoints.

#### 🔍 What Changed
### Added
- `scripts/docs-paths-lint.script.js` - New documentation linter that validates sync between Express routes and OpenAPI docs
- `lint:docs-endpoints` npm script in package.json
- Documentation validation step in pre-push Git hook

### Changed
- Enhanced `.husky/pre-push` hook with structured comments and documentation validation
- Updated package.json with new lint script

**Type of Change:** Documentation, Testing

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, testing, automation
- Milestone: A1 — Swagger sync + tests
- Commits: 1

**Commits:**
- [`c506974`](https://github.com/Santiago1010/node-template/commit/c5069740712dae605c220e3c0f5593983c5b56ca) feat(ci): add endpoint documentation validation in pre-push hook

---



## [1.14.0] - 2025-10-12

**Released:** 2025-10-12 20:02:53 UTC

### [Comprehensive Security Middleware Implementation](https://github.com/Santiago1010/node-template/pull/60)

#### 📋 Summary
This PR implements a comprehensive security middleware suite with input sanitization, CSRF protection, data exposure guards, file upload security, mass assignment protection, and BOLA (Broken Object Level Authorization) prevention.

#### 🔍 What Changed
### Added
- BOLA middleware for resource ownership verification with caching
- CSRF protection with token validation and double-submit cookie
- Data exposure guard for PII filtering and response size limiting
- File upload security with type validation and malware scanning
- Mass assignment protection with field filtering and role-based rules
- Input sanitizer with SQL/NoSQL injection and XSS prevention
- Security configuration with field-specific sanitization rules
- Security utilities for data masking and validation

### Changed
- Reorganized middleware structure into dedicated security directory
- Consolidated security patterns in constants utility
- Updated app.js to include global sanitizer middleware
- Enhanced constants utility with comprehensive security configurations

### Removed
- Unused middleware directories (app, bot, desktop, wearable)
- Test directory structure (tests will be reimplemented separately)

#### 📝 Additional Notes
All security middlewares are configured with environment-aware strictness levels. Development mode has relaxed security for testing, while production enforces strict validation. The implementation follows OWASP security best practices and includes comprehensive logging for security events.

**Type of Change:** New Feature, Documentation, Refactoring

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement, developer experience, refactor
- Milestone: DX1 — Onboarding + local dev
- Commits: 5

**Commits:**
- [`b413cd1`](https://github.com/Santiago1010/node-template/commit/b413cd1844d5b90822517862f832fc2458e39b18) feat(security): implement comprehensive security middleware suite
- [`6811ef2`](https://github.com/Santiago1010/node-template/commit/6811ef2c9295e4ace90f8fc9621920723516ae18) refactor(security): centralize security constants in utils module
- [`c3cefca`](https://github.com/Santiago1010/node-template/commit/c3cefca9cf9bf14eab612500b5f25b47640c7916) feat(security): implement comprehensive input sanitization and security utilities
- [`e9e28f8`](https://github.com/Santiago1010/node-template/commit/e9e28f8654301acffef2d4b5939ae83d5b803050) refactor(security): consolidate security pattern imports in sanitizer middleware
- [`d8c44c4`](https://github.com/Santiago1010/node-template/commit/d8c44c47b4472752364b2d5d584908577370ede0) chore(structure): reorganize security middleware and update file structure

---



## [1.13.0] - 2025-10-12

**Released:** 2025-10-12 14:25:38 UTC

### [Add Redis cache helper with session management and rate limiting](https://github.com/Santiago1010/node-template/pull/59)

#### 📋 Summary
Implements a comprehensive Redis caching layer with session storage, rate limiting, and distributed locking capabilities. Adds login rate limiting and session management to enhance security and performance.

#### 🔍 What Changed
### Added
- Comprehensive Redis cache helper with get/set, tagging, locking, and bulk operations
- Login rate limiting (5 attempts per 15 minutes per IP)
- Session storage in Redis with device fingerprinting
- Extensive unit test suite for cache operations
- Session tagging for bulk invalidation

### Changed
- Enhanced Redis connection logging with status indicators
- Session controller to include rate limiting and session storage
- Session service to return account ID for session tracking

### Fixed
- Potential race conditions in login attempts
- Session management security with device fingerprinting

#### 📝 Additional Notes
- Cache helper supports multiple invalidation strategies (pattern matching, tag-based)
- Implements distributed locking for concurrent access control
- Session data includes device info and login timestamp for security
- Comprehensive error handling and logging throughout cache operations

**Type of Change:** New Feature, Documentation, Testing

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement, testing, developer experience
- Milestone: DX1 — Onboarding + local dev
- Commits: 4

**Commits:**
- [`7e17bf4`](https://github.com/Santiago1010/node-template/commit/7e17bf432d9e4e51f3cd8e10394b5a5789a12f3f) feat(auth): implement login rate limiting and session management
- [`8f8b43d`](https://github.com/Santiago1010/node-template/commit/8f8b43d52036559853e253eee80b55d539babcaf) docs(cache): add comprehensive jsdoc documentation to cache helper
- [`f0dd433`](https://github.com/Santiago1010/node-template/commit/f0dd433534a204a47d7826080352669078490c27) test(cache): add comprehensive unit test suite for cache helper
- [`1f642d9`](https://github.com/Santiago1010/node-template/commit/1f642d9e8795c4e12123e41b39a60b3e65de8e0b) test(cache): add comprehensive error handling and edge case tests

---



## [1.12.0] - 2025-10-11

**Released:** 2025-10-11 21:29:25 UTC

### [Authentication System with Device Fingerprinting](https://github.com/Santiago1010/node-template/pull/56)

#### 📋 Summary
Implement comprehensive authentication system with device fingerprinting, JWT token management, and enhanced security features including device tracking and safe mode detection.

#### 🔍 What Changed
### Added
- Session controller with login functionality
- Device fingerprinting and tracking system
- JWT token management with access/refresh tokens
- Device management services (create, update, track)
- Access logging and session management
- New database models: configRoles, configScopes, usrDevices, usrAccountsHasScopes
- Authentication route validations
- Enhanced response helper with error handling
- API documentation for auth endpoints

### Changed
- Updated JWT configuration (removed subject fields, standardized expiration names)
- Modified usrAccounts model (removed AES encryption, added virtual profile fields)
- Enhanced usrAccesses model (added device relationship, removed payload field)
- Improved security helper (JWT issuer, algorithm options)
- Updated i18n locales with new auth messages and validations
- Refactored validation helpers to use utility modules
- Enhanced error handling in response helper

### Fixed
- JWT token creation and verification consistency
- Password hashing implementation
- Error response formatting
- Development mode cookie settings

### Removed
- Request logger middleware (commented out)
- AES encryption from user passwords
- Redundant JWT subject configurations

#### 📝 Additional Notes
- Implements secure session management with device tracking
- Adds comprehensive scope-based permission system
- Includes safe mode for suspicious device detection
- Enhanced logging and audit trail capabilities
- Follows security best practices for token management

**Type of Change:** New Feature

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: enhancement
- Milestone: M1 — Auth & device tokens
- Commits: 10

**Commits:**
- [`2341fbb`](https://github.com/Santiago1010/node-template/commit/2341fbb9faff76ee193cfaa504b617ba26fe36e4) feat(auth): implement role-based access and safe mode authentication
- [`e49759e`](https://github.com/Santiago1010/node-template/commit/e49759eb8300bade740a06e31b5c8e0e848fe392) feat(auth): implement scope-based permission system
- [`666cfb4`](https://github.com/Santiago1010/node-template/commit/666cfb4bff1fef1ac637c3de2bc178a819b7818d) feat(auth): implement account-specific scopes and role-based permissions
- [`d4cc3ef`](https://github.com/Santiago1010/node-template/commit/d4cc3ef6a9726b767b33d8166410555746a4b152) feat(auth): implement access tracking and token validation system
- [`5e30dd4`](https://github.com/Santiago1010/node-template/commit/5e30dd49a7efc4d0c3acd5a73b359335710ecc7b) feat(auth): implement http-only cookies and unified error messaging
- [`08342b3`](https://github.com/Santiago1010/node-template/commit/08342b32391dedc678366cd0478f63079d04034a) feat(auth): implement login validation and fingerprint support
- [`038d59b`](https://github.com/Santiago1010/node-template/commit/038d59b176622ebcc3f8c3f7431982af502a4bc1) feat(auth): implement access expiration and cleanup
- [`bd5f6bc`](https://github.com/Santiago1010/node-template/commit/bd5f6bca53117cc9f1e094944df52272b20f4daf) refactor(auth): optimize access record management
- [`7575a10`](https://github.com/Santiago1010/node-template/commit/7575a103c1fa9f3b2d188b1c609ecc9aa83405ef) feat(auth): include safe mode status in login response
- [`9a288d7`](https://github.com/Santiago1010/node-template/commit/9a288d770577ad9095bf04eb68dfd3ea5045e88d) feat(auth): implement role-based access control system

---



## [1.11.0] - 2025-10-09

**Released:** 2025-10-09 22:05:40 UTC

### [Add OpenAPI Documentation and Refactor Project Structure (#44)](https://github.com/Santiago1010/node-template/pull/55)

#### 📋 Summary
This PR introduces comprehensive OpenAPI documentation and refactors the project structure by moving utilities to a dedicated directory and cleaning up unused performance helpers.

#### 🔍 What Changed
### Added
- OpenAPI documentation structure with basicInfo, components, paths, server, and tags
- Swagger UI integration accessible at `/api/docs` in development mode
- Login endpoint documentation with request schema and validation
- CONTRIBUTING.md and DEVELOPER_SETUP.md documentation files

### Changed
- Moved `getDeviceInfo` helper from `helpers/` to `utils/` directory
- Enhanced tag descriptions in OpenAPI documentation
- Updated project structure with organized test directories

### Removed
- `performance.helper.js` and associated test files
- Redundant test files in crud and performance directories

**Type of Change:** New Feature, Documentation

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement
- Milestone: A1 — Swagger sync + tests
- Commits: 7

**Commits:**
- [`404fe59`](https://github.com/Santiago1010/node-template/commit/404fe5948d3210a91a4fd09ae81069bc80ca77f3) refactor(utils): move utilities helper to utils directory and clean up test structure
- [`e2275b7`](https://github.com/Santiago1010/node-template/commit/e2275b72ccb57872bbf913c3f58861a3bb0a8ae3) feat(docs): add OpenAPI documentation structure
- [`705f217`](https://github.com/Santiago1010/node-template/commit/705f21700b14ad5e87daf0d701635b1d906dac78) docs(api): add OpenAPI paths structure for authentication
- [`eba3b8f`](https://github.com/Santiago1010/node-template/commit/eba3b8f6192b9a8a584e7d8cd442846eb92dde15) feat(docs): add Swagger UI documentation endpoint in development
- [`ee78fa4`](https://github.com/Santiago1010/node-template/commit/ee78fa4243b5afc701d421d2c58dfe2e00caabc3) fix(docs): correct Swagger UI endpoint routing
- [`2a4e6f9`](https://github.com/Santiago1010/node-template/commit/2a4e6f9f884547ce3174456e83c80c1f7dc69347) feat(docs): add login endpoint documentation and enhance tag descriptions
- [`92c0d74`](https://github.com/Santiago1010/node-template/commit/92c0d7422ad704490750620bdcd65eb8781fc94f) feat(docs): enhance login endpoint documentation with request schema

---



## [1.10.3] - 2025-10-09

**Released:** 2025-10-09 20:56:47 UTC

### [Add Project Documentation](https://github.com/Santiago1010/node-template/pull/54)

#### 📋 Summary
Add comprehensive contributing guidelines and developer setup documentation to establish project standards and onboarding process.

#### 🔍 What Changed
### Added
- CONTRIBUTING.md with contribution guidelines and commit standards
- DEVELOPER_SETUP.md with detailed development environment setup

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A

#### 📝 Additional Notes
- Documents follow Conventional Commits specification
- Includes both Docker and local development setup options
- Establishes code quality standards with Biome and Jest
- Provides clear pull request and contribution workflow

**Type of Change:** Documentation

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, developer experience
- Milestone: DX1 — Onboarding + local dev
- Commits: 1

**Commits:**
- [`8003f1e`](https://github.com/Santiago1010/node-template/commit/8003f1e5dd31c6d029b2a66444c842d0f564f1fd) docs: add contributing and developer setup guides

---



## [1.10.2] - 2025-10-09

**Released:** 2025-10-09 20:41:36 UTC

### [Refactor project structure and enhance CRUD helper](https://github.com/Santiago1010/node-template/pull/53)

#### 📋 Summary
This PR reorganizes the project structure by moving utility helpers to a dedicated `utils` directory, removes the performance helper module, enhances the CRUD helper with additional functionality and test coverage, and improves the response helper with optional message support.

#### 🔍 What Changed
### Added
- New utility files in `utils/` directory (constants, encrypt, numbers, strings, utilities)
- Comprehensive test suite for CRUD helper methods
- Response helper tests covering various parameter combinations
- New CRUD functionality including table pattern matching and field validation

### Changed
- Moved helper files from `helpers/` to `utils/` directory
- Converted private CRUD methods to public for better testability
- Enhanced response helper with optional message support
- Improved boolean detection in CRUD helper with additional patterns
- Updated project structure documentation

### Removed
- Performance helper module and all associated tests
- Web middleware directory
- Constructor validation from CRUD helper

#### 📝 Additional Notes
The performance helper was removed as it was deemed unnecessary for current project requirements. The CRUD helper enhancements provide better database interaction capabilities and improved error handling.

**Type of Change:** Testing

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: testing, developer experience
- Milestone: A1 — Swagger sync + tests
- Commits: 6

**Commits:**
- [`2879965`](https://github.com/Santiago1010/node-template/commit/28799650d9e559c9df9f00048b41ceaf5a9be9ab) refactor(crud): reorganize helper structure and enhance test coverage
- [`39f24d5`](https://github.com/Santiago1010/node-template/commit/39f24d5df90e5c2b73b5983470c7eef6436d9560) refactor(crud): convert private methods to public and enhance test coverage
- [`eeea279`](https://github.com/Santiago1010/node-template/commit/eeea279b93f9f4ff2c6825caa28de957407ac78c) test(crud): fix template error handling test with proper module mocking
- [`3e6dc4d`](https://github.com/Santiago1010/node-template/commit/3e6dc4d66260ca8d75d6ce9f5bb839819d1b96df) test(crud): simplify template error test with fs/promises mock
- [`2dfcc07`](https://github.com/Santiago1010/node-template/commit/2dfcc0748dfb3589e4fdf070095ea82e5d8a836c) feat(response): enhance success helper with optional message support
- [`e54c85a`](https://github.com/Santiago1010/node-template/commit/e54c85a6a532932744912b42f0f5fe792ae83023) refactor(performance): remove performance helper and related tests

---



## [1.10.1] - 2025-10-09

**Released:** 2025-10-09 00:35:27 UTC

### [Refactor helper modules to utils directory](https://github.com/Santiago1010/node-template/pull/49)

#### 📋 Summary
Restructured project by moving helper modules from `helpers/` to `utils/` directory and updating all import references across the codebase.

#### 🔍 What Changed
### Added
- New `utils/` directory structure

### Changed
- Moved `constants.helper.js` to `utils/constants.util.js`
- Moved `encrypt.helper.js` to `utils/encrypt.util.js`
- Moved `numbers.helper.js` to `utils/numbers.util.js`
- Moved `strings.helper.js` to `utils/strings.util.js`
- Moved `utilities.helper.js` to `utils/utilities.util.js`
- Updated all import paths across 40+ files to reference new utils location
- Updated test file paths and imports to match new structure

### Fixed
- N/A

### Removed
- Old helper files from `helpers/` directory

#### 📝 Additional Notes
This refactor improves project structure by separating utility functions from business logic helpers. All functionality remains identical - only file locations and import paths have changed.

**Type of Change:** Refactoring

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: developer experience, refactor
- Milestone: DX1 — Onboarding + local dev
- Commits: 2

**Commits:**
- [`e85669c`](https://github.com/Santiago1010/node-template/commit/e85669c78bc8e55eccdbc759d4581186cb60501b) refactor(utils): reorganize helper modules into utils directory
- [`972df63`](https://github.com/Santiago1010/node-template/commit/972df63c20e67ef88679e3363634cb2e140fd5d4) chore(tests): update test file paths and imports for utils reorganization

---



## [1.10.0] - 2025-10-05

**Released:** 2025-10-05 20:54:36 UTC

### [Refactor Project Structure and Enhance CRUD Generation](https://github.com/Santiago1010/node-template/pull/42)

#### 📋 Summary
This PR implements a comprehensive restructuring of the application architecture to support multiple client platforms (web, app, bot, desktop, wearable) and enhances the CRUD generation system with improved templates, validation, and documentation.

#### 🔍 What Changed
### Added
- Multi-platform architecture with separate routes, controllers, and services for web, app, bot, desktop, and wearable
- New configuration models for endpoints and security levels (`configEndpoints`, `configEndpointsRequestSchema`, `configSecurityLevels`)
- Enhanced CRUD generation scripts for controllers, endpoints, and services
- Validation schema registry utility for automatic endpoint documentation
- Response helper utility for standardized API responses
- Endpoint synchronization script for automatic route registration

### Changed
- Restructured project directory organization by platform type
- Updated constants helper with comprehensive documentation and new device types
- Enhanced CRUD helper with improved type detection and template handling
- Refactored route structure to support platform-specific API versions
- Improved template system with better organization and placeholder replacement

### Removed
- Legacy authentication controllers and services (`sessionWeb.controller.js`, `sessionWeb.service.js`)
- Obsolete middleware files (`pageUseEndpoint.middleware.js`, `session.middleware.js`)
- Old route structure and validation files

#### 📝 Additional Notes
- New platform structure enables independent development for web, mobile apps, bots, desktop apps, and wearables
- Validation registry automatically captures and documents API endpoints
- Enhanced constants helper provides comprehensive configuration management
- All CRUD generation scripts now use improved templates with better error handling

**Type of Change:** New Feature, Documentation

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement
- Commits: 10

**Commits:**
- [`b5d26ba`](https://github.com/Santiago1010/node-template/commit/b5d26baf73b8219f49131104b364d48c75cba561) chore(i18n): translate console messages to english and clean up associations
- [`412d111`](https://github.com/Santiago1010/node-template/commit/412d111265520009d94144e5bd00820510bc34f9) chore(i18n): add array validation message key
- [`f337e26`](https://github.com/Santiago1010/node-template/commit/f337e26b6f102700b291c087e43e4e68c28d29ed) refactor(config): enhance constants helper and remove unused middlewares
- [`8fa5546`](https://github.com/Santiago1010/node-template/commit/8fa5546ff0ef4f322a8e19e6b17c22fffc9b7ece) refactor(architecture): reorganize project structure and consolidate templates
- [`e137c78`](https://github.com/Santiago1010/node-template/commit/e137c78a396df6e43925c386a11329556b665970) feat(cli): add CRUD endpoints generator script
- [`3c4102a`](https://github.com/Santiago1010/node-template/commit/3c4102ad82d598c0080efc6ac294f993f51a4b71) chore(routes): add platform-specific route index files
- [`3604960`](https://github.com/Santiago1010/node-template/commit/360496031dd65dd257e96e5ee79e0c9b4b20c168) refactor(cli): enhance CRUD endpoints generator and update structure
- [`6926f99`](https://github.com/Santiago1010/node-template/commit/6926f9913f4c54e80a89daf0bf6ef6561e0b6fd9) feat(api): implement multi-platform routing and restore logging service
- [`ee293f3`](https://github.com/Santiago1010/node-template/commit/ee293f3641f0c259d7b9b30689e7cb964753804a) chore(middleware): restore CORS middleware and update scripts
- [`83d9b74`](https://github.com/Santiago1010/node-template/commit/83d9b74ee7ec32f968ede655aeadff11fc624a88) refactor(crud): consolidate templates and update generation paths

---



## [1.9.0] - 2025-10-04

**Released:** 2025-10-04 13:59:58 UTC

### [WebSocket Manager Rewrite with Enhanced Security Features](https://github.com/Santiago1010/node-template/pull/41)

#### 📋 Summary
This PR completely rewrites the WebSocket management system to include device fingerprinting, enhanced authentication, and structured messaging. It replaces the previous implementation with a more secure and feature-rich solution.

#### 🔍 What Changed
### Added
- New WebSocket manager with device fingerprinting and enhanced security
- Device information extraction utility in helpers
- User access tracking model (usrAccesses)
- Comprehensive sockets documentation

### Changed
- Replaced legacy WebSocket implementation with new secure manager
- Updated database connection logging icon
- Modified server startup logging messages
- Restructured sockets configuration directory

### Fixed
- N/A

### Removed
- Legacy WebSocket manager from config/websockets

#### 📝 Additional Notes
The new implementation includes device fingerprinting using browser, OS, and device type for security validation. Breaking changes include new authentication requirements and message structure. Existing WebSocket clients will need updates to comply with the new authentication flow.

**Type of Change:** New Feature, Documentation

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement
- Commits: 5

**Commits:**
- [`1a74225`](https://github.com/Santiago1010/node-template/commit/1a74225a797f72b50f0bf570f27f86d3355ddee4) feat(websockets): implement enhanced websocket manager with device fingerprinting
- [`0c8178e`](https://github.com/Santiago1010/node-template/commit/0c8178ec58b5d0571d0894ac7c4089dc41bf8354) docs(websockets): enhance websocket manager documentation and code comments
- [`dcd671e`](https://github.com/Santiago1010/node-template/commit/dcd671ed80a466ad6c74fa8e90b0a34ec29d3fcb) feat(utils): add device information extraction utility
- [`28129f0`](https://github.com/Santiago1010/node-template/commit/28129f0695a340a219e91c8ce8d48a635a93dc66) refactor(sockets): replace device info extraction with utility helper
- [`33d4c4b`](https://github.com/Santiago1010/node-template/commit/33d4c4b5b33647ac0723983ee6276c6df8cc759c) docs(sockets): add comprehensive WebSocket configuration documentation

---



## [1.8.0] - 2025-10-02

**Released:** 2025-10-02 23:03:54 UTC

### [Add WebSocket Support and Refactor Database Utilities](https://github.com/Santiago1010/node-template/pull/40)

#### 📋 Summary
This PR introduces WebSocket real-time communication capabilities and refactors database utilities for improved maintainability. Key changes include adding WebSocket connection management, consolidating database helpers, updating log models, and adding service generation scripts.

#### 🔍 What Changed
### Added
- WebSocket manager for real-time client communication
- Service generation script (`generate-services`)
- New service template for CRUD operations
- Validation schemas README documentation

### Changed
- Consolidated database utilities into single `database.helper.js`
- Refactored CRUD helper with enhanced foreign key detection
- Updated log models to include `rowId` and `justification` fields
- Simplified cookie configuration by removing device detection
- Improved database connection configuration

### Fixed
- Test cleanup to properly close database connections
- Updated encrypt test to use shorter test data

### Removed
- Separate log services (creation, deletion, status, update)
- Individual database utility files (`pagination.helper.js`, `utilities.helper.js`)

#### 📝 Additional Notes
- WebSocket manager supports multiple connections per user
- Consolidated log service provides unified audit trail
- Database helper now includes pagination, search, and soft delete utilities
- Service generation automates CRUD service creation

**Type of Change:** New Feature, Documentation

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement
- Commits: 10

**Commits:**
- [`29776d6`](https://github.com/Santiago1010/node-template/commit/29776d693f8a3a500637d528e0cce865e0a68b62) feat(logs): implement comprehensive log history retrieval for records
- [`ef56f3a`](https://github.com/Santiago1010/node-template/commit/ef56f3adbc0d29a453d1dc3cba2f25f4007fb1ab) feat(cli): add automated CRUD service generation script
- [`7df7ebc`](https://github.com/Santiago1010/node-template/commit/7df7ebcaad194561e497f2bf4fff480289dc6f58) fix(cli): correct service generator naming and path issues
- [`024f3d9`](https://github.com/Santiago1010/node-template/commit/024f3d94e3fa5855337be347f4c43725f25a3bf9) fix(cli): improve model name generation and filter implementation
- [`621119f`](https://github.com/Santiago1010/node-template/commit/621119f7a380292d1f87244495674e8549548234) chore: update project structure documentation and constants helper
- [`220adf7`](https://github.com/Santiago1010/node-template/commit/220adf77d86287d9f9a8768ca766088fb0a31a83) docs(validations): add comprehensive README for validation schemas
- [`7f59ee4`](https://github.com/Santiago1010/node-template/commit/7f59ee412e70199e2c2a96067891badf0ee0c3b5) feat(websockets): implement real-time communication manager
- [`44282d6`](https://github.com/Santiago1010/node-template/commit/44282d6cd4d1071c04225502335a27340253404b) chore(websockets): add authentication todos for device validation
- [`cf5c820`](https://github.com/Santiago1010/node-template/commit/cf5c8201682143e6c924c9169b7b1ca1a3a4d125) refactor(docs): consolidate code generation logic into crud helper
- [`51b34cc`](https://github.com/Santiago1010/node-template/commit/51b34cc9012c3494e2b271ba14608135e3a39b48) refactor(scripts): consolidate code generation utilities and remove duplication

---



## [1.7.0] - 2025-09-27

**Released:** 2025-09-27 13:14:37 UTC

### [Configuration Documentation and Database Refactor](https://github.com/Santiago1010/node-template/pull/39)

#### 📋 Summary
This PR adds comprehensive documentation for the configuration modules, refactors the database connection setup for simplicity, introduces logging models and services, enhances CRUD helpers with advanced search capabilities, and adds code generation scripts for automated documentation and validation creation.

#### 🔍 What Changed
### Added
- README.md files for all configuration modules (cache, context, database, env, i18n, security, tools)
- New logging models (logsCreation, logsDeletion, logsStatuses, logsUpdate)
- Logging services for creation, deletion, status tracking, and updates
- Advanced search functionality with Elasticsearch-like filtering
- Code generation scripts for CRUD documentation and validations
- Dynamic parameter reference generator for API documentation

### Changed
- Refactored database connection configuration for simplicity and clarity
- Updated CRUD helper to fix database connection initialization
- Enhanced validation helpers with model-based value validation
- Improved parameter schemas with better documentation

### Fixed
- Database connection initialization in CRUD helper
- Test configuration for database unit tests

### Removed
- Complex database configuration index file in favor of simpler setup

#### 📝 Additional Notes
The refactor simplifies database configuration while maintaining all existing functionality. New logging models provide comprehensive audit trails for data operations. The code generation scripts will significantly speed up development of new API endpoints.

**Type of Change:** New Feature, Documentation

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement
- Commits: 10

**Commits:**
- [`cfc8c83`](https://github.com/Santiago1010/node-template/commit/cfc8c833690230bbe0662656b7329054cbcea152) docs(config): add comprehensive configuration module documentation
- [`dfbadce`](https://github.com/Santiago1010/node-template/commit/dfbadce4db999ac362271009fcfe39c52515727d) feat(docs): enhance CRUD documentation generator with foreign key detection
- [`5492a15`](https://github.com/Santiago1010/node-template/commit/5492a15e0d3932117dd46e883a317d09d79a9d9f) feat(validations): add comprehensive CRUD validation schemas and helper
- [`4e8f7c9`](https://github.com/Santiago1010/node-template/commit/4e8f7c95b18b63d0ec84b4052cb33779025cf5d8) feat(scripts): add CRUD validation schema generator
- [`9626eaa`](https://github.com/Santiago1010/node-template/commit/9626eaa0218cbad1586bebb16fcd4716ae762769) chore(bin): add CRUD validation generator to package binaries
- [`966cd2c`](https://github.com/Santiago1010/node-template/commit/966cd2ce6d784924a111bd49fc31c7f81ec3edf1) fix(validations): correct model name generation and schema structure
- [`af3608c`](https://github.com/Santiago1010/node-template/commit/af3608cc547260eff4e971f3555b108fcd810227) feat(validations): add dynamic schema naming based on table names
- [`174594d`](https://github.com/Santiago1010/node-template/commit/174594d266c372218d5c863547602162ac89dcdf) fix(validations): correct update schema generation and naming
- [`63f37d8`](https://github.com/Santiago1010/node-template/commit/63f37d8171b259544cf68c748957933f0bec16d2) fix(validations): correct update schema generation and naming
- [`4a98a77`](https://github.com/Santiago1010/node-template/commit/4a98a773ce78afd36f89eec29b518890eda13fb8) fix(validations): correct output directory structure and file naming

---



## [1.6.1] - 2025-09-16

**Released:** 2025-09-16 19:55:32 UTC

### [Refactor Helpers and Improve Test Coverage](https://github.com/Santiago1010/node-template/pull/38)

#### 📋 Summary
This PR removes the Redis-based cache helper, refactors the context and debug helpers to use class-based patterns, and significantly improves test coverage across all helper modules. The changes focus on code quality, error handling, and maintainability.

#### 🔍 What Changed
### Added
- New comprehensive test suite for context helper with 100% coverage
- Enhanced error handling tests for debug and performance helpers
- New timestamp validation utility in debug helper
- Test environment detection for permanent logging functions

### Changed
- Refactored context helper to class-based implementation with static methods
- Simplified debug helper by removing error handling and device detection features
- Improved boolean detection logic in model generator script
- Updated Jest configuration to exclude schemas directory from coverage

### Fixed
- Error handling in CRUD database and filesystem operations
- Permanent logging suppression in test environment
- Memory leak prevention in performance tracking

### Removed
- Redis cache helper and all associated tests
- Legacy context helper implementation and tests
- Device detection and error registration from debug helper
- Obsolete scripts/config.js file

#### 📝 Additional Notes
The cache helper removal indicates a shift away from Redis-based caching. The context helper refactor provides better async context management with improved error handling. Test improvements ensure 100% coverage for critical helper functions.

**Type of Change:** Testing

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: testing
- Commits: 7

**Commits:**
- [`1668b24`](https://github.com/Santiago1010/node-template/commit/1668b245906e1ce4f698edef86e289e182ce8bff) chore(cache): remove Redis cache helper and related test files
- [`7df8fdb`](https://github.com/Santiago1010/node-template/commit/7df8fdb582d4f2faebcc19fb9a96d290f1f55305) refactor(context): rewrite context helper as class-based implementation
- [`97073cd`](https://github.com/Santiago1010/node-template/commit/97073cd88ee4eff08c1aa343b037e43a921a3c73) fix(model): improve boolean detection for TINYINT(1) columns
- [`9f208e4`](https://github.com/Santiago1010/node-template/commit/9f208e4104969c907430f81a8b6b2f13a0fb6ccb) refactor(debug): remove error handling and device detection utilities
- [`0eaf419`](https://github.com/Santiago1010/node-template/commit/0eaf419ea4e527fbbea265ec5a046caeb8fcdbe8) refactor(debug): remove error handling and device detection utilities
- [`fb1bedc`](https://github.com/Santiago1010/node-template/commit/fb1bedc33aa0391b573185a6b64650db41fa21e9) refactor(debug): simplify logging functions and improve error handling
- [`f74d64c`](https://github.com/Santiago1010/node-template/commit/f74d64c94b81fc0dacece4cb5e1f8763ad625667) test(performance): enhance test coverage and add edge case handling

---



## [1.6.0] - 2025-09-15

**Released:** 2025-09-15 23:22:48 UTC

### [Refactor environment configuration and simplify security helper](https://github.com/Santiago1010/node-template/pull/37)

#### 📋 Summary
This PR restructures the environment configuration system for better organization and maintainability, simplifies the security helper to focus on core cryptographic functions, and includes associated documentation and test updates.

#### 🔍 What Changed
### Added
- scripts/config.js for configuration debugging
- templates/prompts/endpoints_docs.md for API documentation generation
- activeBody schema in common.params.js for standardized active status handling

### Changed
- .env.example with improved documentation and Docker-ready defaults
- config/cache/redisClient.js with legacy client support and setTimeout fix
- config/env/index.js with comprehensive configuration restructuring
- helpers/debug.helper.js with mode comparison fix
- helpers/security.helper.js simplified to core cryptographic functions
- package.json test command updated with open handle detection
- schemas/params/README.md with changelog and enhanced documentation
- Multiple test files consolidated and updated

### Fixed
- Mode comparison in debug.helper.js
- setTimeout usage in redisClient.js

### Removed
- .debug file
- Redundant security helper functions (rate limiting, CSRF, session management)
- Obsolete test files consolidated into single security test

#### 📝 Additional Notes
The security helper has been simplified to focus on core cryptographic operations (password hashing, JWT, sanitization). Removed functions may be reimplemented as separate middleware modules in future iterations. Configuration now supports Docker environments out of the box.

**Type of Change:** New Feature, Documentation, Testing

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: documentation, enhancement, testing
- Commits: 9

**Commits:**
- [`9b2584b`](https://github.com/Santiago1010/node-template/commit/9b2584beb0f940e99b7dc0991fea74488768b13a) fix(security): improve HTML sanitization and password validation
- [`2b2d63b`](https://github.com/Santiago1010/node-template/commit/2b2d63b241c54debb595e1eaa126c2bd77b99253) refactor(security): migrate to redis-based rate limiting and security monitoring
- [`cdf7629`](https://github.com/Santiago1010/node-template/commit/cdf762974bfb5d33eff9d0151f8a44da66a31cd5) refactor(config): restructure environment configuration and improve redis client
- [`c5cf803`](https://github.com/Santiago1010/node-template/commit/c5cf803068d7700f8d836ae77bf07e0937ee9e14) refactor(security): improve documentation and remove rate limiting functionality
- [`f6bc5f4`](https://github.com/Santiago1010/node-template/commit/f6bc5f40c93d820c896dbe5f4c9f442dc60ba843) refactor(security): remove redis dependencies and simplify security helper
- [`be6ebd8`](https://github.com/Santiago1010/node-template/commit/be6ebd8c271a524170de0ce18d95aa20e1cfef75) test(debug): improve test coverage and fix debug mode detection
- [`28413f0`](https://github.com/Santiago1010/node-template/commit/28413f0d51d83479b7766f97dfff6a100ac88a3b) chore(tests): consolidate security test files and update test configuration
- [`e38bbeb`](https://github.com/Santiago1010/node-template/commit/e38bbeb397a5a353edb8ce90c698419514c230ec) chore(config): clean up environment variable comments
- [`52142d1`](https://github.com/Santiago1010/node-template/commit/52142d15ec26d63b97d4275a9ee941e5e0707778) test(debug): improve error and device detection unit tests

---



## [1.5.0] - 2025-09-01

**Released:** 2025-09-01 23:30:26 UTC

### [AWS S3 Helper Enhancement and Test Coverage Expansion](https://github.com/Santiago1010/node-template/pull/36)

#### 📋 Summary
This PR introduces a comprehensive AWS S3 operations manager with enterprise-grade features, significantly expands test coverage across multiple helper modules, and improves error handling and documentation throughout the codebase.

#### 🔍 What Changed
### Added
- AWS S3 Manager class with comprehensive file operations (upload, download, delete, copy, move)
- AI assistant documentation (Claude and Gemini system prompts)
- Parameter schemas documentation
- Extensive test suites for security, performance, CRUD, and cache helpers
- New error translation keys for invalid tokens
- S3 configuration constants

### Changed
- Enhanced S3 helper with multipart uploads, presigned URLs, and batch operations
- Improved error handling in JWT verification with Boom errors
- Modified i18n configuration to disable auto-reload in test environment
- Updated cache helper to return null instead of throwing on fetch errors
- Refactored debug helper output formatting
- Enhanced parameter schemas with better documentation and validation

### Fixed
- SIGTERM logging in production environments
- Error handling in cache operations
- Security vulnerability in JWT error responses
- Number formatting error reporting

### Removed
- Redundant console.error calls in favor of structured logging

#### 📝 Additional Notes
The S3 helper now supports enterprise-grade features including multipart uploads, presigned URLs, batch operations, and comprehensive error handling. Test coverage has been significantly expanded across security, performance, and utility modules.

**Type of Change:** New Feature, Documentation, Testing

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@leiderp](https://github.com/leiderp)
- Labels: documentation, enhancement, testing
- Commits: 10

**Commits:**
- [`78c92d7`](https://github.com/Santiago1010/node-template/commit/78c92d7b17d85fe79466410ca749f0bd9fac6007) test(security): add comprehensive unit tests for security helper modules
- [`69cb767`](https://github.com/Santiago1010/node-template/commit/69cb767ad73c3dc15ce99bc3755f5a9354f4e2e0) test(performance): add comprehensive unit tests for performance helper modules
- [`4d165ae`](https://github.com/Santiago1010/node-template/commit/4d165ae68e93d745c3f07ec9003eeee7b4f71997) test(crud): add comprehensive unit tests for CRUD helper operations
- [`29e7277`](https://github.com/Santiago1010/node-template/commit/29e727747617df567f41dee508e7ec3a5c4d9de1) docs(api): enhance OpenAPI parameter documentation with comprehensive specifications
- [`d6de8ba`](https://github.com/Santiago1010/node-template/commit/d6de8ba98d6f8e0c06aa91a88e95f9f916f5e1ba) feat(aws): implement comprehensive S3 manager with enterprise-grade features
- [`3f92890`](https://github.com/Santiago1010/node-template/commit/3f92890de705ad58dc80098106d7417e162210c5) docs(aws): add comprehensive documentation to S3 helper module
- [`761fb67`](https://github.com/Santiago1010/node-template/commit/761fb679ef6433e5d0eadfeee809790e1b6df52a) test(security): add comprehensive unit tests for security auditing and utilities
- [`3cb7df0`](https://github.com/Santiago1010/node-template/commit/3cb7df071e41aea0cdf2ef7059f4758b9547c99d) refactor(test): improve security auditing test mocking implementation
- [`97a5e28`](https://github.com/Santiago1010/node-template/commit/97a5e28e44586166dd18aea1af0cf7c9d0fcb4a0) fix(cache): handle redis errors gracefully and improve test coverage
- [`b01395f`](https://github.com/Santiago1010/node-template/commit/b01395f71f100c54a8df76bd082b0be33c1d9886) docs(api): update OpenAPI parameter documentation and structure

---



## [1.4.0] - 2025-08-30

**Released:** 2025-08-30 21:13:21 UTC

### [Enhance Helper Utilities and Add Comprehensive Tests](https://github.com/Santiago1010/node-template/pull/35)

#### 📋 Summary
This PR introduces major enhancements to helper utilities including debug, context, numbers, strings, and security modules. It adds comprehensive test coverage with 122 new unit tests, improves error handling, and fixes existing bugs.

#### 🔍 What Changed
### Added
- 122 new unit tests across cache, context, debug, numbers, strings, and utilities modules
- Password hashing/verification functions to security helper
- Median and standard deviation functions to numbers helper
- DEBUG_SETTINGS constants with configurable timeouts and line lengths
- New test utilities for array, object, and functional programming operations

### Changed
- Refactored debug helper with comprehensive documentation and improved error handling
- Enhanced numbers helper with optimized validation and mathematical operations
- Improved context helper with proper sanitization and bug fixes
- Updated docs generator to function-based implementation with validation
- Optimized string helper functions with better edge case handling

### Fixed
- Context helper prototype method usage and array sanitization
- String helper empty input handling in generateSlug and stringSimilarity
- Environment configuration NODE_ENV fallback handling
- Debug mode detection and development mode checks

### Removed
- Redundant error logging in numbers helper validation functions

**Type of Change:** New Feature

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: enhancement
- Commits: 10

**Commits:**
- [`df7e322`](https://github.com/Santiago1010/node-template/commit/df7e3229f63d3738a7a78b0ae15ef1603580e930) refactor(numbers): remove debug logging and simplify error handling
- [`4f63f31`](https://github.com/Santiago1010/node-template/commit/4f63f31cb08d7ed2db60469e64e1f9cf22ab0ac5) refactor(numbers): replace cerror with console.error for formatting functions
- [`fc64790`](https://github.com/Santiago1010/node-template/commit/fc64790ffa3614dd6c41005c9f31ad5a354a6730) test: add comprehensive unit tests for cache and context helpers
- [`62492e8`](https://github.com/Santiago1010/node-template/commit/62492e8e3b068ff03276212c7d6a08c8f74e6648) test(utils): add comprehensive unit tests for utility helper functions
- [`49c4b8d`](https://github.com/Santiago1010/node-template/commit/49c4b8d78a28f79de2ab92cac9ace19747b908b4) feat(security): add password hashing utilities with bcrypt
- [`449ba43`](https://github.com/Santiago1010/node-template/commit/449ba43574a4e5bf1ee3ae76738ebc4d264341b7) refactor(docs): convert DocsGenerator class to functional module and add comprehensive tests
- [`febbebd`](https://github.com/Santiago1010/node-template/commit/febbebd933135d239d40889447c0795fbb317bc5) refactor(debug): enhance debug helper with comprehensive documentation and centralized constants
- [`88260ca`](https://github.com/Santiago1010/node-template/commit/88260ca07218f690a2c2146db70f2362da413035) fix(debug): handle case-insensitive mode comparison in development mode check
- [`46b10ca`](https://github.com/Santiago1010/node-template/commit/46b10ca33f4da8e35fc2b51e1a2862bc55ccd9e6) test(debug): add comprehensive unit tests for conditional logging functions
- [`7dfa359`](https://github.com/Santiago1010/node-template/commit/7dfa3596c5c35bd2ea383115bb5b473840cdf50c) test(debug): add unit tests for permanent logging functions

---



## [1.3.0] - 2025-08-29

**Released:** 2025-08-29 19:50:22 UTC

### [Test Infrastructure and Encryption Refactor](https://github.com/Santiago1010/node-template/pull/34)

#### 📋 Summary
This PR introduces comprehensive test infrastructure with Jest, refactors encryption utilities to use bcrypt for password hashing, adds AWS S3 configuration, and includes extensive unit tests for helper functions.

#### 🔍 What Changed
### Added
- Jest test configuration with coverage reporting
- Babel configuration for Jest compatibility
- Husky pre-push hook for test coverage
- AWS S3 helper and configuration
- 25+ test files covering encryption, numbers, and string helpers
- Test environment setup and global configuration

### Changed
- Replaced custom password hashing with bcrypt implementation
- Updated AES encryption to use proper GCM mode and base64 encoding
- Improved RSA signature verification error handling
- Enhanced number and string helper validation logic
- Updated escape sequences formatting in constants

### Fixed
- RSA signature verification returns false instead of throwing errors
- AES encryption/decryption parameter handling
- Hybrid encryption key encoding

### Removed
- Payment gateway environment variables from .env.example
- Validations factory file

#### 📝 Additional Notes
- Password hashing now uses industry-standard bcrypt with async operations
- Encryption helpers maintain backward compatibility with improved security
- Test coverage includes edge cases and error scenarios
- Biome configuration updated to support test globals

**Type of Change:** New Feature, Bug Fix

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: bug, enhancement
- Commits: 10

**Commits:**
- [`6db8b2a`](https://github.com/Santiago1010/node-template/commit/6db8b2a85c7a2f9d628871d6ca20c7472ac31eeb) test(encrypt): fix hybrid encryption test assertions and improve validation
- [`1a3a15b`](https://github.com/Santiago1010/node-template/commit/1a3a15ba22758bad49b8dbce337985dbf8a4a32e) test(encrypt): enhance RSA test coverage with error scenarios
- [`6314544`](https://github.com/Santiago1010/node-template/commit/63145443a33157e4d48eeb59aa7c8bbbdbda2f72) fix(encrypt): simplify RSA verification error handling and add AES error tests
- [`946a131`](https://github.com/Santiago1010/node-template/commit/946a131f5d6cc85c4ac3a47cd39408236a41e2c2) test(encrypt): add comprehensive hashing functions test suite
- [`11e019f`](https://github.com/Santiago1010/node-template/commit/11e019f3fff1d826c7c17023e71cf143eea4eb9b) fix(encrypt): correct AES key encoding and add comprehensive parameter tests
- [`57946c5`](https://github.com/Santiago1010/node-template/commit/57946c5a306f2f5b7ad0d201b238e1798948bd2c) chore: remove validation factory and update jest coverage configuration
- [`1ad66bb`](https://github.com/Santiago1010/node-template/commit/1ad66bbc9bd7accf2d8dfe3593e518c01e7d4d1a) test(numbers): add comprehensive unit test suite for number utilities
- [`d815056`](https://github.com/Santiago1010/node-template/commit/d815056b7dfa215a110c6b2012ab7f07ae6a2f29) test(strings): add comprehensive unit test suite for string utilities
- [`ebc8a15`](https://github.com/Santiago1010/node-template/commit/ebc8a150f2ebe8f8c46621fa4be50f936ecfffac) refactor(strings): improve escape sequence handling and documentation
- [`7cc5da5`](https://github.com/Santiago1010/node-template/commit/7cc5da58c6ddc035dabe1479674e8f10965d202c) ci(github): skip pre-push hooks in CI environments

---



## [1.2.0] - 2025-08-28

**Released:** 2025-08-28 13:28:01 UTC

### [Refactor Database Connection and Enhance Authentication](https://github.com/Santiago1010/node-template/pull/33)

#### 📋 Summary
This PR completely overhauls the database connection management system, replacing the custom event-driven connection manager with a streamlined Sequelize ORM configuration. It introduces password encryption, enhances the model loading system, and adds comprehensive authentication features with internationalization support.

#### 🔍 What Changed
### Added
- AES encryption for user passwords with getter/setter methods
- Internationalization support for authentication error messages
- Recursive model discovery and initialization system
- Graceful shutdown handlers for database connections
- Enhanced SQL query templates for schema inspection

### Changed
- Replaced custom DatabaseConnection class with direct Sequelize configuration
- Simplified CRUD helper to use shared Sequelize instance
- Improved error handling with Boom HTTP error responses
- Enhanced documentation across all modified files
- Updated model loader to provide direct model references for IDE support

### Fixed
- Database connection management and pooling configuration
- Path references in debug helper for logs directory
- Error response formatting in authentication service

### Removed
- Custom event-driven database connection manager
- Manual connection initialization from CRUD helper
- Redundant database connection logic from main application

#### 📝 Additional Notes
- The new connection system uses Sequelize's built-in connection pooling and retry mechanisms
- Password encryption utilizes AES with configurable keys and initialization vectors
- Model loading now supports recursive directory traversal for better project organization
- All database queries use parameterized queries to prevent SQL injection
- Error handling now provides appropriate HTTP status codes with internationalized messages

**Type of Change:** New Feature

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@DiegoAlejandroNino](https://github.com/DiegoAlejandroNino)
- Labels: enhancement
- Commits: 10

**Commits:**
- [`0e80465`](https://github.com/Santiago1010/node-template/commit/0e80465d2b9ce391c23d0dc1246a3d0ccb8f040c) refactor(models): enhance model loader with comprehensive documentation and validation
- [`bdc3df9`](https://github.com/Santiago1010/node-template/commit/bdc3df99dbf09ba7e31bed48603a832e6e732570) refactor: remove database connection dependency from service and main app
- [`3e643a0`](https://github.com/Santiago1010/node-template/commit/3e643a0911bbb7b2b119cf062ce0cea4916613f6) refactor(database): simplify connection management and model loading
- [`25a4bb6`](https://github.com/Santiago1010/node-template/commit/25a4bb61e079b4c47c15e311934646258428cd04) refactor(database): enhance connection manager with improved documentation and model exports
- [`47a71ef`](https://github.com/Santiago1010/node-template/commit/47a71ef9fae358dcb660c8d395db50489dfdffa4) docs(models): enhance model loader with comprehensive documentation and comments
- [`c3f7d0d`](https://github.com/Santiago1010/node-template/commit/c3f7d0dfe65305a924907eb2c5ec54b7bcb25e19) refactor(crud): simplify database connection handling and integrate with existing sequelize instance
- [`3b54eb0`](https://github.com/Santiago1010/node-template/commit/3b54eb0955255aa40ecc36d1379fbc9c1c9490a5) docs(crud): enhance documentation and add comprehensive code comments
- [`41d08c6`](https://github.com/Santiago1010/node-template/commit/41d08c66c8fd3b97d5cb1d1b6d0d723fb1dc9bae) feat(auth): enhance session service with improved error handling and account validation
- [`9fe1eb9`](https://github.com/Santiago1010/node-template/commit/9fe1eb9e06bc28466c99cc50b36f11c3fc69eb67) feat(auth): implement password encryption and enhanced login validation
- [`62c9854`](https://github.com/Santiago1010/node-template/commit/62c98540c8193a1932e52c4335b59615e8a9f789) refactor(ci): improve auto-versioning system with structured content extraction

---



## [1.1.0] - 2025-08-27

**Released:** 2025-08-27 13:24:28 UTC

### [Infrastructure Overhaul: Database, Logging, and Authentication Systems](https://github.com/Santiago1010/node-template/pull/32)

**PR Content (verbatim):**
## 📋 Summary
This PR implements a comprehensive infrastructure upgrade including a professional Winston logging system, automated Sequelize model generation, enhanced database connection management, and complete authentication system with web session handling.

## 🎯 Type of Change
- [x] New feature (adds functionality)
- [x] Code refactoring (no functional changes)
- [x] Performance improvement
- [ ] Bug fix (non-breaking change)
- [ ] Breaking change (breaks existing functionality)
- [x] Documentation update
- [ ] Test coverage improvement
- [ ] Build system changes
- [ ] CI/CD changes

## 🔍 What Changed
### Added
- Winston logging configuration with daily rotation and sensitive data redaction
- Automated Sequelize model generator script with CLI interface
- Complete authentication system (controllers, services, routes, validations)
- Database CRUD helper for schema inspection and code generation
- Enhanced database connection management with retry logic
- Mode

... (content truncated)

**Type of Change:** New Feature

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@DiegoAlejandroNino](https://github.com/DiegoAlejandroNino)
- Labels: enhancement
- Commits: 10

**Commits:**
- [`58d2b0d`](https://github.com/Santiago1010/node-template/commit/58d2b0d580b6c825342a5dca3c71f7b0b6a5c019) Merge pull request #14 from Santiago1010/Santiago1010-patch-5
- [`2c5c6a6`](https://github.com/Santiago1010/node-template/commit/2c5c6a6d7052a41b875a8c16540ac9cf75d4eafa) Update release.yml
- [`dac6693`](https://github.com/Santiago1010/node-template/commit/dac6693e81920eeb3cca0378184178ceb87ef247) Merge pull request #15 from Santiago1010/Santiago1010-patch-1
- [`0b6b612`](https://github.com/Santiago1010/node-template/commit/0b6b612902f3b5eb7906b8996dd60c68ec4e55c9) feat(ci): implement auto-versioning and changelog generation
- [`1777f4b`](https://github.com/Santiago1010/node-template/commit/1777f4be4a21f3ba781a9b346d3eac2c32528d2e) refactor(ci): improve auto-versioning workflow and changelog generation
- [`8a7caf4`](https://github.com/Santiago1010/node-template/commit/8a7caf4a40a87ebeb8c2b51af9945d2ac7ae3700) refactor(ci): enhance release workflow with improved safety checks
- [`07cb45d`](https://github.com/Santiago1010/node-template/commit/07cb45d8f5a860e4f218de08faa8063a520d3779) Merge pull request #16 from Santiago1010/fix/release-bot
- [`a8fce7a`](https://github.com/Santiago1010/node-template/commit/a8fce7af0e92058dbea6ca38a1133b3565170683) ci(release): simplify PR approval check in release workflow
- [`3b60f29`](https://github.com/Santiago1010/node-template/commit/3b60f29a9cbb3ed7399b38a251d1f96e9ba8c68d) Merge pull request #19 from Santiago1010/fix/release-bot-4
- [`57b3883`](https://github.com/Santiago1010/node-template/commit/57b38832edcbb796d088c1b2039944e141a916f3) ci(release): add PR info retrieval step to release workflow

---



## [1.0.7] - 2025-08-23

**Released:** 2025-08-23 23:12:41 UTC

### [Add Database Utilities, Validation Schemas, and i18n Support](https://github.com/Santiago1010/node-template/pull/29)

**Summary:** 📋 Summary
This PR introduces comprehensive database utilities, validation schemas, and internationalization support. It includes pagination helpers, database utilities, validation factories, and i18n localization files for English and Spanish.

🎯 Type of Change
- [x] New feature (adds function...

**Type of Change:** New Feature

**Added:**
- i18n locale files (en.json, es.json) with validation messages
- Database utilities (pagination.helper.js, utilities.helper.js)
- Validation schemas (commonSchemas.helper.js, databaseSchemas.helper.js, validations.factory.js)
- Documentation generator (docs-generator.helper.js)
- Parameter schemas (pagination.params.js, search.params.js, common.params.js)
- Validation schemas (filters.schema.js, pagination.schema.js, search.schema.js)

**Changed:**
- Project structure (removed Husky hooks, added new helper files)
- Enhanced number helper with conversion function
- Enhanced security helper with HTML sanitization and XSS detection
- Updated constants with database configuration

**Removed:**
- Husky pre-commit hooks and related files

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@DiegoAlejandroNino](https://github.com/DiegoAlejandroNino)
- Labels: enhancement
- Commits: 10

**Commits:**
- [`3e6be49`](https://github.com/Santiago1010/node-template/commit/3e6be49599aa314b47e9a03acfcbb02903b1ea6e) refactor(validations): rename validation files and add code organization comments
- [`e5977b6`](https://github.com/Santiago1010/node-template/commit/e5977b6d308adcb5c064e36e9fc9862a001bf490) feat(validations): add database ID validation schema and documentation helpers
- [`701798e`](https://github.com/Santiago1010/node-template/commit/701798e149490cb230a5b9c6171acd3e103f3de1) feat(validations): add comprehensive database validation schemas
- [`8b4558e`](https://github.com/Santiago1010/node-template/commit/8b4558e41d1ee1b65133238d1b86958d3881f9c8) feat(docs): add DocsGenerator helper for standardized API documentation
- [`ff14e8e`](https://github.com/Santiago1010/node-template/commit/ff14e8e43ae935506d7b7d52efb0e30ee578329b) feat(database): add comprehensive pagination helper with navigation metadata
- [`a29b161`](https://github.com/Santiago1010/node-template/commit/a29b1619e02f9ba98ff7037754b95bbfb728a91f) docs(database): add comprehensive documentation for pagination helper
- [`1ad64d8`](https://github.com/Santiago1010/node-template/commit/1ad64d85c1fbae7729af22bf04ed80ec0bab9671) feat(database): add comprehensive utilities helper with search and soft delete functions
- [`9595474`](https://github.com/Santiago1010/node-template/commit/9595474960fe763d163861caca3e2531ee5b382a) docs(constants): add comprehensive JSDoc documentation for DB_CONFIG
- [`b34e76d`](https://github.com/Santiago1010/node-template/commit/b34e76d58a9c33d223450268c37d5facf145c0c0) feat(validations): add filter, pagination, and search validation schemas
- [`0110a5d`](https://github.com/Santiago1010/node-template/commit/0110a5d02ef863a4ea8974316d54a732ab9d0851) refactor(docs): restructure documentation parameters into schemas/params directory

---



## [1.0.6] - 2025-08-23

**Released:** 2025-08-23 16:36:09 UTC

### [Add Comprehensive Helper Modules and Pre-commit Hook](https://github.com/Santiago1010/node-template/pull/28)

**Summary:** 📋 Summary
This PR introduces multiple new helper modules (cache, encryption, performance, security) and enhances existing ones (constants, context). It also adds Husky pre-commit hooks for automated linting and formatting.

🎯 Type of Change
- [x] New feature (adds functionality)
- [ ] Breakin...

**Type of Change:** New Feature

**Added:**
- Husky pre-commit hook for automated linting and formatting
- AsyncLocalStorage configuration for request context management
- Cache helper with Redis integration and advanced features (tags, locks, metrics)
- Enhanced constants helper with security, caching, and performance configurations
- Comprehensive context helper with improved request context management
- Encryption helper with RSA/AES support and password hashing
- Performance helper with monitoring, metrics, and optimization utilities
- Security helper with validation, rate limiting, and threat detection
- Test directory structure for new helpers

**Changed:**
- Updated project structure documentation
- Refactored models index file formatting
- Enhanced constants with security patterns and configuration objects
- Improved context helper with better security and validation

**Fixed:**
- N/A

**Removed:**
- N/A

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: enhancement
- Commits: 10

**Commits:**
- [`688576b`](https://github.com/Santiago1010/node-template/commit/688576b9fd60f9fd6915948a0d17debcca4dd40c) chore(deps): simplify lint-staged configuration and update project structure
- [`d045b67`](https://github.com/Santiago1010/node-template/commit/d045b67c6bf6de0b7bd8219e2ee2ebadd952394e) feat(security): implement comprehensive encryption helper module
- [`04cd283`](https://github.com/Santiago1010/node-template/commit/04cd283050c8cad8aadec0f80f9a5d035d0ee29a) feat(context): enhance async local storage context management
- [`6e78621`](https://github.com/Santiago1010/node-template/commit/6e786211d532d647da4a4cc369be0469295b5d6b) feat(security): implement comprehensive security helper with multi-layer protection
- [`5cf64f4`](https://github.com/Santiago1010/node-template/commit/5cf64f4b90b65a680c0e45c7a38c3ba3655c0392) feat(cache): implement Redis cache helper with advanced features
- [`37552d9`](https://github.com/Santiago1010/node-template/commit/37552d9c7fb2ce5c8a897b0983291e8cb1a73d07) feat(performance): implement comprehensive performance monitoring and optimization utilities
- [`ea9f907`](https://github.com/Santiago1010/node-template/commit/ea9f907e00c258fa66f91eb4f3bc42c4ccb8b262) refactor(performance): centralize performance configuration in constants
- [`361283e`](https://github.com/Santiago1010/node-template/commit/361283e49779956c6f960a37db6413683b655583) chore: update project structure documentation in changelog
- [`f24d1b1`](https://github.com/Santiago1010/node-template/commit/f24d1b1033643b52d11cc7a1718d2ef17ef8659b) chore: add husky pre-commit hook and test directory structure
- [`37049ea`](https://github.com/Santiago1010/node-template/commit/37049ea0601500cfa41c5fd8cfe7db5f17fc33ab) build(deps): update pre-commit hook to use format:write script

---



## [1.0.5] - 2025-08-22

**Released:** 2025-08-22 23:59:06 UTC

### [Refactor auto-versioning and add utility helpers](https://github.com/Santiago1010/node-template/pull/27)

**Summary:** 📋 Summary
This PR enhances the auto-versioning script with improved changelog generation and adds comprehensive utility helper modules for strings, numbers, debugging, and general utilities.

🎯 Type of Change
- [x] New feature (adds functionality)
- [ ] Bug fix (non-breaking change)
- [ ] Br...

**Type of Change:** New Feature

**Added:**
- Enhanced auto-versioning script with better PR body parsing
- New debug helper with logging and error handling utilities
- Comprehensive numbers helper with validation and math operations
- Strings helper with validation, formatting, and manipulation utilities
- Utilities helper with array, object, and functional programming helpers
- Enhanced constants helper with organized application constants

**Changed:**
- Refactored auto-versioning script for cleaner changelog generation
- Updated configuration files to use new helper modules
- Improved path references using new constants helper
- Simplified package.json lint-staged configuration

**Removed:**
- Old CHANGELOG.md content (to be regenerated by new versioning script)
- Redundant release script file

**Details:**
- Author: [@Santiago1010](https://github.com/Santiago1010)
- Approved by: [@Sleon4](https://github.com/Sleon4)
- Labels: enhancement
- Commits: 8

**Commits:**
- [`48484a0`](https://github.com/Santiago1010/node-template/commit/48484a000a85d9a91c65f6735e12a49fb38b7682) refactor(ci): improve changelog generation and versioning logic
- [`490ffbd`](https://github.com/Santiago1010/node-template/commit/490ffbdad58b3f7a599372d3d693bda9b52be54c) feat(debug): add comprehensive debug helper with logging and error handling
- [`090d4b6`](https://github.com/Santiago1010/node-template/commit/090d4b642fb71f4406f96b45f392674ccd11106d) refactor(config): reorganize configuration structure and enhance debug helper
- [`8650215`](https://github.com/Santiago1010/node-template/commit/86502158dc94be7e49404d6fbc290df686d5fad4) feat(utils): add comprehensive number helper with validation and math utilities
- [`33e4ae0`](https://github.com/Santiago1010/node-template/commit/33e4ae0c3065295386275b50d4eeaee6ac29465c) feat(strings): add comprehensive string helper with validation and manipulation utilities
- [`a8dd1a5`](https://github.com/Santiago1010/node-template/commit/a8dd1a52068e24ccc07631484cf30b774ca1faca) docs(strings): add comprehensive JSDoc documentation to string helper functions
- [`4b3e79b`](https://github.com/Santiago1010/node-template/commit/4b3e79bcc593644c1a7cfc6f91e56de9af447219) feat(utilities): create comprehensive utilities helper with array, object, and functional helpers
- [`dd2c47e`](https://github.com/Santiago1010/node-template/commit/dd2c47e686b08b086f7afd8202a28bb1fecc9f3d) chore(security): add placeholder files for encryption and security helpers

---

