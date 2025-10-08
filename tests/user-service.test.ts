import { prisma } from '../src/db';
import * as userService from '../src/services/user.service';

describe('User Service', () => {
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

  describe('listUsersPaginated', () => {
    it('should return paginated users with default values', async () => {
      // Create test users
      await (prisma as any).user.createMany({
        data: [
          { email: 'user1@example.com', isActive: true, isSuperAdmin: false },
          { email: 'user2@example.com', isActive: true, isSuperAdmin: false },
          { email: 'user3@example.com', isActive: true, isSuperAdmin: false },
        ],
      });

      const result = await userService.listUsersPaginated();

      expect(result.data).toHaveLength(3);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should return paginated users with custom page and limit', async () => {
      // Create 5 test users
      await (prisma as any).user.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          email: `user${i + 1}@example.com`,
          isActive: true,
          isSuperAdmin: false,
        })),
      });

      const result = await userService.listUsersPaginated(2, 2);

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should return empty array when no users exist', async () => {
      const result = await userService.listUsersPaginated();

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

    it('should filter users by email (case insensitive)', async () => {
      // Create test users
      await (prisma as any).user.createMany({
        data: [
          { email: 'john@example.com', isActive: true, isSuperAdmin: false },
          { email: 'jane@example.com', isActive: true, isSuperAdmin: false },
          { email: 'bob@example.com', isActive: true, isSuperAdmin: false },
        ],
      });

      const result = await userService.listUsersPaginated(1, 10, 'john');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('john@example.com');
      expect(result.pagination.total).toBe(1);
    });

    it('should filter users by isActive true', async () => {
      // Create test users with different active statuses
      await (prisma as any).user.createMany({
        data: [
          { email: 'active@example.com', isActive: true, isSuperAdmin: false },
          { email: 'inactive@example.com', isActive: false, isSuperAdmin: false },
        ],
      });

      const result = await userService.listUsersPaginated(1, 10, undefined, true);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('active@example.com');
      expect(result.data[0].isActive).toBe(true);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter users by isActive false', async () => {
      // Create test users with different active statuses
      await (prisma as any).user.createMany({
        data: [
          { email: 'active@example.com', isActive: true, isSuperAdmin: false },
          { email: 'inactive@example.com', isActive: false, isSuperAdmin: false },
        ],
      });

      const result = await userService.listUsersPaginated(1, 10, undefined, false);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('inactive@example.com');
      expect(result.data[0].isActive).toBe(false);
      expect(result.pagination.total).toBe(1);
    });

    it('should combine email and isActive filters', async () => {
      // Create test users
      await (prisma as any).user.createMany({
        data: [
          { email: 'john-active@example.com', isActive: true, isSuperAdmin: false },
          { email: 'john-inactive@example.com', isActive: false, isSuperAdmin: false }, // Different user with different email but inactive
          { email: 'jane@example.com', isActive: true, isSuperAdmin: false },
        ],
      });

      const result = await userService.listUsersPaginated(1, 10, 'john', true);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('john-active@example.com');
      expect(result.data[0].isActive).toBe(true);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('assignUserResourceRole', () => {
    let testUser: any;
    let testRole: any;
    let testResource: any;
    let windbooksAppResource: any;

    beforeEach(async () => {
      // Create test data
      testUser = await (prisma as any).user.create({
        data: {
          email: 'test@example.com',
          isActive: true,
          isSuperAdmin: false,
        },
      });

      testRole = await (prisma as any).role.create({
        data: {
          name: 'TEST_ROLE',
          description: 'Test role for testing',
          permissions: ['test:read'],
        },
      });

      testResource = await (prisma as any).resource.create({
        data: {
          name: 'Test Resource',
          description: 'A test resource',
        },
      });

      // Create ResourceStatus ACTIVE for Test Resource
      await (prisma as any).resourceStatus.create({
        data: {
          resourceId: testResource.id,
          status: 'ACTIVE',
        },
      });

      windbooksAppResource = await (prisma as any).resource.create({
        data: {
          name: 'WINDBOOKS_APP',
          description: 'Main frontend application resource',
        },
      });

      // Create ResourceStatus ACTIVE for WINDBOOKS_APP
      await (prisma as any).resourceStatus.create({
        data: {
          resourceId: windbooksAppResource.id,
          status: 'ACTIVE',
        },
      });
    });

    it('should assign role to user for a resource', async () => {
      const result = await userService.assignUserResourceRole(testUser.id, testRole.id, testResource.id);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testUser.id);
      expect(result.roleId).toBe(testRole.id);
      expect(result.resourceId).toBe(testResource.id);

      // Verify in database
      const userResourceRole = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId: testUser.id,
          roleId: testRole.id,
          resourceId: testResource.id,
        },
      });
      expect(userResourceRole).toBeDefined();
    });

    it('should automatically assign WINDBOOKS_APP role when user has no WINDBOOKS_APP role and is assigned to different resource', async () => {
      // Assign user to test resource (not WINDBOOKS_APP)
      await userService.assignUserResourceRole(testUser.id, testRole.id, testResource.id);

      // Verify that user now has the role for both testResource and WINDBOOKS_APP
      const testResourceRole = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId: testUser.id,
          roleId: testRole.id,
          resourceId: testResource.id,
        },
      });
      expect(testResourceRole).toBeDefined();

      const windbooksAppRole = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId: testUser.id,
          roleId: testRole.id,
          resourceId: windbooksAppResource.id,
        },
      });
      expect(windbooksAppRole).not.toBeNull();
    });

    it('should not assign WINDBOOKS_APP role when user already has a WINDBOOKS_APP role', async () => {
      // First assign a different role to WINDBOOKS_APP
      const differentRole = await (prisma as any).role.create({
        data: {
          name: 'DIFFERENT_ROLE',
          description: 'Different role',
          permissions: ['different:permission'],
        },
      });

      await (prisma as any).userResourceRole.create({
        data: {
          userId: testUser.id,
          roleId: differentRole.id,
          resourceId: windbooksAppResource.id,
        },
      });

      // Now assign testRole to testResource
      await userService.assignUserResourceRole(testUser.id, testRole.id, testResource.id);

      // Verify testResource role was assigned
      const testResourceRole = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId: testUser.id,
          roleId: testRole.id,
          resourceId: testResource.id,
        },
      });
      expect(testResourceRole).toBeDefined();

      // Verify no additional WINDBOOKS_APP role was created (should still only have the differentRole)
      const windbooksAppRoles = await (prisma as any).userResourceRole.findMany({
        where: {
          userId: testUser.id,
          resourceId: windbooksAppResource.id,
        },
      });
      expect(windbooksAppRoles).toHaveLength(1);
      expect(windbooksAppRoles[0].roleId).toBe(differentRole.id);
    });

    it('should overwrite existing role when user already has a different role for the same resource', async () => {
      // First assign a different role to the user for the same resource
      const differentRole = await (prisma as any).role.create({
        data: {
          name: 'DIFFERENT_ROLE',
          description: 'Different role for testing overwrite',
          permissions: ['different:permission'],
        },
      });

      // Assign the different role first
      await userService.assignUserResourceRole(testUser.id, differentRole.id, testResource.id);

      // Verify the different role was assigned
      let userResourceRole = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId: testUser.id,
          resourceId: testResource.id,
        },
      });
      expect(userResourceRole?.roleId).toBe(differentRole.id);

      // Now assign the testRole to the same user and resource - should overwrite
      await userService.assignUserResourceRole(testUser.id, testRole.id, testResource.id);

      // Verify the role was overwritten with the new role
      userResourceRole = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId: testUser.id,
          resourceId: testResource.id,
        },
      });
      expect(userResourceRole?.roleId).toBe(testRole.id);
      expect(userResourceRole?.roleId).not.toBe(differentRole.id);

      // Verify only one role assignment exists for this user-resource combination
      const allRolesForResource = await (prisma as any).userResourceRole.findMany({
        where: {
          userId: testUser.id,
          resourceId: testResource.id,
        },
      });
      expect(allRolesForResource).toHaveLength(1);
    });
  });
});