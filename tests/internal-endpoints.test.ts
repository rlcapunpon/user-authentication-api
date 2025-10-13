import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { ApiKeyService } from '../src/services/apiKey.service';

describe('Internal Resources Endpoints', () => {
  let testUserId: string;
  let adminUserId: string;
  let resource1Id: string;
  let resource2Id: string;
  let resource3Id: string;
  let windbooksAppResourceId: string;
  let superAdminRoleId: string;
  let testApiKey: string;
  let adminApiKey: string;

  const testEmail = 'testuser-internal@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin-internal@example.com';
  const adminPassword = 'adminpassword123';

  beforeAll(async () => {
    // Clear test data
    await (prisma as any).apiKey.deleteMany({});
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
    windbooksAppResourceId = windbooksAppResource.id;

    // Create ResourceStatus ACTIVE for WINDBOOKS_APP
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: windbooksAppResourceId,
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
    superAdminRoleId = superAdminRole.id;

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
        roleId: superAdminRoleId,
        resourceId: windbooksAppResourceId,
      },
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

    // Create API keys for testing
    testApiKey = 'test-api-key-12345';
    adminApiKey = 'admin-api-key-67890';

    await ApiKeyService.createApiKey('test-owner', testApiKey);
    await ApiKeyService.createApiKey('admin-owner', adminApiKey);
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).apiKey.deleteMany({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).resourceStatus.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    await prisma.$disconnect();
  });

  describe('DELETE /api/internal/resources/:id', () => {
    it('should soft delete a resource with valid API key', async () => {
      const response = await request(app)
        .delete(`/api/internal/resources/${resource1Id}`)
        .set('X-API-Key', adminApiKey);

      expect(response.status).toBe(204);

      // Verify the resource is marked as deleted in ResourceStatus
      const resourceStatus = await (prisma as any).resourceStatus.findUnique({
        where: { resourceId: resource1Id },
      });
      expect(resourceStatus).toBeTruthy();
      expect(resourceStatus.status).toBe('DELETED');
    });

    it('should fail without API key', async () => {
      const response = await request(app)
        .delete(`/api/internal/resources/${resource2Id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('API key required');
    });

    it('should fail with invalid API key', async () => {
      const response = await request(app)
        .delete(`/api/internal/resources/${resource2Id}`)
        .set('X-API-Key', 'invalid-api-key');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid API key');
    });

    it('should fail when trying to delete non-existent resource', async () => {
      const fakeResourceId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/internal/resources/${fakeResourceId}`)
        .set('X-API-Key', adminApiKey);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Resource not found');
    });

    it('should prevent double deletion of already deleted resource', async () => {
      // Create a new resource specifically for this test
      const doubleDeleteResource = await (prisma as any).resource.create({
        data: {
          name: 'Double Delete Test Resource',
          description: 'Resource for testing double deletion prevention',
        },
      });

      // First deletion
      const firstResponse = await request(app)
        .delete(`/api/internal/resources/${doubleDeleteResource.id}`)
        .set('X-API-Key', adminApiKey);

      expect(firstResponse.status).toBe(204);

      // Second deletion attempt should fail
      const secondResponse = await request(app)
        .delete(`/api/internal/resources/${doubleDeleteResource.id}`)
        .set('X-API-Key', adminApiKey);

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.message).toContain('Resource is already deleted');

      // Clean up
      await (prisma as any).resource.delete({ where: { id: doubleDeleteResource.id } });
    });

    it('should append "(DELETED )" and current date to resource name when soft deleting via internal endpoint', async () => {
      // Create a new resource specifically for this test
      const originalName = 'Internal Test Resource for Name Modification';
      const testResource = await (prisma as any).resource.create({
        data: {
          name: originalName,
          description: 'Resource for testing name modification on soft delete via internal endpoint',
        },
      });

      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      const expectedName = `${originalName} (DELETED ${currentDate})`;

      // Soft delete the resource via internal endpoint
      const response = await request(app)
        .delete(`/api/internal/resources/${testResource.id}`)
        .set('X-API-Key', adminApiKey);

      expect(response.status).toBe(204);

      // Verify the resource name was modified
      const updatedResource = await (prisma as any).resource.findUnique({
        where: { id: testResource.id },
      });
      expect(updatedResource).toBeTruthy();
      expect(updatedResource.name).toBe(expectedName);

      // Verify status was updated to DELETED
      const resourceStatus = await (prisma as any).resourceStatus.findUnique({
        where: { resourceId: testResource.id },
      });
      expect(resourceStatus).toBeTruthy();
      expect(resourceStatus.status).toBe('DELETED');

      // Clean up
      await (prisma as any).resource.delete({ where: { id: testResource.id } });
    });
  });

  describe('POST /api/internal/resources/user-roles', () => {
    it('should return resource roles for a user given a list of resourceIds', async () => {
      const requestBody = {
        userId: testUserId,
        resources: [resource1Id, resource2Id],
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', testApiKey)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resourceRoles');
      expect(Array.isArray(response.body.resourceRoles)).toBe(true);
      expect(response.body.resourceRoles.length).toBe(2);

      // Check structure of each resource role
      response.body.resourceRoles.forEach((resourceRole: any) => {
        expect(resourceRole).toHaveProperty('resourceId');
        expect(resourceRole).toHaveProperty('roleName');
        expect(resourceRole).toHaveProperty('roleId');
        expect([resource1Id, resource2Id]).toContain(resourceRole.resourceId);
      });

      // Verify specific roles
      const resource1Role = response.body.resourceRoles.find((r: any) => r.resourceId === resource1Id);
      const resource2Role = response.body.resourceRoles.find((r: any) => r.resourceId === resource2Id);

      expect(resource1Role).toBeDefined();
      expect(resource2Role).toBeDefined();
      expect(resource1Role.roleName).toBe('Resource 1 Access Role');
      expect(resource2Role.roleName).toBe('Resource 2 Access Role');
    });

    it('should return empty array when user has no roles for the requested resources', async () => {
      const requestBody = {
        userId: testUserId,
        resources: [resource3Id], // Test user has no access to resource3
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', testApiKey)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resourceRoles');
      expect(Array.isArray(response.body.resourceRoles)).toBe(true);
      expect(response.body.resourceRoles.length).toBe(0);
    });

    it('should return roles only for resources the user has access to', async () => {
      const requestBody = {
        userId: testUserId,
        resources: [resource1Id, resource2Id, resource3Id], // Mix of accessible and non-accessible resources
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', testApiKey)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.resourceRoles.length).toBe(2); // Only resource1 and resource2

      const returnedResourceIds = response.body.resourceRoles.map((r: any) => r.resourceId);
      expect(returnedResourceIds).toContain(resource1Id);
      expect(returnedResourceIds).toContain(resource2Id);
      expect(returnedResourceIds).not.toContain(resource3Id);
    });

    it('should return all requested resource roles for super admin user', async () => {
      const requestBody = {
        userId: adminUserId,
        resources: [resource1Id, resource2Id, resource3Id],
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', adminApiKey)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.resourceRoles.length).toBe(3); // Admin should see all resources

      const returnedResourceIds = response.body.resourceRoles.map((r: any) => r.resourceId);
      expect(returnedResourceIds).toContain(resource1Id);
      expect(returnedResourceIds).toContain(resource2Id);
      expect(returnedResourceIds).toContain(resource3Id);

      // Super admin should have virtual super admin roles
      response.body.resourceRoles.forEach((resourceRole: any) => {
        expect(resourceRole.roleName).toBe('Super Admin');
        expect(resourceRole.roleId).toBe('super-admin-role');
      });
    });

    it('should handle empty resources array', async () => {
      const requestBody = {
        userId: testUserId,
        resources: [],
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', testApiKey)
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('At least one resource ID is required');
    });

    it('should handle non-existent resource IDs', async () => {
      const requestBody = {
        userId: testUserId,
        resources: ['non-existent-id-1', 'non-existent-id-2'],
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', testApiKey)
        .send(requestBody);

      expect(response.status).toBe(200);
      expect(response.body.resourceRoles).toEqual([]);
    });

    it('should fail without API key', async () => {
      const requestBody = {
        userId: testUserId,
        resources: [resource1Id],
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('API key required');
    });

    it('should fail with invalid API key', async () => {
      const requestBody = {
        userId: testUserId,
        resources: [resource1Id],
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', 'invalid-api-key')
        .send(requestBody);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid API key');
    });

    it('should fail with invalid request body - missing resources field', async () => {
      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', testApiKey)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('resources is required');
    });

    it('should fail with invalid request body - resources not an array', async () => {
      const requestBody = {
        resources: 'not-an-array',
      };

      const response = await request(app)
        .post('/api/internal/resources/user-roles')
        .set('X-API-Key', testApiKey)
        .send(requestBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('resources must be an array');
    });
  });

  describe('GET /api/internal/resources/v2', () => {
    it('should return paginated resources for a user with userId query param', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', testApiKey)
        .query({ userId: testUserId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1); // Test user has access to 1 resource (Resource 2, since Resource 1 was deleted)

      const resourceIds = response.body.data.map((r: any) => r.id);
      expect(resourceIds).toContain(resource2Id);
      expect(resourceIds).not.toContain(resource1Id); // Resource 1 was deleted
    });

    it('should return all resources for super admin user', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', adminApiKey)
        .query({ userId: adminUserId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3); // Admin sees all active resources (WINDBOOKS_APP, Resource 2, Resource 3 - Resource 1 was deleted)

      const resourceNames = response.body.data.map((r: any) => r.name);
      expect(resourceNames).toContain('WINDBOOKS_APP');
      expect(resourceNames).toContain('Resource 2');
      expect(resourceNames).toContain('Resource 3');
      expect(resourceNames).not.toContain('Resource 1'); // Resource 1 was deleted
    });

    it('should filter resources by name (case-insensitive partial match)', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', adminApiKey)
        .query({ userId: adminUserId, resourceName: 'resource 2' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Resource 2');
      expect(response.body.data[0].id).toBe(resource2Id);
    });

    it('should filter resources by exact resource ID', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', adminApiKey)
        .query({ userId: adminUserId, resourceId: resource2Id });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(resource2Id);
      expect(response.body.data[0].name).toBe('Resource 2');
    });

    it('should return empty array when filtering by non-existent resource name', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', adminApiKey)
        .query({ userId: adminUserId, resourceName: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return empty array when filtering by non-existent resource ID', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', adminApiKey)
        .query({ userId: adminUserId, resourceId: '00000000-0000-0000-0000-000000000000' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should respect pagination with filters', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', adminApiKey)
        .query({ userId: adminUserId, page: 1, limit: 1, resourceName: 'resource' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(2); // Resource 2 and Resource 3 (Resource 1 was deleted)
      expect(response.body.pagination.hasNext).toBe(true);
    });

    it('should fail without API key', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .query({ userId: testUserId });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('API key required');
    });

    it('should fail with invalid API key', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', 'invalid-api-key')
        .query({ userId: testUserId });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid API key');
    });

    it('should fail without userId query parameter', async () => {
      const response = await request(app)
        .get('/api/internal/resources/v2')
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('userId query parameter is required');
    });
  });

  describe('GET /api/internal/resources/:userId', () => {
    it('should return resources and roles for the specified user', async () => {
      const response = await request(app)
        .get(`/api/internal/resources/${testUserId}`)
        .set('X-API-Key', testApiKey);

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
      const currentDate = new Date().toISOString().split('T')[0];
      expect(resourceNames).toContain(`Resource 1 (DELETED ${currentDate})`);
      expect(resourceNames).toContain('Resource 2');
      expect(resourceNames).not.toContain('Resource 3');
    });

    it('should allow access to any user data (internal API)', async () => {
      const response = await request(app)
        .get(`/api/internal/resources/${testUserId}`)
        .set('X-API-Key', adminApiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.resources.length).toBe(2);
    });

    it('should return empty array for user with no resource access', async () => {
      // Create a user with no resource roles
      const noAccessEmail = 'noaccess-internal@example.com';
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
        .get(`/api/internal/resources/${noAccessUser.id}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
      expect(response.body.resources.length).toBe(0);

      // Clean up
      await (prisma as any).user.delete({ where: { id: noAccessUser.id } });
    });

    it('should fail without API key', async () => {
      const response = await request(app)
        .get(`/api/internal/resources/${testUserId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('API key required');
    });

    it('should fail with invalid API key', async () => {
      const response = await request(app)
        .get(`/api/internal/resources/${testUserId}`)
        .set('X-API-Key', 'invalid-api-key');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid API key');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/internal/resources/${fakeUserId}`)
        .set('X-API-Key', testApiKey);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });
});
