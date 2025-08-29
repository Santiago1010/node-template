

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

