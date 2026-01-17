'use strict';

module.exports = {
  get: () => {
    const continents = [
      {
        id: 1,
        name: JSON.stringify({
          en: 'Africa',
          de: 'Afrika',
          it: 'Africa',
          ja: 'アフリカ',
          ko: '아프리카',
          zh: '非洲',
          pt: 'África',
          ru: 'Африка',
          es: 'África',
          fr: 'Afrique',
        }),
        abbreviation: 'AFR',
        surface_area: 30370000,
      },
      {
        id: 2,
        name: JSON.stringify({
          en: 'America',
          de: 'Amerika',
          it: 'America',
          ja: 'アメリカ',
          ko: '아메리카',
          zh: '美洲',
          pt: 'América',
          ru: 'Америка',
          es: 'América',
          fr: 'Amérique',
        }),
        abbreviation: 'AME',
        surface_area: 43072780,
      },
      {
        id: 3,
        name: JSON.stringify({
          en: 'Antarctica',
          de: 'Antarktis',
          it: 'Antartide',
          ja: '南極',
          ko: '남극 대륙',
          zh: '南极洲',
          pt: 'Antártida',
          ru: 'Антарктида',
          es: 'Antártida',
          fr: 'Antarctique',
        }),
        abbreviation: 'ANT',
        surface_area: 14000000,
      },
      {
        id: 4,
        name: JSON.stringify({
          en: 'Asia',
          de: 'Asien',
          it: 'Asia',
          ja: 'アジア',
          ko: '아시아',
          zh: '亚洲',
          pt: 'Ásia',
          ru: 'Азия',
          es: 'Asia',
          fr: 'Asie',
        }),
        abbreviation: 'ASI',
        surface_area: 44580000,
      },
      {
        id: 5,
        name: JSON.stringify({
          en: 'Europe',
          de: 'Europa',
          it: 'Europa',
          ja: 'ヨーロッパ',
          ko: '유럽',
          zh: '欧洲',
          pt: 'Europa',
          ru: 'Европа',
          es: 'Europa',
          fr: 'Europe',
        }),
        abbreviation: 'EUR',
        surface_area: 10180000,
      },
      {
        id: 6,
        name: JSON.stringify({
          en: 'Oceania',
          de: 'Ozeanien',
          it: 'Oceania',
          ja: 'オセアニア',
          ko: '오세아니아',
          zh: '大洋洲',
          pt: 'Oceania',
          ru: 'Океания',
          es: 'Oceanía',
          fr: 'Océanie',
        }),
        abbreviation: 'OCE',
        surface_area: 8530000,
      },
    ];

    return continents;
  },

  up: async (queryInterface) => {
    for (const continent of this.get()) {
      await queryInterface.bulkInsert('geo_continents', [continent], {
        updateOnDuplicate: ['name', 'abbreviation', 'surface_area'],
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('geo_continents', null, {});
  },
};
