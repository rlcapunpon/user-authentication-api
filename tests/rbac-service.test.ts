import { prisma } from '../src/db';
import * as rbacService from '../src/services/rbac.service';

describe('RBAC Service', () => {
  beforeEach(async () => {
    // Clear all data before each test
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getUserAccessibleResourcesPaginated', () => {
    let testUserId: string;
    let adminUserId: string;
    let resource1Id: string;
    let resource2Id: string;
    let resource3Id: string;

    beforeEach(async () => {
      // Create test users
      const testUser = await (prisma as any).user.create({
        data: { email: 'test@example.com', isActive: true, isSuperAdmin: false },
      });
      testUserId = testUser.id;

      const adminUser = await (prisma as any).user.create({
        data: { email: 'admin@example.com', isActive: true, isSuperAdmin: true },
      });
      adminUserId = adminUser.id;

      // Create resources
      const resource1 = await (prisma as any).resource.create({
        data: { name: 'Resource 1', description: 'First resource' },
      });
      resource1Id = resource1.id;

      const resource2 = await (prisma as any).resource.create({
        data: { name: 'Resource 2', description: 'Second resource' },
      });
      resource2Id = resource2.id;

      const resource3 = await (prisma as any).resource.create({
        data: { name: 'Resource 3', description: 'Third resource' },
      });
      resource3Id = resource3.id;

      // Create roles
      const role1 = await (prisma as any).role.create({
        data: { name: 'Role 1', permissions: ['read'] },
      });

      const role2 = await (prisma as any).role.create({
        data: { name: 'Role 2', permissions: ['write'] },
      });

      // Assign roles to test user for specific resources
      await (prisma as any).userResourceRole.create({
        data: { userId: testUserId, roleId: role1.id, resourceId: resource1Id },
      });

      await (prisma as any).userResourceRole.create({
        data: { userId: testUserId, roleId: role2.id, resourceId: resource2Id },
      });
    });

    it('should return paginated resources for regular user', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(testUserId);

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });

      const resourceIds = result.data.map((r: any) => r.id);
      expect(resourceIds).toContain(resource1Id);
      expect(resourceIds).toContain(resource2Id);
      expect(resourceIds).not.toContain(resource3Id);
    });

    it('should return all resources for super admin user', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(adminUserId);

      expect(result.data).toHaveLength(3);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });

      const resourceIds = result.data.map((r: any) => r.id);
      expect(resourceIds).toContain(resource1Id);
      expect(resourceIds).toContain(resource2Id);
      expect(resourceIds).toContain(resource3Id);
    });

    it('should return paginated results with custom page and limit', async () => {
      // Create more resources for pagination testing
      await (prisma as any).resource.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          name: `Extra Resource ${i + 1}`,
          description: `Extra resource ${i + 1}`,
        })),
      });

      const result = await rbacService.getUserAccessibleResourcesPaginated(adminUserId, 2, 4);

      expect(result.data).toHaveLength(4);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 4,
        total: 8, // 3 original + 5 new
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should return empty array for user with no resource access', async () => {
      const noAccessUser = await (prisma as any).user.create({
        data: { email: 'noaccess@example.com', isActive: true, isSuperAdmin: false },
      });

      const result = await rbacService.getUserAccessibleResourcesPaginated(noAccessUser.id);

      expect(result.data).toHaveLength(0);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should return resources without user roles in the response', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(testUserId);

      expect(result.data).toHaveLength(2);
      result.data.forEach((resource: any) => {
        expect(resource).toHaveProperty('id');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('createdAt');
        expect(resource).toHaveProperty('updatedAt');
        expect(resource).not.toHaveProperty('userRoles');
      });
    });

    it('should filter resources by name (case-insensitive partial match) for super admin', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(adminUserId, 1, 10, 'resource');

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((resource: any) => {
        expect(resource.name.toLowerCase()).toContain('resource');
      });
    });

    it('should filter resources by exact resource ID for super admin', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(adminUserId, 1, 10, undefined, resource1Id);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(resource1Id);
    });

    it('should filter resources by both name and ID for super admin', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(adminUserId, 1, 10, 'Resource 1', resource1Id);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(resource1Id);
      expect(result.data[0].name).toBe('Resource 1');
    });

    it('should filter resources by name for regular user', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(testUserId, 1, 10, 'Resource 1');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(resource1Id);
      expect(result.data[0].name).toBe('Resource 1');
    });

    it('should filter resources by exact resource ID for regular user', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(testUserId, 1, 10, undefined, resource2Id);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(resource2Id);
    });

    it('should return empty array when filtering by non-existent resource name', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(adminUserId, 1, 10, 'nonexistent');

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should return empty array when filtering by non-existent resource ID', async () => {
      const result = await rbacService.getUserAccessibleResourcesPaginated(adminUserId, 1, 10, undefined, 'nonexistent-id');

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });
});