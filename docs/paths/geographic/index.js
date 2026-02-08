const cities = require('./cities.docs');
const continents = require('./continents.docs');
const countries = require('./countries.docs');
const dialCodes = require('./dialCodes.docs');
const politicalDivisions = require('./politicalDivisions.docs');
const regions = require('./regions.docs');

module.exports = {
  '/geo/cities': { ...cities.basePath },
  '/geo/cities/{id}': { ...cities.pathWithId },
  '/geo/continents': { ...continents.basePath },
  '/geo/continents/{id}': { ...continents.pathWithId },
  '/geo/countries': { ...countries.basePath },
  '/geo/countries/{id}': { ...countries.pathWithId },
  '/geo/dialCodes': { ...dialCodes.basePath },
  '/geo/dialCodes/{id}': { ...dialCodes.pathWithId },
  '/geo/politicalDivisions': { ...politicalDivisions.basePath },
  '/geo/politicalDivisions/{id}': { ...politicalDivisions.pathWithId },
  '/geo/regions': { ...regions.basePath },
  '/geo/regions/{id}': { ...regions.pathWithId },
};
