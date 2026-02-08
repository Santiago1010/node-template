const cities = require('./cities.docs');
const continents = require('./continents.docs');
const countries = require('./countries.docs');
const dialCodes = require('./dialCodes.docs');
const politicalDivisions = require('./politicalDivisions.docs');
const regions = require('./regions.docs');

module.exports = {
  '/geographic/cities': { ...cities.basePath },
  '/geographic/cities/{id}': { ...cities.pathWithId },
  '/geographic/continents': { ...continents.basePath },
  '/geographic/continents/{id}': { ...continents.pathWithId },
  '/geographic/countries': { ...countries.basePath },
  '/geographic/countries/{id}': { ...countries.pathWithId },
  '/geographic/dialCodes': { ...dialCodes.basePath },
  '/geographic/dialCodes/{id}': { ...dialCodes.pathWithId },
  '/geographic/politicalDivisions': { ...politicalDivisions.basePath },
  '/geographic/politicalDivisions/{id}': { ...politicalDivisions.pathWithId },
  '/geographic/regions': { ...regions.basePath },
  '/geographic/regions/{id}': { ...regions.pathWithId },
};
