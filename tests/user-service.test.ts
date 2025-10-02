import { prisma } from '../src/db';
import * as userService from '../src/services/user.service';

describe('User Service', () => {
  beforeEach(async () => {
    // Clear all data before each test
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
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
});