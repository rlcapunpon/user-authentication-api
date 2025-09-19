import request from 'supertest';
import app from '@src/app';
import { prisma } from '@src/db';
import { generateAccessToken } from '@src/utils/jwt';
import bcrypt from 'bcrypt';
import * as rbacService from '@src/services/rbac.service';

describe('RBAC Endpoints', () => {
  let superAdminToken: string;

  // This beforeEach will run before each test in this describe block
  beforeEach(async () => {
    // Clear the database before each test
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.credential.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});

    // Seed data for each test
    const superAdminRole = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Super Administrator' },
    });

    const perm1 = await prisma.permission.create({
      data: { name: 'test_perm_1', description: 'Test Permission 1' },
    });
    const perm2 = await prisma.permission.create({
      data: { name: 'test_perm_2', description: 'Test Permission 2' },
    });

    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm1.id },
    });
    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm2.id },
    });

    const hashedPassword = await bcrypt.hash('password123', 10);
    const superAdmin = await prisma.user.create({
      data: {
        email: 'rbacadmin@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    await prisma.userRole.create({ data: { userId: superAdmin.id, roleId: superAdminRole.id } });
    superAdminToken = generateAccessToken({ userId: superAdmin.id, roles: [superAdminRole.name] });
  });

  // This afterEach will run after each test in this describe block
  afterEach(async () => {
    // Disconnect Prisma client after each test to ensure fresh state
    await prisma.$disconnect();
  });

  describe('GET /permissions', () => {
    it('should return a list of all permissions', async () => {
      const res = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body).toContainEqual(expect.objectContaining({ name: 'test_perm_1' }));
      expect(res.body).toContainEqual(expect.objectContaining({ name: 'test_perm_2' }));
    });

    it('should return empty array if no permissions exist', async () => {
      await prisma.rolePermission.deleteMany({});
      await prisma.permission.deleteMany({});

      const res = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /roles', () => {
    it('should return a list of all roles', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body).toContainEqual(expect.objectContaining({ name: 'SUPER_ADMIN' }));
    });

    it('should include roles with correct permission mappings', async () => {
      const roles = await rbacService.getAllRoles();
      const superAdminRoleData = roles.find((r: any) => r.name === 'SUPER_ADMIN');
      expect(superAdminRoleData).toBeDefined();
      if (superAdminRoleData) {
        expect(superAdminRoleData.permissions).toBeInstanceOf(Array);
        expect(superAdminRoleData.permissions).toContainEqual(expect.objectContaining({ permission: { name: 'test_perm_1' } }));
        expect(superAdminRoleData.permissions).toContainEqual(expect.objectContaining({ permission: { name: 'test_perm_2' } }));
      }
    });
  });

  describe('Error Handling', () => {
    let getAllRolesSpy: jest.SpyInstance;
    let getAllPermissionsSpy: jest.SpyInstance;

    beforeEach(() => {
      getAllRolesSpy = jest.spyOn(rbacService, 'getAllRoles');
      getAllPermissionsSpy = jest.spyOn(rbacService, 'getAllPermissions');
    });

    afterEach(() => {
      getAllRolesSpy.mockRestore();
      getAllPermissionsSpy.mockRestore();
    });

    it('should return 500 if getAllRoles throws an error', async () => {
      getAllRolesSpy.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ message: 'Failed to fetch roles' });
    });

    it('should return 500 if getAllPermissions throws an error', async () => {
      getAllPermissionsSpy.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ message: 'Failed to fetch permissions' });
    });
  });
});

describe('RBAC Authorization Tests', () => {
  let superAdminToken: string;
  let regularUserToken: string;
  let noRoleUserToken: string;

  beforeAll(async () => {
    // Clear database for this specific test suite
    await prisma.userRole.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.credential.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});

    // Seed roles and permissions for testing
    const superAdminRole = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Super Administrator' },
    });
    const regularUserRole = await prisma.role.create({
      data: { name: 'REGULAR_USER', description: 'Regular User' },
    });

    const perm1 = await prisma.permission.create({
      data: { name: 'test_perm_1', description: 'Test Permission 1' },
    });
    const perm2 = await prisma.permission.create({
      data: { name: 'test_perm_2', description: 'Test Permission 2' },
    });

    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm1.id },
    });
    await prisma.rolePermission.create({
      data: { roleId: superAdminRole.id, permissionId: perm2.id },
    });

    const hashedPassword = await bcrypt.hash('password123', 10);

    const superAdmin = await prisma.user.create({
      data: {
        email: 'rbacadmin@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    await prisma.userRole.create({ data: { userId: superAdmin.id, roleId: superAdminRole.id } });
    superAdminToken = generateAccessToken({ userId: superAdmin.id, roles: [superAdminRole.name] });

    const regularUser = await prisma.user.create({
      data: {
        email: 'regularuser@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    await prisma.userRole.create({ data: { userId: regularUser.id, roleId: regularUserRole.id } });
    regularUserToken = generateAccessToken({ userId: regularUser.id, roles: [regularUserRole.name] });

    const noRoleUser = await prisma.user.create({
      data: {
        email: 'noroleuser@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    noRoleUserToken = generateAccessToken({ userId: noRoleUser.id, roles: [] });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return 401 for unauthenticated access to /roles', async () => {
    const res = await request(app).get('/api/roles');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 403 for regular user access to /roles', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${regularUserToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should return 403 for user with no roles access to /roles', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${noRoleUserToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should return 401 for unauthenticated access to /permissions', async () => {
    const res = await request(app).get('/api/permissions');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 403 for regular user access to /permissions', async () => {
    const res = await request(app)
      .get('/api/permissions')
      .set('Authorization', `Bearer ${regularUserToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should return 403 for user with no roles access to /permissions', async () => {
    const res = await request(app)
      .get('/api/permissions')
      .set('Authorization', `Bearer ${noRoleUserToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should allow SUPER_ADMIN to access /roles', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toEqual(200);
  });

  it('should allow SUPER_ADMIN to access /permissions', async () => {
    const res = await request(app)
      .get('/api/permissions')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toEqual(200);
  });
});
