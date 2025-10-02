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

  describe('GET /api/resources/:userId', () => {
    it('should return resources and roles for the authenticated user when accessing their own data', async () => {
      const response = await request(app)
        .get(`/api/resources/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);

      // Test user should have 2 resources (Resource 1 and Resource 2)
      expect(response.body.resources.length).toBe(2);

      // Check structure of each resource
      response.body.resources.forEach((resource: any) => {
        expect(resource).toHaveProperty('resourceId');
        expect(resource).toHaveProperty('resourceName');
        expect(resource).toHaveProperty('roleName');
        expect(resource).toHaveProperty('roleId');
      });

      // Verify specific resources and roles
      const resourceNames = response.body.resources.map((r: any) => r.resourceName);
      expect(resourceNames).toContain('Resource 1');
      expect(resourceNames).toContain('Resource 2');
      expect(resourceNames).not.toContain('Resource 3');
    });

    it('should allow super admin to access any user resources and roles', async () => {
      const response = await request(app)
        .get(`/api/resources/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.resources.length).toBe(2);
    });

    it('should return empty array for user with no resource access', async () => {
      // Create a user with no resource roles
      const noAccessEmail = 'noaccess2@example.com';
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

      const response = await request(app)
        .get(`/api/resources/${noAccessUser.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.resources.length).toBe(0);

      // Clean up
      await (prisma as any).user.delete({ where: { id: noAccessUser.id } });
    });

    it('should deny regular user access to another user resources', async () => {
      // Create another regular user
      const otherUserEmail = 'otheruser@example.com';
      const otherUserPassword = 'password123';
      const hashedPassword = await hashPassword(otherUserPassword);

      const otherUser = await (prisma as any).user.create({
        data: {
          email: otherUserEmail,
          isActive: true,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });

      const response = await request(app)
        .get(`/api/resources/${otherUser.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Forbidden');

      // Clean up
      await (prisma as any).user.delete({ where: { id: otherUser.id } });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/resources/${testUserId}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get(`/api/resources/${testUserId}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/resources/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
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
      expect(response.body.data.length).toBe(2); // Test user has access to 2 resources

      const resourceIds = response.body.data.map((r: any) => r.id);
      expect(resourceIds).toContain(resource1Id);
      expect(resourceIds).toContain(resource2Id);
    });

    it('should return all resources for super admin user', async () => {
      const response = await request(app)
        .get('/api/resources/v2')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3); // Admin sees all resources

      const resourceIds = response.body.data.map((r: any) => r.id);
      expect(resourceIds).toContain(resource1Id);
      expect(resourceIds).toContain(resource2Id);
      expect(resourceIds).toContain(resource3Id);
    });

    it('should filter resources by name (case-insensitive partial match)', async () => {
      const response = await request(app)
        .get('/api/resources/v2?resourceName=resource%201')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Resource 1');
      expect(response.body.data[0].id).toBe(resource1Id);
    });

    it('should filter resources by exact resource ID', async () => {
      const response = await request(app)
        .get(`/api/resources/v2?resourceId=${resource2Id}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(resource2Id);
      expect(response.body.data[0].name).toBe('Resource 2');
    });

    it('should filter resources by both name and ID', async () => {
      const response = await request(app)
        .get(`/api/resources/v2?resourceName=resource&resourceId=${resource1Id}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(resource1Id);
      expect(response.body.data[0].name).toBe('Resource 1');
    });

    it('should return empty array when filtering by non-existent resource name', async () => {
      const response = await request(app)
        .get('/api/resources/v2?resourceName=nonexistent')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return empty array when filtering by non-existent resource ID', async () => {
      const response = await request(app)
        .get('/api/resources/v2?resourceId=00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should respect pagination with filters', async () => {
      const response = await request(app)
        .get('/api/resources/v2?page=1&limit=1&resourceName=resource')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/resources/v2');

      expect(response.status).toBe(401);
    });
  });
});