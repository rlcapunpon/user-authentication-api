import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('Extended Permissions Tests', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;
  let testResourceId: string;
  let globalResourceId: string;

  const testEmail = 'testuser-extended@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin-extended@example.com';
  const adminPassword = 'adminpassword123';

  beforeAll(async () => {
    // Clear test data
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});

    // Create regular test user
    const hashedPassword = await hashPassword(testPassword);
    const testUser = await (prisma as any).user.create({
      data: {
        email: testEmail,
        isActive: true,
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    testUserId = testUser.id;
    testUserToken = generateAccessToken({ 
      userId: testUserId, 
      isSuperAdmin: false,
      permissions: ['user:read'] 
    });

    // Create admin test user
    const adminHashedPassword = await hashPassword(adminPassword);
    const adminUser = await (prisma as any).user.create({
      data: {
        email: adminEmail,
        isActive: true,
        isSuperAdmin: true,
        credential: {
          create: {
            passwordHash: adminHashedPassword,
          },
        },
      },
    });
    adminUserId = adminUser.id;
    adminUserToken = generateAccessToken({ 
      userId: adminUserId, 
      isSuperAdmin: true,
      permissions: ['*'] 
    });

    // Create test resources
    const testResource = await (prisma as any).resource.create({
      data: {
        name: 'Test Resource Extended',
        description: 'Resource for extended testing',
      },
    });
    testResourceId = testResource.id;

    const globalResource = await (prisma as any).resource.create({
      data: {
        name: 'Global Test Resource',
        description: 'Resource for global permission testing',
      },
    });
    globalResourceId = globalResource.id;
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/permissions/check - Edge Cases', () => {
    it('should handle empty string fields validation', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: '',
          permission: '',
          resourceId: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('userId is required');
    });

    it('should handle null values in request body', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: null,
          permission: null,
          resourceId: null,
        });

      expect(response.status).toBe(400);
      // Null values should be treated as invalid input for string fields
      expect(response.body.message).toContain('Invalid input: expected string, received null');
    });

    it('should handle whitespace-only strings', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: '   ',
          permission: '   ',
          resourceId: '   ',
        });

      // Whitespace-only strings will pass validation but fail when looking up user
      // since they're technically valid strings but invalid UUIDs
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle very long permission strings', async () => {
      const longPermission = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: longPermission,
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', false);
      expect(response.body).toHaveProperty('checkedPermission', longPermission);
    });

    it('should handle special characters in permission names', async () => {
      const specialPermission = 'resource:read/write@special#permission!';
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: specialPermission,
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', false);
      expect(response.body).toHaveProperty('checkedPermission', specialPermission);
    });

    it('should handle inactive user lookup', async () => {
      // Create an inactive user
      const inactiveUser = await (prisma as any).user.create({
        data: {
          email: 'inactive@example.com',
          isActive: false,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: await hashPassword('password'),
            },
          },
        },
      });

      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: inactiveUser.id,
          permission: 'resource:read',
          resourceId: testResourceId,
        });

      // Should return user permissions regardless of active status
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', false);
      expect(response.body).toHaveProperty('userPermissions', []);
    });

    it('should handle user with multiple overlapping permissions', async () => {
      // Create multiple roles with overlapping permissions
      const role1 = await (prisma as any).role.create({
        data: {
          name: 'Role 1 Extended',
          permissions: ['resource:read', 'resource:write'],
        },
      });

      const role2 = await (prisma as any).role.create({
        data: {
          name: 'Role 2 Extended',
          permissions: ['resource:read', 'resource:delete'], // Overlapping read permission
        },
      });

      // Assign both roles to the user
      await (prisma as any).userResourceRole.createMany({
        data: [
          {
            userId: testUserId,
            roleId: role1.id,
            resourceId: testResourceId,
          },
          {
            userId: testUserId,
            roleId: role2.id,
            resourceId: testResourceId,
          },
        ],
      });

      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: 'resource:read',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', true);
      // Should not have duplicate permissions
      const permissions = response.body.userPermissions;
      const uniquePermissions = [...new Set(permissions)];
      expect(permissions.length).toBe(uniquePermissions.length);
      expect(permissions).toContain('resource:read');
      expect(permissions).toContain('resource:write');
      expect(permissions).toContain('resource:delete');
    });

    it('should handle wildcard permissions correctly', async () => {
      // Create a role with wildcard permission
      const wildcardRole = await (prisma as any).role.create({
        data: {
          name: 'Wildcard Role',
          permissions: ['*'],
        },
      });

      await (prisma as any).userResourceRole.create({
        data: {
          userId: testUserId,
          roleId: wildcardRole.id,
          resourceId: testResourceId,
        },
      });

      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: 'any:permission',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', true);
      expect(response.body.userPermissions).toContain('*');
    });

    it('should handle resource inheritance (global vs specific)', async () => {
      // Create a global role
      const globalRole = await (prisma as any).role.create({
        data: {
          name: 'Global Role Extended',
          permissions: ['global:permission'],
        },
      });

      // Assign global role (resourceId: null)
      await (prisma as any).userResourceRole.create({
        data: {
          userId: testUserId,
          roleId: globalRole.id,
          resourceId: null,
        },
      });

      // Check if global permission works for specific resource
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: 'global:permission',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', true);
      expect(response.body.userPermissions).toContain('global:permission');
    });

    it('should validate response structure for successful permission check', async () => {
      const role = await (prisma as any).role.create({
        data: {
          name: 'Structure Test Role',
          permissions: ['structure:test'],
        },
      });

      await (prisma as any).userResourceRole.create({
        data: {
          userId: testUserId,
          roleId: role.id,
          resourceId: testResourceId,
        },
      });

      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: 'structure:test',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasPermission: true,
        userPermissions: expect.arrayContaining(['structure:test']),
        checkedPermission: 'structure:test',
        resourceId: testResourceId,
      });

      // Ensure no extra properties
      const expectedKeys = ['hasPermission', 'userPermissions', 'checkedPermission', 'resourceId'];
      expect(Object.keys(response.body).sort()).toEqual(expectedKeys.sort());
    });

    it('should validate response structure for super admin', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: adminUserId,
          permission: 'any:permission',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        hasPermission: true,
        reason: 'super_admin',
        checkedPermission: 'any:permission',
        resourceId: testResourceId,
        userPermissions: ['*'],
      });
    });

    it('should handle concurrent permission checks', async () => {
      const role = await (prisma as any).role.create({
        data: {
          name: 'Concurrent Test Role',
          permissions: ['concurrent:test'],
        },
      });

      await (prisma as any).userResourceRole.create({
        data: {
          userId: testUserId,
          roleId: role.id,
          resourceId: testResourceId,
        },
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/permissions/check')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            userId: testUserId,
            permission: 'concurrent:test',
            resourceId: testResourceId,
          })
      );

      const responses = await Promise.all(promises);

      // All requests should succeed with same result
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('hasPermission', true);
        expect(response.body.userPermissions).toContain('concurrent:test');
      });
    });
  });
});