import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('V2 Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;
  let resource1Id: string;
  let resource2Id: string;
  let resource3Id: string;

  const testEmail = 'testuser-v2@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin-v2@example.com';
  const adminPassword = 'adminpassword123';

  beforeAll(async () => {
    // Clear test data
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});

    // Create test resources
    const resource1 = await (prisma as any).resource.create({
      data: {
        name: 'Resource 1',
        description: 'First test resource',
      },
    });
    resource1Id = resource1.id;

    const resource2 = await (prisma as any).resource.create({
      data: {
        name: 'Resource 2',
        description: 'Second test resource',
      },
    });
    resource2Id = resource2.id;

    const resource3 = await (prisma as any).resource.create({
      data: {
        name: 'Resource 3',
        description: 'Third test resource',
      },
    });
    resource3Id = resource3.id;

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
      permissions: ['*'],
      role: 'Super Admin'
    });

    // Create roles for test user
    const resource1Role = await (prisma as any).role.create({
      data: {
        name: 'Resource 1 Access Role',
        description: 'Role for accessing Resource 1',
        permissions: ['resource:read', 'resource:update'],
      },
    });

    const resource2Role = await (prisma as any).role.create({
      data: {
        name: 'Resource 2 Access Role',
        description: 'Role for accessing Resource 2',
        permissions: ['resource:read'],
      },
    });

    // Assign roles to test user for specific resources
    await (prisma as any).userResourceRole.create({
      data: {
        userId: testUserId,
        roleId: resource1Role.id,
        resourceId: resource1Id,
      },
    });

    await (prisma as any).userResourceRole.create({
      data: {
        userId: testUserId,
        roleId: resource2Role.id,
        resourceId: resource2Id,
      },
    });

    // Generate token for test user with their actual permissions
    const testUserPermissions = ['resource:read', 'resource:update'];
    testUserToken = generateAccessToken({
      userId: testUserId,
      isSuperAdmin: false,
      permissions: testUserPermissions,
      role: 'Test User Role'
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

  describe('GET /api/users/v2', () => {
    beforeAll(async () => {
      // Create additional users for pagination testing
      await (prisma as any).user.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          email: `extra-user-${i + 1}@example.com`,
          isActive: true,
          isSuperAdmin: false,
        })),
      });
    });

    it('should return paginated users with default values', async () => {
      const response = await request(app)
        .get('/api/users/v2')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');
    });

    it('should return paginated users with custom page and limit', async () => {
      const response = await request(app)
        .get('/api/users/v2?page=2&limit=3')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(3);
      expect(response.body.pagination.hasPrev).toBe(true);
    });

    it('should validate page parameter', async () => {
      const response = await request(app)
        .get('/api/users/v2?page=0')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/users/v2?limit=150')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/v2');

      expect(response.status).toBe(401);
    });

    it('should fail with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/users/v2')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/resources/v2', () => {
    it('should return paginated resources for authenticated user', async () => {
      const response = await request(app)
        .get('/api/resources/v2')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2); // testUser has access to 2 resources
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body.pagination).toHaveProperty('total', 2);
      expect(response.body.pagination).toHaveProperty('totalPages', 1);
      expect(response.body.pagination).toHaveProperty('hasNext', false);
      expect(response.body.pagination).toHaveProperty('hasPrev', false);
    });

    it('should return all resources for super admin', async () => {
      const response = await request(app)
        .get('/api/resources/v2')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3); // admin sees all resources
      expect(response.body.pagination.total).toBe(3);
    });

    it('should support custom pagination parameters', async () => {
      const response = await request(app)
        .get('/api/resources/v2?page=1&limit=1')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/resources/v2?page=-1&limit=0')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/resources/v2');

      expect(response.status).toBe(401);
    });
  });
});