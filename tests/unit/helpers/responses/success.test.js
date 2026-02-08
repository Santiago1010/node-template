const i18n = require('../../../../config/i18n');
const { success } = require('../../../../helpers/response.helper');

describe('success', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  test('should send a response with the correct HTTP status code and message', () => {
    const messagePath = 'response.message';
    const messageData = { name: 'John' };
    const data = { id: 1 };

    success(res, { httpCode: 201, messagePath, messageData, data });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: i18n.__mf(messagePath, messageData),
      ...data,
    });
  });

  test('should use the default HTTP status code if not provided', () => {
    const messagePath = 'response.message';
    const messageData = { name: 'John' };
    const data = { id: 1 };

    success(res, { messagePath, messageData, data });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: i18n.__mf(messagePath, messageData),
      ...data,
    });
  });

  test('should handle missing messagePath', () => {
    const messageData = { name: 'John' };
    const data = { id: 1 };

    success(res, { httpCode: 201, messageData, data });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ...data,
    });
  });

  test('should handle missing messageData', () => {
    const messagePath = 'response.message';
    const data = { id: 1 };

    success(res, { httpCode: 201, messagePath, data });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: i18n.__mf(messagePath, undefined),
      ...data,
    });
  });

  test('should handle missing data parameter', () => {
    const messagePath = 'response.message';
    const messageData = { name: 'John' };

    success(res, { httpCode: 200, messagePath, messageData });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: i18n.__mf(messagePath, messageData),
    });
  });

  test('should handle empty data object', () => {
    const messagePath = 'response.message';
    const messageData = { name: 'John' };
    const data = {};

    success(res, { httpCode: 200, messagePath, messageData, data });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: i18n.__mf(messagePath, messageData),
    });
  });

  test('should spread multiple properties from data object', () => {
    const messagePath = 'response.message';
    const messageData = { name: 'John' };
    const data = { id: 1, name: 'Test', active: true };

    success(res, { httpCode: 200, messagePath, messageData, data });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: i18n.__mf(messagePath, messageData),
      id: 1,
      name: 'Test',
      active: true,
    });
  });

  test('should return the response object for chaining', async () => {
    const messagePath = 'response.message';
    const messageData = { name: 'John' };
    const data = { id: 1 };

    const result = await success(res, { httpCode: 200, messagePath, messageData, data });

    expect(result).toBe(res);
  });

  test('should handle response without messagePath and without data', () => {
    success(res, { httpCode: 204 });

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({});
  });

  test('should handle response with only data and no message', () => {
    const data = { id: 1, active: true };

    success(res, { data });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      active: true,
    });
  });

  test('should handle messagePath with empty string', () => {
    const messagePath = '';
    const data = { id: 1 };

    success(res, { messagePath, data });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ...data,
    });
  });

  test('should handle messageData without messagePath', () => {
    const messageData = { name: 'John' };

    success(res, { messageData });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({});
  });
});
