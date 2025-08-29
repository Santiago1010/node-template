// =============================================================================
// ERROR HANDLING - UNIT TESTS
// =============================================================================

const numbersHelper = require('../../../../helpers/numbers.helper');
const { cerror } = require('../../../../helpers/debug.helper');

// Mock the debug helper
jest.mock('../../../../helpers/debug.helper', () => ({
  cerror: jest.fn(),
}));

describe('Error Handling Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatNumberToCurrency', () => {
    test('should handle formatting errors gracefully', () => {
      expect(numbersHelper.formatNumberToCurrency(123, 'INVALID')).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Format currency', 'Formatting error: Invalid currency code : INVALID');
    });
  });

  describe('formatNumberWithCommas', () => {
    test('should handle formatting errors gracefully', () => {
      const originalNumberFormat = global.Intl.NumberFormat;
      global.Intl.NumberFormat = jest.fn(() => ({
        format: () => {
          throw new Error('mock error');
        },
      }));
      expect(numbersHelper.formatNumberWithCommas(123)).toBeNull();
      expect(cerror).toHaveBeenCalledWith('Format with commas', 'Formatting error: mock error');
      global.Intl.NumberFormat = originalNumberFormat;
    });
  });
});
