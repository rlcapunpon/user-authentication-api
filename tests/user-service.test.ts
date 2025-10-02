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

    it('should include resource roles in the response', async () => {
      const user = await (prisma as any).user.create({
        data: { email: 'user@example.com', isActive: true, isSuperAdmin: false },
      });

      const result = await userService.listUsersPaginated();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('resourceRoles');
      expect(Array.isArray(result.data[0].resourceRoles)).toBe(true);
    });
  });
});