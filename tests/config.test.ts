import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';

describe('Config Endpoints', () => {
  beforeAll(async () => {
    // Clear the database using truncate for a clean test state
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);

    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPERADMIN' },
      update: {},
      create: { name: 'SUPERADMIN', description: 'Full access' },
    });
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Admin access' },
    });

    const createUserPerm = await prisma.permission.upsert({
      where: { name: 'create_user' },
      update: {},
      create: { name: 'create_user', description: 'Create users' },
    });
    const readUsersPerm = await prisma.permission.upsert({
      where: { name: 'read_users' },
      update: {},
      create: { name: 'read_users', description: 'Read all users' },
    });
    const updateUsersPerm = await prisma.permission.upsert({
      where: { name: 'update_users' },
      update: {},
      create: { name: 'update_users', description: 'Update any user' },
    });
    const deleteUserPerm = await prisma.permission.upsert({
      where: { name: 'delete_user' },
      update: {},
      create: { name: 'delete_user', description: 'Delete any user' },
    });
    const readUserSelfPerm = await prisma.permission.upsert({
      where: { name: 'read_user_self' },
      update: {},
      create: { name: 'read_user_self', description: 'Read own user profile' },
    });
    const updateUserSelfPerm = await prisma.permission.upsert({
      where: { name: 'update_user_self' },
      update: {},
      create: { name: 'update_user_self', description: 'Update own user profile' },
    });

    // Assign all permissions to SUPERADMIN role
    const allPermissions = [createUserPerm, readUsersPerm, updateUsersPerm, deleteUserPerm, readUserSelfPerm, updateUserSelfPerm];
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: perm.id },
      });
    }

    // Assign a subset of permissions to ADMIN role
    const adminPermissions = [readUsersPerm, readUserSelfPerm, updateUserSelfPerm];
    for (const perm of adminPermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return system-wide default role-permission mapping', async () => {
    const res = await request(app).get('/api/config/permissions');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);

    const superAdminRoleData = res.body.find((r: any) => r.role === 'SUPERADMIN');
    expect(superAdminRoleData).toBeDefined();
    expect(superAdminRoleData.permissions).toContain('create_user');
    expect(superAdminRoleData.permissions).toContain('read_users');
    expect(superAdminRoleData.permissions).toContain('update_users');
    expect(superAdminRoleData.permissions).toContain('delete_user');
    expect(superAdminRoleData.permissions).toContain('read_user_self');
    expect(superAdminRoleData.permissions).toContain('update_user_self');

    const adminRoleData = res.body.find((r: any) => r.role === 'ADMIN');
    expect(adminRoleData).toBeDefined();
    expect(adminRoleData.permissions).toContain('read_users');
    expect(adminRoleData.permissions).toContain('read_user_self');
    expect(adminRoleData.permissions).toContain('update_user_self');
    expect(adminRoleData.permissions).not.toContain('create_user');
    expect(adminRoleData.permissions).not.toContain('delete_user');
    expect(adminRoleData.permissions).not.toContain('update_users');
  });
});
