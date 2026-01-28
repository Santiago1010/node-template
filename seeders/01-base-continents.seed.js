'use strict';

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
  },
];

module.exports = {
  up: async (queryInterface) => {
    for (const continent of continents) {
      await queryInterface.bulkInsert('geo_continents', [continent], {
        updateOnDuplicate: ['name', 'abbreviation'],
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('geo_continents', null, {});
  },
};
