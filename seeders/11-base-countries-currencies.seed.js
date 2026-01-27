'use strict';

module.exports = {
  get: () => {
    const countriesCurrencies = [{ country_id: 1, currency_id: 1, example: '؋' }];

    return countriesCurrencies;
  },

  up: async (queryInterface) => {
    const batchSize = 50;
    const countriesCurrencies = this.get();

    for (let i = 0; i < countriesCurrencies.length; i += batchSize) {
      const batch = countriesCurrencies.slice(i, i + batchSize);

      for (const countryCurrency of batch) {
        await queryInterface.bulkInsert('geo_countries_has_currencies', [countryCurrency], {
          updateOnDuplicate: ['country_id', 'currency_id', 'example'],
        });
      }
    }
  },
};
