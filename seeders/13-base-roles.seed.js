'use strict';

const roles = [
  {
    id: 1,
    name: 'admin',
    target: 'employee',
    is_default: false,
  },
  {
    id: 2,
    name: 'technical_support',
    target: 'employee',
    is_default: false,
  },
  {
    id: 3,
    name: 'customer',
    target: 'customer',
    is_default: true,
  },
];

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('config_roles', roles, {
      updateOnDuplicate: ['name', 'target', 'is_default'],
    });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('config_roles', {
      id: roles.map((role) => role.id),
    });
  },
};
