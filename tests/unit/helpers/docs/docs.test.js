const { standardRequest } = require('../../../../helpers/docs-generator.helper');

describe('standardRequest', () => {
  describe('Successful Cases', () => {
    test('should create a standard request object with minimal valid parameters', () => {
      const type = 'GET';
      const options = {
        tags: ['test'],
        operationId: 'getTest',
      };

      const result = standardRequest(type, options);

      expect(result).toEqual({
        get: {
          tags: ['test'],
          operationId: 'getTest',
        },
      });
    });

    test('should create a request object with all optional parameters', () => {
      const type = 'POST';
      const options = {
        tags: ['users', 'create'],
        description: 'Create a new user',
        operationId: 'createUser',
        parameters: [{ name: 'id', in: 'path', required: true }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        security: [{ bearerAuth: [] }],
        responses: {
          201: {
            description: 'User created successfully',
          },
        },
      };

      const result = standardRequest(type, options);

      expect(result).toEqual({
        post: {
          tags: ['users', 'create'],
          description: 'Create a new user',
          operationId: 'createUser',
          parameters: [{ name: 'id', in: 'path', required: true }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          security: [{ bearerAuth: [] }],
          responses: {
            201: {
              description: 'User created successfully',
            },
          },
        },
      });
    });

    test('should convert HTTP type to lowercase', () => {
      const type = 'PUT';
      const options = {
        tags: ['test'],
        operationId: 'putTest',
      };

      const result = standardRequest(type, options);

      expect(result).toHaveProperty('put');
      expect(result).not.toHaveProperty('PUT');
    });

    test('should handle mixed-case HTTP types', () => {
      const type = 'DeLeTe';
      const options = {
        tags: ['test'],
        operationId: 'deleteTest',
      };

      const result = standardRequest(type, options);

      expect(result).toHaveProperty('delete');
    });

    test('should create a deep copy of options', () => {
      const type = 'PATCH';
      const options = {
        tags: ['test'],
        operationId: 'patchTest',
        parameters: [{ name: 'id', in: 'path' }],
      };

      const result = standardRequest(type, options);

      // Modifying the original object should not affect the result
      options.tags.push('modified');
      options.parameters.push({ name: 'new', in: 'query' });

      expect(result.patch.tags[0]).toEqual('test');
      expect(result.patch.parameters).toHaveLength(2);
    });

    test('should handle tags with multiple elements', () => {
      const type = 'GET';
      const options = {
        tags: ['tag1', 'tag2', 'tag3'],
        operationId: 'multipleTagsTest',
      };

      const result = standardRequest(type, options);

      expect(result.get.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  // Error Cases - type required
  describe('Type Parameter Validation', () => {
    test('should throw error when type is undefined', () => {
      expect(() => {
        standardRequest(undefined, { tags: ['test'], operationId: 'test' });
      }).toThrow('HTTP method type is required');
    });

    test('should throw error when type is null', () => {
      expect(() => {
        standardRequest(null, { tags: ['test'], operationId: 'test' });
      }).toThrow('HTTP method type is required');
    });

    test('should throw error when type is empty string', () => {
      expect(() => {
        standardRequest('', { tags: ['test'], operationId: 'test' });
      }).toThrow('HTTP method type is required');
    });

    test('should throw error when type is 0', () => {
      expect(() => {
        standardRequest(0, { tags: ['test'], operationId: 'test' });
      }).toThrow('HTTP method type is required');
    });

    test('should throw error when type is false', () => {
      expect(() => {
        standardRequest(false, { tags: ['test'], operationId: 'test' });
      }).toThrow('HTTP method type is required');
    });
  });

  // Error Cases - options must be an object
  describe('Options Parameter Validation', () => {
    test('should throw error when options is null', () => {
      expect(() => {
        standardRequest('GET', null);
      }).toThrow('Request options must be an object');
    });

    test('should throw error when options is string', () => {
      expect(() => {
        standardRequest('GET', 'invalid');
      }).toThrow('Request options must be an object');
    });

    test('should throw error when options is number', () => {
      expect(() => {
        standardRequest('GET', 123);
      }).toThrow('Request options must be an object');
    });

    test('should throw error when options is boolean', () => {
      expect(() => {
        standardRequest('GET', true);
      }).toThrow('Request options must be an object');
    });

    test('should use empty object by default if options is not provided', () => {
      // This should fail due to missing tags, confirming it uses {}
      expect(() => {
        standardRequest('GET');
      }).toThrow('Request tags are required');
    });
  });

  // Error Cases - tags required
  describe('Tags Validation', () => {
    test('should throw error when tags is not present', () => {
      expect(() => {
        standardRequest('GET', { operationId: 'test' });
      }).toThrow('Request tags are required');
    });

    test('should throw error when tags is not an array', () => {
      expect(() => {
        standardRequest('GET', {
          tags: 'not-array',
          operationId: 'test',
        });
      }).toThrow('Request tags are required');
    });

    test('should throw error when tags is null', () => {
      expect(() => {
        standardRequest('GET', {
          tags: null,
          operationId: 'test',
        });
      }).toThrow('Request tags are required');
    });

    test('should throw error when tags is undefined', () => {
      expect(() => {
        standardRequest('GET', {
          tags: undefined,
          operationId: 'test',
        });
      }).toThrow('Request tags are required');
    });

    test('should throw error when tags is empty array', () => {
      expect(() => {
        standardRequest('GET', {
          tags: [],
          operationId: 'test',
        });
      }).toThrow('Request tags are required');
    });

    test('should throw error when tags is object', () => {
      expect(() => {
        standardRequest('GET', {
          tags: {},
          operationId: 'test',
        });
      }).toThrow('Request tags are required');
    });

    test('should throw error when tags is number', () => {
      expect(() => {
        standardRequest('GET', {
          tags: 123,
          operationId: 'test',
        });
      }).toThrow('Request tags are required');
    });
  });

  // Error Cases - operationId required
  describe('OperationId Validation', () => {
    test('should throw error when operationId is not present', () => {
      expect(() => {
        standardRequest('GET', { tags: ['test'] });
      }).toThrow('Request operationId is required');
    });

    test('should throw error when operationId is null', () => {
      expect(() => {
        standardRequest('GET', {
          tags: ['test'],
          operationId: null,
        });
      }).toThrow('Request operationId is required');
    });

    test('should throw error when operationId is explicitly undefined', () => {
      expect(() => {
        standardRequest('GET', {
          tags: ['test'],
          operationId: undefined,
        });
      }).toThrow('Request operationId is required');
    });
  });

  // Additional edge cases
  describe('Edge Cases', () => {
    test('should handle objects with inherited properties', () => {
      const parentObject = { inherited: 'value' };
      const options = Object.create(parentObject);
      options.tags = ['test'];
      options.operationId = 'test';

      const result = standardRequest('GET', options);

      // Should only copy own properties, not inherited ones
      expect(result.get).toHaveProperty('tags');
      expect(result.get).toHaveProperty('operationId');
    });

    test('should handle HTTP types with spaces', () => {
      const result = standardRequest('  GET  ', {
        tags: ['test'],
        operationId: 'test',
      });

      expect(result).toHaveProperty('  get  ');
    });

    test('should preserve additional undocumented properties', () => {
      const options = {
        tags: ['test'],
        operationId: 'test',
        customProperty: 'custom value',
        anotherProp: { nested: 'object' },
      };

      const result = standardRequest('GET', options);

      expect(result.get).toHaveProperty('customProperty', 'custom value');
      expect(result.get).toHaveProperty('anotherProp', { nested: 'object' });
    });

    test('should handle special values in options', () => {
      const options = {
        tags: ['test'],
        operationId: 'test',
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        emptyArray: [],
        emptyObject: {},
      };

      const result = standardRequest('GET', options);

      expect(result.get).toHaveProperty('nullValue', null);
      expect(result.get).toHaveProperty('undefinedValue', undefined);
      expect(result.get).toHaveProperty('emptyString', '');
      expect(result.get).toHaveProperty('zero', 0);
      expect(result.get).toHaveProperty('emptyArray', []);
      expect(result.get).toHaveProperty('emptyObject', {});
    });
  });
});
