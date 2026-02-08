// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const expressEndpoints = require('express-list-endpoints'); // Express route introspection utility

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const app = require('../app'); // Main Express application instance
const { paths } = require('../docs/index'); // OpenAPI documentation paths

// =============================================================================
// EXTRACT AND NORMALIZE ENDPOINTS
// =============================================================================

// Get all endpoints from the Express application
const listEnpoints = expressEndpoints(app);

// Sets to store unique endpoint paths
const endpoints = new Set();
const documented = new Set();

// Process each endpoint from the Express app
listEnpoints.forEach((endpoint) => {
  // Remove API version prefix (e.g., /api/v1/auth/login -> /auth/login)
  const cleanedPath = endpoint.path.replace(/^\/api\/v\d+/, '');

  // Transform Express route params to OpenAPI format (e.g., /:id -> /{id})
  const transformedPath = cleanedPath.replace(/\/:([^/]+)/g, '/{$1}');

  endpoints.add(transformedPath);
});

// Extract all documented paths from OpenAPI specification
for (const doc in paths) {
  documented.add(doc);
}

// =============================================================================
// COMPARISON AND REPORTING
// =============================================================================

// Find endpoints that exist in code but lack documentation
const undocumented = Array.from(endpoints).filter((ep) => !documented.has(ep));

// Find documentation that doesn't correspond to any existing endpoint
const extraDocs = Array.from(documented).filter((doc) => !endpoints.has(doc));

// Find endpoints that are properly documented
const properlyDocumented = Array.from(endpoints).filter((ep) => documented.has(ep));

// =============================================================================
// CONSOLE OUTPUT
// =============================================================================

console.log('\n========================================');
console.log('📊 ENDPOINT DOCUMENTATION REPORT');
console.log('========================================\n');

console.log(`✅ Total endpoints: ${endpoints.size}`);
console.log(`📄 Total documented paths: ${documented.size}`);
console.log(`✓  Properly documented: ${properlyDocumented.length}`);
console.log(`⚠️  Undocumented: ${undocumented.length}`);
console.log(`❌ Orphaned documentation: ${extraDocs.length}\n`);

// Display undocumented endpoints if any exist
if (undocumented.length > 0) {
  console.log('⚠️  UNDOCUMENTED ENDPOINTS:');
  console.log('─────────────────────────────');
  undocumented.forEach((ep) => console.log(`   • ${ep}`));
  console.log('');
}

// Display orphaned documentation if any exists
if (extraDocs.length > 0) {
  console.log('❌ ORPHANED DOCUMENTATION:');
  console.log('───────────────────────────────');
  extraDocs.forEach((doc) => console.log(`   • ${doc}`));
  console.log('');
}

// =============================================================================
// EXIT WITH APPROPRIATE CODE
// =============================================================================

if (undocumented.length === 0 && extraDocs.length === 0) {
  // All endpoints are documented and no orphaned docs exist
  console.log('🎉 Perfect! All endpoints are documented and no orphaned documentation exists.\n');
  process.exit(0);
} else {
  // Inconsistencies found - fail the check
  console.error('❌ Documentation inconsistencies detected. Please fix before pushing.\n');
  process.exit(1);
}
