import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { generateAccessToken } from '../src/utils/jwt';
import bcrypt from 'bcrypt';

describe('Admin User Management', () => {
  let superAdminToken: string;
  let adminToken: string;
  let regularUserToken: string;
  let superAdminId: string;
  let adminId: string;
  let regularUserId: string;

  beforeAll(async () => {
    // Clear the database using truncate for a clean test state
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);

    // Seed roles and permissions
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPERADMIN' },
      update: {},
      create: { name: 'SUPERADMIN', description: 'Super Administrator' },
    });
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Administrator' },
    });
    const clientRole = await prisma.role.upsert({
      where: { name: 'CLIENT' },
      update: {},
      create: { name: 'CLIENT', description: 'Client User' },
    });

    const createUserPermission = await prisma.permission.upsert({
      where: { name: 'create_user' },
      update: {},
      create: { name: 'create_user', description: 'Create users' },
    });
    const readUsersPermission = await prisma.permission.upsert({
      where: { name: 'read_users' },
      update: {},
      create: { name: 'read_users', description: 'Read users' },
    });
    const updateUsersPermission = await prisma.permission.upsert({
      where: { name: 'update_users' },
      update: {},
      create: { name: 'update_users', description: 'Update users' },
    });
    const deleteUserPermission = await prisma.permission.upsert({
      where: { name: 'delete_user' },
      update: {},
      create: { name: 'delete_user', description: 'Delete users' },
    });
    const readUserSelfPermission = await prisma.permission.upsert({
      where: { name: 'read_user_self' },
      update: {},
      create: { name: 'read_user_self', description: 'Read own user profile' },
    });
    const updateUserSelfPermission = await prisma.permission.upsert({
      where: { name: 'update_user_self' },
      update: {},
      create: { name: 'update_user_self', description: 'Update own user profile' },
    });

    // Assign all permissions to SUPERADMIN role
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: createUserPermission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: createUserPermission.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: readUsersPermission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: readUsersPermission.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: updateUsersPermission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: updateUsersPermission.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: deleteUserPermission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: deleteUserPermission.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: readUserSelfPermission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: readUserSelfPermission.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: updateUserSelfPermission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: updateUserSelfPermission.id },
    });

    // Assign a subset of permissions to ADMIN role
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: readUsersPermission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: readUsersPermission.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: readUserSelfPermission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: readUserSelfPermission.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: updateUserSelfPermission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: updateUserSelfPermission.id },
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const superAdmin = await prisma.user.create({
      data: { 
        email: 'superadmin@example.com', 
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword
          }
        }
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: superAdmin.id, roleId: superAdminRole.id },
    });
    superAdminId = superAdmin.id;
    superAdminToken = generateAccessToken({ userId: superAdmin.id, roles: [superAdminRole.name] });

    const admin = await prisma.user.create({
      data: { 
        email: 'admin@example.com', 
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword
          }
        }
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
    adminId = admin.id;
    adminToken = generateAccessToken({ userId: admin.id, roles: [adminRole.name] });

    const regularUser = await prisma.user.create({
      data: { 
        email: 'user@example.com', 
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword
          }
        }
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: regularUser.id, roleId: clientRole.id } },
      update: {},
      create: { userId: regularUser.id, roleId: clientRole.id },
    });
    regularUserId = regularUser.id;
    regularUserToken = generateAccessToken({ userId: regularUser.id, roles: [clientRole.name] });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // GET /users
  it('should allow SUPER_ADMIN to list all users', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3); // superadmin, admin, user
    expect(res.body[0]).toHaveProperty('email');
    expect(res.body[0]).toHaveProperty('roles');
  });

  it('should allow ADMIN to list all users', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('should not allow regular CLIENT to list all users', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${regularUserToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should not allow unauthenticated user to list all users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toEqual(401);
  });

  // GET /users/:id
  it('should allow SUPER_ADMIN to get a user by ID', async () => {
    const res = await request(app).get(`/api/users/${regularUserId}`).set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', regularUserId);
    expect(res.body).toHaveProperty('email', 'user@example.com');
    expect(res.body).toHaveProperty('roles');
  });

  it('should allow ADMIN to get a user by ID', async () => {
    const res = await request(app).get(`/api/users/${regularUserId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', regularUserId);
  });

  it('should not allow regular CLIENT to get another user by ID', async () => {
    const res = await request(app).get(`/api/users/${adminId}`).set('Authorization', `Bearer ${regularUserToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should return 404 for non-existent user ID', async () => {
    // Create a user, then delete it to ensure a valid but non-existent ID
    const tempUser = await prisma.user.create({
      data: {
        email: 'tempuser_get404@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: await bcrypt.hash('password123', 10)
          }
        }
      },
    });
    await prisma.user.delete({ where: { id: tempUser.id } });

    const res = await request(app).get(`/api/users/${tempUser.id}`).set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toEqual(404);
  });

  // POST /users
  it('should allow SUPER_ADMIN to create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'newuser@example.com',
        password: 'newpassword123',
        roles: ['CLIENT'],
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'newuser@example.com');
    expect(res.body.roles[0].role.name).toEqual('CLIENT');
  });

  it('should not allow ADMIN to create a new user (missing permission)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'admincreated@example.com',
        password: 'password123',
        roles: ['CLIENT'],
      });
    expect(res.statusCode).toEqual(403); // ADMIN does not have create_user permission in this test setup
  });

  it('should not allow regular CLIENT to create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${regularUserToken}`)
      .send({
        email: 'usercreated@example.com',
        password: 'password123',
        roles: ['CLIENT'],
      });
    expect(res.statusCode).toEqual(403);
  });

  it('should return 400 for invalid user creation input', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'invalid-email',
        password: 'short',
      });
    expect(res.statusCode).toEqual(400);
  });

  // PUT /users/:id/roles
  it('should allow SUPER_ADMIN to update user roles', async () => {
    const userToUpdate = await prisma.user.create({
      data: { 
        email: 'updateuserroles@example.com', 
        isActive: true,
        credential: {
          create: {
            passwordHash: await bcrypt.hash('password123', 10)
          }
        }
      },
    });
    await prisma.userRole.create({ data: { userId: userToUpdate.id, roleId: (await prisma.role.findUnique({ where: { name: 'CLIENT' } }))!.id } });

    const res = await request(app)
      .put(`/api/users/${userToUpdate.id}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        roles: ['ADMIN', 'CLIENT'],
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.roles.some((r: any) => r.role.name === 'ADMIN')).toBe(true);
    expect(res.body.roles.some((r: any) => r.role.name === 'CLIENT')).toBe(true);
  });

  it('should not allow ADMIN to update user roles (missing permission)', async () => {
    const userToUpdate = await prisma.user.create({
      data: { 
        email: 'adminupdate@example.com', 
        isActive: true,
        credential: {
          create: {
            passwordHash: await bcrypt.hash('password123', 10)
          }
        }
      },
    });
    await prisma.userRole.create({ data: { userId: userToUpdate.id, roleId: (await prisma.role.findUnique({ where: { name: 'CLIENT' } }))!.id } });

    const res = await request(app)
      .put(`/api/users/${userToUpdate.id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        roles: ['ADMIN'],
      });
    expect(res.statusCode).toEqual(403);
  });

  it('should return 400 for invalid role update input', async () => {
    const res = await request(app)
      .put(`/api/users/${regularUserId}/roles`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        roles: ['NON_EXISTENT_ROLE'],
      });
    expect(res.statusCode).toEqual(400);
  });

  // DELETE /users/:id
  it('should allow SUPER_ADMIN to delete a user', async () => {
    const userToDelete = await prisma.user.create({
      data: { 
        email: 'deleteme@example.com', 
        isActive: true,
        credential: {
          create: {
            passwordHash: await bcrypt.hash('password123', 10)
          }
        }
      },
    });

    const res = await request(app)
      .delete(`/api/users/${userToDelete.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toEqual(204);

    const deletedUser = await prisma.user.findUnique({ where: { id: userToDelete.id } });
    expect(deletedUser).toBeNull();
  });

  it('should not allow ADMIN to delete a user (missing permission)', async () => {
    const userToDelete = await prisma.user.create({
      data: { 
        email: 'admindelete@example.com', 
        isActive: true,
        credential: {
          create: {
            passwordHash: await bcrypt.hash('password123', 10)
          }
        }
      },
    });

    const res = await request(app)
      .delete(`/api/users/${userToDelete.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(403);
  });

  it('should return 404 for deleting non-existent user', async () => {
    // Create a user, then delete it to ensure a valid but non-existent ID
    const tempUser = await prisma.user.create({
      data: {
        email: 'tempuser_delete404@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: await bcrypt.hash('password123', 10)
          }
        }
      },
    });
    await prisma.user.delete({ where: { id: tempUser.id } });

    const res = await request(app)
      .delete(`/api/users/${tempUser.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.statusCode).toEqual(404);
  });
});
