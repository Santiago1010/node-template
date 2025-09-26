const config = require('../../config/env');

const setReference = (required, description, tag, operationId) => {
  if (required === null || description === null || tag === null || operationId === null) {
    throw new Error('setReference() was called with a null argument');
  }

  let reference = '';

  if (typeof required !== 'boolean') {
    throw new Error('The required parameter for setReference() must be a boolean');
  }

  if (typeof description !== 'string') {
    throw new Error('The description parameter for setReference() must be a string');
  }

  if (typeof tag !== 'string') {
    throw new Error('The tag parameter for setReference() must be a string');
  }

  if (typeof operationId !== 'string') {
    throw new Error('The operationId parameter for setReference() must be a string');
  }

  reference += required ? '**[Required]** ' : '**[Optional]** ';

  reference += description + ' ';

  reference += 'You can get a reference of the IDs available for this field at ';

  let link = config.url + '/api/docs/#/' + tag + '/' + operationId;

  reference += '[' + link + '](' + link + ' "' + link + '")' + '.';

  return reference;
};

module.exports = { setReference };
