import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('Roles Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;
  let testResourceId: string;
  let testRoleId: string;

  const testEmail = 'testuser@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'adminpassword123';

  beforeAll(async () => {
    // Clear test data
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});

    // Create test resource
    const testResource = await (prisma as any).resource.create({
      data: {
        name: 'Test Resource',
        description: 'A test resource for testing',
      },
    });
    testResourceId = testResource.id;

    // Create regular test user
    const hashedPassword = await hashPassword(testPassword);
    const testUser = await (prisma as any).user.create({
      data: {
        email: testEmail,
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
        isSuperAdmin: true,
        credential: {
          create: {
            passwordHash: adminHashedPassword,
          },
        },
      },
    });
    adminUserId = adminUser.id;

    testUserToken = generateAccessToken({ userId: testUserId });
    adminUserToken = generateAccessToken({ userId: adminUserId });

    // Create test role with read_roles permission
    const readRolesRole = await (prisma as any).role.create({
      data: {
        name: 'Read Roles Role',
        description: 'Role with read_roles permission',
        resourceId: null, // Global role
        permissions: ['read_roles'],
      },
    });

    // Create test role with create_role permission
    const createRoleRole = await (prisma as any).role.create({
      data: {
        name: 'Create Role Role',
        description: 'Role with create_role permission',
        resourceId: null, // Global role
        permissions: ['create_role'],
      },
    });

    // Assign read_roles role to test user
    await (prisma as any).userResourceRole.create({
      data: {
        userId: testUserId,
        roleId: readRolesRole.id,
        resourceId: null, // Global role
      },
    });

    // Assign create_role role to admin user
    await (prisma as any).userResourceRole.create({
      data: {
        userId: adminUserId,
        roleId: createRoleRole.id,
        resourceId: null, // Global role
      },
    });

    // Create test role for resource-specific tests
    const testRole = await (prisma as any).role.create({
      data: {
        name: 'Test Role',
        description: 'A test role',
        resourceId: testResourceId,
        permissions: ['read_users', 'create_user'],
      },
    });
    testRoleId = testRole.id;
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

  describe('GET /api/roles', () => {
    it('should return all roles for authenticated user', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check that the response includes the test role
      const testRole = response.body.find((role: any) => role.id === testRoleId);
      expect(testRole).toBeDefined();
      expect(testRole.name).toBe('Test Role');
      expect(testRole.permissions).toEqual(['read_users', 'create_user']);
      expect(testRole.resourceId).toBe(testResourceId);
    });

    it('should return roles filtered by resourceId', async () => {
      const response = await request(app)
        .get(`/api/roles?resourceId=${testResourceId}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All returned roles should belong to the specified resource
      response.body.forEach((role: any) => {
        expect(role.resourceId).toBe(testResourceId);
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/roles');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('POST /api/roles', () => {
    it('should create a new role successfully', async () => {
      const newRoleData = {
        name: 'New Test Role',
        description: 'A newly created test role',
        permissions: ['read_users', 'update_users'],
        resourceId: testResourceId,
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(newRoleData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newRoleData.name);
      expect(response.body.description).toBe(newRoleData.description);
      expect(response.body.permissions).toEqual(newRoleData.permissions);
      expect(response.body.resourceId).toBe(newRoleData.resourceId);
      expect(response.body.id).toBeDefined();
    });

    it('should create a global role without resourceId', async () => {
      const globalRoleData = {
        name: 'Global Admin Role',
        description: 'A global role without resource',
        permissions: ['manage_users', 'manage_roles'],
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(globalRoleData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(globalRoleData.name);
      expect(response.body.permissions).toEqual(globalRoleData.permissions);
      expect(response.body.resourceId).toBeNull();
    });

    it('should fail with invalid data', async () => {
      const invalidRoleData = {
        // Missing required name field
        permissions: ['read_users'],
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(invalidRoleData);

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const roleData = {
        name: 'Unauthorized Role',
        permissions: ['read_users'],
      };

      const response = await request(app)
        .post('/api/roles')
        .send(roleData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/roles/available', () => {
    it('should return available roles for UI consumption', async () => {
      const response = await request(app)
        .get('/api/roles/available')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check that roles are ordered by name
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i-1].name.localeCompare(response.body[i].name)).toBeLessThanOrEqual(0);
      }
    });

    it('should include resource information', async () => {
      const response = await request(app)
        .get('/api/roles/available')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(response.status).toBe(200);

      // Find the test role and verify it includes resource info
      const testRole = response.body.find((role: any) => role.id === testRoleId);
      expect(testRole).toBeDefined();
      expect(testRole.resource).toBeDefined();
      expect(testRole.resource.name).toBe('Test Resource');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/roles/available');

      expect(response.status).toBe(401);
    });
  });
});