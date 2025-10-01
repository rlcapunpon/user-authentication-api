import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('Resources Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;
  let resource1Id: string;
  let resource2Id: string;
  let resource3Id: string;

  const testEmail = 'testuser-resources@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin-resources@example.com';
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
      permissions: ['*'], // Admin has all permissions
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

  describe('GET /api/resources', () => {
    it('should return only resources the user has access to', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Test user should only see Resource 1 and Resource 2 (not Resource 3)
      expect(response.body.length).toBe(2);

      const resourceIds = response.body.map((r: any) => r.id);
      expect(resourceIds).toContain(resource1Id);
      expect(resourceIds).toContain(resource2Id);
      expect(resourceIds).not.toContain(resource3Id);
    });

    it('should return all resources for super admin user', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Admin should see all 3 resources
      expect(response.body.length).toBe(3);

      const resourceIds = response.body.map((r: any) => r.id);
      expect(resourceIds).toContain(resource1Id);
      expect(resourceIds).toContain(resource2Id);
      expect(resourceIds).toContain(resource3Id);
    });

    it('should return empty array for user with no resource access', async () => {
      // Create a user with no resource roles
      const noAccessEmail = 'noaccess@example.com';
      const noAccessPassword = 'password123';
      const hashedPassword = await hashPassword(noAccessPassword);

      const noAccessUser = await (prisma as any).user.create({
        data: {
          email: noAccessEmail,
          isActive: true,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });

      const noAccessToken = generateAccessToken({
        userId: noAccessUser.id,
        isSuperAdmin: false,
        permissions: [],
        role: 'No Access Role'
      });

      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${noAccessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Clean up
      await (prisma as any).user.delete({ where: { id: noAccessUser.id } });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/resources');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should include resource details in response', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);

      // Check structure of returned resources
      const resource = response.body[0];
      expect(resource).toHaveProperty('id');
      expect(resource).toHaveProperty('name');
      expect(resource).toHaveProperty('description');
      expect(resource).toHaveProperty('userRoles');
      expect(Array.isArray(resource.userRoles)).toBe(true);
    });
  });

  describe('GET /api/resources/:resourceId/user-role', () => {
    it('should return the role of the authenticated user for a specific resource', async () => {
      const response = await request(app)
        .get(`/api/resources/${resource1Id}/user-role`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('resourceId');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.role).toHaveProperty('id');
      expect(response.body.role).toHaveProperty('name');
      expect(response.body.role).toHaveProperty('permissions');
    });

    it('should return 404 when user has no role for the resource', async () => {
      const response = await request(app)
        .get('/api/resources/non-existent-resource/user-role')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No role found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/resources/${resource1Id}/user-role`);

      expect(response.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/resources/test-resource-1/user-role')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});