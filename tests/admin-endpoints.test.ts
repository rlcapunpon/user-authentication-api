import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { generateAccessToken } from '../src/utils/jwt';
import { hashPassword } from '../src/utils/crypto';

describe('Admin Endpoints', () => {
  let superAdminToken: string;
  let regularUserToken: string;
  let superAdminUserId: string;
  let regularUserId: string;
  let testResourceId: string;
  let testRoleId: string;

  beforeAll(async () => {
    // Clean up existing test data
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).resourceStatus.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).user.deleteMany({});

    // Create super admin user
    const superAdminHashedPassword = await hashPassword('password123');
    const superAdminUser = await (prisma as any).user.create({
      data: {
        email: 'superadmin@test.com',
        isActive: true,
        isSuperAdmin: true,
        credential: {
          create: {
            passwordHash: superAdminHashedPassword,
          },
        },
        details: {
          create: {
            firstName: 'Super',
            lastName: 'Admin',
          },
        },
      },
    });
    superAdminUserId = superAdminUser.id;

    // Create regular user
    const regularHashedPassword = await hashPassword('password123');
    const regularUser = await (prisma as any).user.create({
      data: {
        email: 'regular@test.com',
        isActive: true,
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: regularHashedPassword,
          },
        },
        details: {
          create: {
            firstName: 'Regular',
            lastName: 'User',
          },
        },
      },
    });
    regularUserId = regularUser.id;

    // Create an inactive user for testing
    const inactiveHashedPassword = await hashPassword('password123');
    const inactiveUser = await (prisma as any).user.create({
      data: {
        email: 'inactive@test.com',
        isActive: false,
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: inactiveHashedPassword,
          },
        },
        details: {
          create: {
            firstName: 'Inactive',
            lastName: 'User',
          },
        },
      },
    });

    // Create test resources (excluding WINDBOOKS_APP)
    const activeResource = await (prisma as any).resource.create({
      data: {
        name: 'Active Resource',
        description: 'Test active resource',
      },
    });
    testResourceId = activeResource.id;

    const inactiveResource = await (prisma as any).resource.create({
      data: {
        name: 'Inactive Resource',
        description: 'Test inactive resource',
      },
    });

    const deletedResource = await (prisma as any).resource.create({
      data: {
        name: 'Deleted Resource',
        description: 'Test deleted resource',
      },
    });

    // Create WINDBOOKS_APP resource (should be excluded from counts)
    const windBooksResource = await (prisma as any).resource.create({
      data: {
        name: 'WINDBOOKS_APP',
        description: 'Main application resource',
      },
    });

    // Create resource statuses
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: activeResource.id,
        status: 'ACTIVE',
      },
    });

    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: inactiveResource.id,
        status: 'INACTIVE',
      },
    });

    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: deletedResource.id,
        status: 'DELETED',
      },
    });

    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: windBooksResource.id,
        status: 'ACTIVE',
      },
    });

    // Create test roles
    const testRole = await (prisma as any).role.create({
      data: {
        name: 'Test Role',
        permissions: ['read', 'write'],
      },
    });
    testRoleId = testRole.id;

    const anotherRole = await (prisma as any).role.create({
      data: {
        name: 'Another Role',
        permissions: ['read'],
      },
    });

    // Generate tokens
    superAdminToken = generateAccessToken({
      userId: superAdminUserId,
      isSuperAdmin: true,
      permissions: ['*'],
    });

    regularUserToken = generateAccessToken({
      userId: regularUserId,
      isSuperAdmin: false,
      permissions: ['resource:read'],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).resourceStatus.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).user.deleteMany({});
  });

  describe('GET /api/admin/status', () => {
    it('should return admin status counts for super admin user', async () => {
      const response = await request(app)
        .get('/api/admin/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalResources');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('activeResources');
      expect(response.body).toHaveProperty('inactiveUsers');
      expect(response.body).toHaveProperty('inactiveResources');
      expect(response.body).toHaveProperty('deletedUsers');
      expect(response.body).toHaveProperty('deletedResources');
      expect(response.body).toHaveProperty('totalRoles');

      // Verify counts
      expect(response.body.totalUsers).toBe(3); // super admin + regular + inactive
      expect(response.body.totalResources).toBe(3); // excluding WINDBOOKS_APP
      expect(response.body.activeUsers).toBe(2); // super admin + regular
      expect(response.body.activeResources).toBe(1); // only active resource
      expect(response.body.inactiveUsers).toBe(1); // only inactive user
      expect(response.body.inactiveResources).toBe(1); // only inactive resource
      expect(response.body.deletedUsers).toBe(0); // no deleted users
      expect(response.body.deletedResources).toBe(1); // only deleted resource
      expect(response.body.totalRoles).toBe(2); // test role + another role
    });

    it('should fail for regular user without super admin privileges', async () => {
      await request(app)
        .get('/api/admin/status')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/admin/status')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app)
        .get('/api/admin/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should exclude WINDBOOKS_APP from resource counts', async () => {
      const response = await request(app)
        .get('/api/admin/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      // Should not count the WINDBOOKS_APP resource
      expect(response.body.totalResources).toBe(3);
    });

    it('should return correct status structure', async () => {
      const response = await request(app)
        .get('/api/admin/status')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        totalUsers: expect.any(Number),
        totalResources: expect.any(Number),
        activeUsers: expect.any(Number),
        activeResources: expect.any(Number),
        inactiveUsers: expect.any(Number),
        inactiveResources: expect.any(Number),
        deletedUsers: expect.any(Number),
        deletedResources: expect.any(Number),
        totalRoles: expect.any(Number),
      });
    });
  });
});