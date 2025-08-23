

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

