import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('Permissions Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;

  const testEmail = 'testuser-permissions@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin-permissions@example.com';
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
      permissions: ['permission:read'] // Test user has permission:read
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
      permissions: ['*'] // Admin has all permissions
    });

    // Create role with read_permissions
    const readPermissionsRole = await (prisma as any).role.create({
      data: {
        name: 'Read Permissions Role',
        description: 'Role with read_permissions',
        permissions: ['permission:read'],
      },
    });

    // Assign read_permissions role to test user
    await (prisma as any).userResourceRole.create({
      data: {
        userId: testUserId,
        roleId: readPermissionsRole.id,
        resourceId: null, // Global role
      },
    });
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

  describe('GET /api/permissions', () => {
    it('should return all available permissions for authenticated user', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check that expected permissions are included
      const expectedPermissions = [
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'role:read',
        'role:create',
        'resource:read',
        'resource:create',
        'permission:read',
        'role:assign'
      ];

      expectedPermissions.forEach(permission => {
        expect(response.body).toContain(permission);
      });
    });

    it('should return the same permissions for admin user', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Admin should see the same permissions as regular user
      const regularUserResponse = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.body).toEqual(regularUserResponse.body);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/permissions');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return permissions in consistent order', async () => {
      const response1 = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${testUserToken}`);

      const response2 = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('Permissions Content Validation', () => {
    it('should include all expected permission types', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);

      const permissions = response.body;

      // Check for user-related permissions
      expect(permissions).toContain('user:read');
      expect(permissions).toContain('user:create');
      expect(permissions).toContain('user:update');
      expect(permissions).toContain('user:delete');

      // Check for role-related permissions
      expect(permissions).toContain('role:read');
      expect(permissions).toContain('role:create');

      // Check for resource-related permissions
      expect(permissions).toContain('resource:read');
      expect(permissions).toContain('resource:create');

      // Check for general permissions
      expect(permissions).toContain('permission:read');
      expect(permissions).toContain('role:assign');
    });

    it('should return permissions as strings', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);

      // All permissions should be strings
      response.body.forEach((permission: any) => {
        expect(typeof permission).toBe('string');
        expect(permission.length).toBeGreaterThan(0);
      });
    });

    it('should not return duplicate permissions', async () => {
      const response = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);

      const permissions = response.body;
      const uniquePermissions = [...new Set(permissions)];

      expect(permissions.length).toBe(uniquePermissions.length);
    });
  });

  describe('POST /api/permissions/check', () => {
    let testResourceId: string;
    let testRoleId: string;

    beforeAll(async () => {
      // Create a test resource
      const testResource = await (prisma as any).resource.create({
        data: {
          name: 'Test Resource for Permission Check',
          description: 'Resource for testing permission checks',
        },
      });
      testResourceId = testResource.id;

      // Create a role with specific permissions for the resource
      const testRole = await (prisma as any).role.create({
        data: {
          name: 'Test Permission Check Role',
          description: 'Role for testing permission checks',
          permissions: ['resource:read', 'resource:update'],
        },
      });
      testRoleId = testRole.id;

      // Assign the role to the test user for the specific resource
      await (prisma as any).userResourceRole.create({
        data: {
          userId: testUserId,
          roleId: testRoleId,
          resourceId: testResourceId,
        },
      });
    });

    it('should return true when user has the required permission on a resource', async () => {
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
      expect(response.body).toHaveProperty('userPermissions');
      expect(response.body).toHaveProperty('checkedPermission', 'resource:read');
      expect(response.body).toHaveProperty('resourceId', testResourceId);
      expect(Array.isArray(response.body.userPermissions)).toBe(true);
      expect(response.body.userPermissions).toContain('resource:read');
    });

    it('should return false when user does not have the required permission', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: 'resource:delete',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', false);
      expect(response.body).toHaveProperty('userPermissions');
      expect(response.body).toHaveProperty('checkedPermission', 'resource:delete');
      expect(response.body).toHaveProperty('resourceId', testResourceId);
      expect(Array.isArray(response.body.userPermissions)).toBe(true);
      expect(response.body.userPermissions).not.toContain('resource:delete');
    });

    it('should return true for super admin users regardless of permission', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: adminUserId,
          permission: 'nonexistent:permission',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', true);
      expect(response.body).toHaveProperty('reason', 'super_admin');
      expect(response.body).toHaveProperty('checkedPermission', 'nonexistent:permission');
      expect(response.body).toHaveProperty('resourceId', testResourceId);
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          permission: 'resource:read',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('userId is required');
    });

    it('should return 400 when permission is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          resourceId: testResourceId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('permission is required');
    });

    it('should return 400 when resourceId is missing', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: 'resource:read',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('resourceId is required');
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          permission: 'resource:read',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .send({
          userId: testUserId,
          permission: 'resource:read',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 403 when authenticated user lacks permission to check others', async () => {
      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          userId: adminUserId,
          permission: 'user:read',
          resourceId: testResourceId,
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Insufficient permissions');
    });

    it('should handle global permissions (resourceId is null)', async () => {
      // Create a global role with permission:read
      const globalRole = await (prisma as any).role.create({
        data: {
          name: 'Global Permission Role',
          description: 'Role with global permissions',
          permissions: ['permission:read'],
        },
      });

      await (prisma as any).userResourceRole.create({
        data: {
          userId: testUserId,
          roleId: globalRole.id,
          resourceId: null, // Global role
        },
      });

      const response = await request(app)
        .post('/api/permissions/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          permission: 'permission:read',
          resourceId: testResourceId, // Even with specific resourceId, global permissions should work
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', true);
      expect(response.body.userPermissions).toContain('permission:read');
    });
  });
});