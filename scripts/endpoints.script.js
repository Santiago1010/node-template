// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const expressEndpoints = require('express-list-endpoints');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const app = require('../app');
const { getRegisteredSchemas } = require('../utils/validationRegistry.util');

function extractSchemaFromRoute(route, basePath = '') {
  if (!route.stack) return null;

  for (const layer of route.stack) {
    if (layer.name === 'captureMiddleware' && layer.handle.length === 3) {
      const mockReq = {
        route: route,
        baseUrl: basePath,
      };

      try {
        // biome-ignore lint/suspicious/noEmptyBlockStatements: Arrow function needs empty block
        layer.handle(mockReq, {}, () => {});
      } catch (_) {
        // Ignore errors
      }
    }
  }

  return null;
}

// Recorrer todas las capas de Express
function processStack(stack, basePath = '') {
  stack.forEach((layer) => {
    if (layer.route) {
      extractSchemaFromRoute(layer.route, basePath);
    } else if (layer.name === 'router' && layer.handle.stack) {
      const newBasePath = basePath + (layer.regexp.source.match(/^\\\/([^\\\/\?]+)/)?.[1] || '');
      processStack(layer.handle.stack, newBasePath);
    }
  });
}

processStack(app._router.stack);

const endpoints = expressEndpoints(app);
const schemas = getRegisteredSchemas();

const endpointsWithSchemas = endpoints.map((endpoint) => {
  const schema = schemas.find((s) => endpoint.path.includes(s.path) && endpoint.methods.includes(s.method));

  return {
    ...endpoint,
    validationSchema: schema ? schema.schema : null,
  };
});

console.log('\n🔗 Endpoints completos:');
console.dir(endpointsWithSchemas, { depth: null });
