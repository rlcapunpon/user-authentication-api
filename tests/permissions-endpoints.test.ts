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

  const testEmail = 'testuser@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin@example.com';
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
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    testUserId = testUser.id;
    testUserToken = generateAccessToken({ userId: testUserId });

    // Create admin test user
    const adminHashedPassword = await hashPassword(adminPassword);
    const adminUser = await (prisma as any).user.create({
      data: {
        email: adminEmail,
        isSuperAdmin: true,
        credential: {
          create: {
            passwordHash: adminHashedPassword,
          },
        },
      },
    });
    adminUserId = adminUser.id;
    adminUserToken = generateAccessToken({ userId: adminUserId });

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
});