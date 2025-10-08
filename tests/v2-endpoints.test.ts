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

    // Create WINDBOOKS_APP resource first
    const windbooksAppResource = await (prisma as any).resource.create({
      data: {
        name: 'WINDBOOKS_APP',
        description: 'Main Windbooks application resource',
      },
    });

    // Create ResourceStatus ACTIVE for WINDBOOKS_APP
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: windbooksAppResource.id,
        status: 'ACTIVE',
      },
    });

    // Create SUPERADMIN role
    const superAdminRole = await (prisma as any).role.create({
      data: {
        name: 'SUPERADMIN',
        description: 'Super admin role with full access',
        permissions: ['*'], // All permissions
      },
    });

    // Create test resources
    const resource1 = await (prisma as any).resource.create({
      data: {
        name: 'Resource 1',
        description: 'First test resource',
      },
    });
    resource1Id = resource1.id;

    // Create ResourceStatus ACTIVE for Resource 1
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: resource1Id,
        status: 'ACTIVE',
      },
    });

    const resource2 = await (prisma as any).resource.create({
      data: {
        name: 'Resource 2',
        description: 'Second test resource',
      },
    });
    resource2Id = resource2.id;

    // Create ResourceStatus ACTIVE for Resource 2
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: resource2Id,
        status: 'ACTIVE',
      },
    });

    const resource3 = await (prisma as any).resource.create({
      data: {
        name: 'Resource 3',
        description: 'Third test resource',
      },
    });
    resource3Id = resource3.id;

    // Create ResourceStatus ACTIVE for Resource 3
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: resource3Id,
        status: 'ACTIVE',
      },
    });

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

    // Assign SUPERADMIN role to admin user for WINDBOOKS_APP resource
    await (prisma as any).userResourceRole.create({
      data: {
        userId: adminUserId,
        roleId: superAdminRole.id,
        resourceId: windbooksAppResource.id,
      },
    });

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
    await (prisma as any).resourceStatus.deleteMany({});
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

    it('should filter users by email', async () => {
      // Create a user with a specific email for filtering
      await (prisma as any).user.create({
        data: {
          email: 'filter-test@example.com',
          isActive: true,
          isSuperAdmin: false,
        },
      });

      const response = await request(app)
        .get('/api/users/v2?email=filter-test')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((user: any) => {
        expect(user.email.toLowerCase()).toContain('filter-test');
      });
    });

    it('should filter users by isActive true', async () => {
      // Create active and inactive users
      await (prisma as any).user.createMany({
        data: [
          { email: 'active-filter@example.com', isActive: true, isSuperAdmin: false },
          { email: 'inactive-filter@example.com', isActive: false, isSuperAdmin: false },
        ],
      });

      const response = await request(app)
        .get('/api/users/v2?isActive=true')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should filter users by isActive false', async () => {
      const response = await request(app)
        .get('/api/users/v2?isActive=false')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      response.body.data.forEach((user: any) => {
        expect(user.isActive).toBe(false);
      });
    });

    it('should combine email and isActive filters', async () => {
      const response = await request(app)
        .get('/api/users/v2?email=active-filter&isActive=true')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((user: any) => {
        expect(user.email.toLowerCase()).toContain('active-filter');
        expect(user.isActive).toBe(true);
      });
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
      expect(response.body.data.length).toBe(4); // admin sees all resources including WINDBOOKS_APP
      expect(response.body.pagination.total).toBe(4);
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

    it('should filter resources by name using q parameter', async () => {
      const response = await request(app)
        .get('/api/resources/v2?q=Resource%201')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Resource 1');
    });

    it('should filter resources by partial name match using q parameter (case insensitive)', async () => {
      const response = await request(app)
        .get('/api/resources/v2?q=resource')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3); // All resources contain "resource"
    });

    it('should filter resources by ID using q parameter', async () => {
      const response = await request(app)
        .get(`/api/resources/v2?q=${resource1Id}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(resource1Id);
    });

    it('should filter resources by partial ID match using q parameter', async () => {
      // Get first few characters of resource1Id for partial match
      const partialId = resource1Id.substring(0, 4);
      const response = await request(app)
        .get(`/api/resources/v2?q=${partialId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      // Verify that all returned resources have IDs containing the partial ID
      response.body.data.forEach((resource: any) => {
        expect(resource.id.toLowerCase()).toContain(partialId.toLowerCase());
      });
    });

    it('should return empty array when q parameter matches nothing', async () => {
      const response = await request(app)
        .get('/api/resources/v2?q=nonexistent')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/resources/v2');

      expect(response.status).toBe(401);
    });
  });
});