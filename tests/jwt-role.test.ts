import jwt from 'jsonwebtoken';
import { generateAccessToken } from '../src/utils/jwt';

describe('JWT Role Field Tests', () => {
  // Mock JWT payload generation to test role extraction logic (mirrors token.service.ts)
  const generateJWTPayloadWithRole = (user: any) => {
    const userPermissions = user.isSuperAdmin
      ? ['*']
      : [...new Set(user.resourceRoles?.flatMap((role: any) => role.role.permissions?.map((p: any) => p.name) || []) || [])];

    const primaryRole = user.isSuperAdmin
      ? 'Super Admin'
      : (user.resourceRoles?.find((role: any) => role.resourceId === null)?.role.name ||
        user.resourceRoles?.[0]?.role.name ||
        'User');

    return {
      userId: user.id,
      isSuperAdmin: user.isSuperAdmin,
      permissions: userPermissions,
      role: primaryRole,
      username: user.email // Add username field using user email
    };
  };

  describe('Role Extraction Logic Tests', () => {
    it('should include "User" role for user with no assigned roles', () => {
      const mockUser = {
        id: 'test-user-1',
        email: 'test-user-1@example.com',
        isSuperAdmin: false,
        resourceRoles: []
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('User');
      expect(decoded.userId).toBe('test-user-1');
      expect(decoded.isSuperAdmin).toBe(false);
      expect(decoded.permissions).toEqual([]);
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('test-user-1@example.com');
    });

    it('should include first role name for user with single role', () => {
      const mockUser = {
        id: 'test-user-2',
        email: 'test-user-2@example.com',
        isSuperAdmin: false,
        resourceRoles: [
          {
            resourceId: 'resource-1',
            role: {
              name: 'Manager',
              permissions: [
                { name: 'read_users' },
                { name: 'write_users' }
              ]
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('Manager');
      expect(decoded.userId).toBe('test-user-2');
      expect(decoded.isSuperAdmin).toBe(false);
      expect(decoded.permissions).toEqual(['read_users', 'write_users']);
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('test-user-2@example.com');
    });

    it('should prioritize global role over resource-specific role', () => {
      const mockUser = {
        id: 'test-user-3',
        email: 'test-user-3@example.com',
        isSuperAdmin: false,
        resourceRoles: [
          {
            resourceId: 'resource-1',
            role: {
              name: 'Editor',
              permissions: [{ name: 'edit_content' }]
            }
          },
          {
            resourceId: null, // Global role
            role: {
              name: 'Admin',
              permissions: [
                { name: 'read_users' },
                { name: 'write_users' }
              ]
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('Admin'); // Should prioritize global role
      expect(decoded.userId).toBe('test-user-3');
      expect(decoded.isSuperAdmin).toBe(false);
      expect(decoded.permissions).toEqual(['edit_content', 'read_users', 'write_users']);
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('test-user-3@example.com');
    });

    it('should use first role when multiple resource-specific roles exist', () => {
      const mockUser = {
        id: 'test-user-4',
        email: 'test-user-4@example.com',
        isSuperAdmin: false,
        resourceRoles: [
          {
            resourceId: 'resource-1',
            role: {
              name: 'Viewer',
              permissions: [{ name: 'read_content' }]
            }
          },
          {
            resourceId: 'resource-2',
            role: {
              name: 'Editor',
              permissions: [{ name: 'edit_content' }]
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('Viewer'); // Should use first role
      expect(decoded.userId).toBe('test-user-4');
      expect(decoded.isSuperAdmin).toBe(false);
      expect(decoded.permissions).toEqual(['read_content', 'edit_content']);
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('test-user-4@example.com');
    });

    it('should include "Super Admin" role for super admin user', () => {
      const mockSuperAdmin = {
        id: 'super-admin-1',
        email: 'super-admin-1@example.com',
        isSuperAdmin: true,
        resourceRoles: [
          {
            resourceId: null,
            role: {
              name: 'Some Other Role',
              permissions: [{ name: 'some_permission' }]
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockSuperAdmin);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('Super Admin'); // Should override any assigned roles
      expect(decoded.userId).toBe('super-admin-1');
      expect(decoded.isSuperAdmin).toBe(true);
      expect(decoded.permissions).toEqual(['*']); // Super admin has all permissions
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('super-admin-1@example.com');
    });

    it('should extract unique permissions from multiple roles', () => {
      const mockUser = {
        id: 'test-permissions',
        email: 'test-permissions@example.com',
        isSuperAdmin: false,
        resourceRoles: [
          {
            resourceId: 'resource-1',
            role: {
              name: 'Role1',
              permissions: [
                { name: 'read_users' },
                { name: 'write_users' }
              ]
            }
          },
          {
            resourceId: 'resource-2',
            role: {
              name: 'Role2',
              permissions: [
                { name: 'read_users' }, // Duplicate
                { name: 'delete_users' }
              ]
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded.permissions).toHaveLength(3);
      expect(decoded.permissions).toContain('read_users');
      expect(decoded.permissions).toContain('write_users');
      expect(decoded.permissions).toContain('delete_users');
      expect(decoded.role).toBe('Role1'); // First role
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('test-permissions@example.com');
    });

    it('should handle null/undefined role name by defaulting to User', () => {
      const mockUser = {
        id: 'test-null-role',
        email: 'test-null-role@example.com',
        isSuperAdmin: false,
        resourceRoles: [
          {
            resourceId: 'resource-1',
            role: {
              name: null, // Null role name
              permissions: []
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('User'); // Null/undefined falls back to 'User'
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('test-null-role@example.com');
    });

    it('should handle complex role names with special characters', () => {
      const mockUser = {
        id: 'test-special-chars',
        email: 'test-special-chars@example.com',
        isSuperAdmin: false,
        resourceRoles: [
          {
            resourceId: null,
            role: {
              name: 'Project Manager - Level 2 (Senior)',
              permissions: [{ name: 'manage_projects' }]
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('Project Manager - Level 2 (Senior)');
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe('test-special-chars@example.com');
    });

    it('should contain all required JWT payload fields', () => {
      const mockUser = {
        id: 'test-structure-user',
        email: 'test-structure-user@example.com',
        isSuperAdmin: false,
        resourceRoles: [
          {
            resourceId: null,
            role: {
              name: 'Tester',
              permissions: [
                { name: 'test_permission_1' },
                { name: 'test_permission_2' }
              ]
            }
          }
        ]
      };

      const payload = generateJWTPayloadWithRole(mockUser);
      const accessToken = generateAccessToken(payload);
      const decoded = jwt.decode(accessToken) as any;

      // Verify all required fields are present
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('isSuperAdmin');
      expect(decoded).toHaveProperty('permissions');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('iat'); // JWT issued at
      expect(decoded).toHaveProperty('exp'); // JWT expiration

      // Verify field types and values
      expect(typeof decoded.userId).toBe('string');
      expect(typeof decoded.isSuperAdmin).toBe('boolean');
      expect(Array.isArray(decoded.permissions)).toBe(true);
      expect(typeof decoded.role).toBe('string');
      expect(typeof decoded.username).toBe('string');
      expect(decoded.userId).toBe('test-structure-user');
      expect(decoded.isSuperAdmin).toBe(false);
      expect(decoded.role).toBe('Tester');
      expect(decoded.username).toBe('test-structure-user@example.com');
      expect(decoded.permissions).toEqual(['test_permission_1', 'test_permission_2']);
    });
  });
});