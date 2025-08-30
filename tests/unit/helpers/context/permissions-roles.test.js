// =============================================================================
// PERMISSIONS AND ROLES - UNIT TESTS
// =============================================================================

const contextHelper = require('../../../../helpers/context.helper');
const asyncLocalStorage = require('../../../../config/context');
const { CONTEXT_KEYS } = require('../../../../helpers/constants.helper');

// Mock the asyncLocalStorage
jest.mock('../../../../config/context', () => ({
  getStore: jest.fn(),
}));

// Mock constants
jest.mock('../../../../helpers/constants.helper', () => ({
  CONTEXT_KEYS: {
    PERMISSIONS: 'permissions',
    ROLES: 'roles',
  },
  MODES: {
    PRODUCTION: 4,
    DEVELOPMENT: 2,
    TEST: 1,
    LOCAL: 0,
  },
}));

describe('Permission and Role Management', () => {
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = {
      [CONTEXT_KEYS.PERMISSIONS]: ['read', 'write', 'comment'],
      [CONTEXT_KEYS.ROLES]: ['admin', 'editor', 'viewer'],
    };
    asyncLocalStorage.getStore.mockReturnValue(mockStore);
  });

  describe('Permission Checks', () => {
    describe('hasPermission', () => {
      it('should return true if user has the permission', () => {
        expect(contextHelper.hasPermission('read')).toBe(true);
      });
      it('should return false if user does not have the permission', () => {
        expect(contextHelper.hasPermission('delete')).toBe(false);
      });
    });

    describe('hasAnyPermission', () => {
      it('should return true if user has at least one of the permissions', () => {
        expect(contextHelper.hasAnyPermission(['delete', 'write'])).toBe(true);
      });
      it('should return false if user has none of the permissions', () => {
        expect(contextHelper.hasAnyPermission(['delete', 'publish'])).toBe(false);
      });
    });

    describe('hasAllPermissions', () => {
      it('should return true if user has all of the permissions', () => {
        expect(contextHelper.hasAllPermissions(['read', 'write'])).toBe(true);
      });
      it('should return false if user does not have all of the permissions', () => {
        expect(contextHelper.hasAllPermissions(['read', 'delete'])).toBe(false);
      });
    });
  });

  describe('Role Checks', () => {
    describe('hasRole', () => {
      it('should return true if user has the role', () => {
        expect(contextHelper.hasRole('admin')).toBe(true);
      });
      it('should return false if user does not have the role', () => {
        expect(contextHelper.hasRole('moderator')).toBe(false);
      });
    });

    describe('hasAnyRole', () => {
      it('should return true if user has at least one of the roles', () => {
        expect(contextHelper.hasAnyRole(['moderator', 'editor'])).toBe(true);
      });
      it('should return false if user has none of the roles', () => {
        expect(contextHelper.hasAnyRole(['moderator', 'superuser'])).toBe(false);
      });
    });
  });

  describe('Permission Management', () => {
    describe('addPermission', () => {
      it('should add a new permission', () => {
        contextHelper.addPermission('delete');
        expect(mockStore[CONTEXT_KEYS.PERMISSIONS]).toContain('delete');
      });
      it('should not add a duplicate permission', () => {
        const initialPermissions = [...mockStore[CONTEXT_KEYS.PERMISSIONS]];
        contextHelper.addPermission('read');
        expect(mockStore[CONTEXT_KEYS.PERMISSIONS]).toEqual(initialPermissions);
      });
    });

    describe('removePermission', () => {
      it('should remove an existing permission', () => {
        contextHelper.removePermission('write');
        expect(mockStore[CONTEXT_KEYS.PERMISSIONS]).not.toContain('write');
      });
      it('should not fail when removing a non-existing permission', () => {
        const initialPermissions = [...mockStore[CONTEXT_KEYS.PERMISSIONS]];
        contextHelper.removePermission('delete');
        expect(mockStore[CONTEXT_KEYS.PERMISSIONS]).toEqual(initialPermissions);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty permission/role arrays in context', () => {
      mockStore[CONTEXT_KEYS.PERMISSIONS] = [];
      mockStore[CONTEXT_KEYS.ROLES] = [];
      expect(contextHelper.hasPermission('read')).toBe(false);
      expect(contextHelper.hasRole('admin')).toBe(false);
    });

    it('should handle undefined permission/role arrays in context', () => {
      delete mockStore[CONTEXT_KEYS.PERMISSIONS];
      delete mockStore[CONTEXT_KEYS.ROLES];
      // getCurrentPermissions/Roles should return default empty array
      expect(contextHelper.hasPermission('read')).toBe(false);
      expect(contextHelper.hasRole('admin')).toBe(false);
    });
  });
});
