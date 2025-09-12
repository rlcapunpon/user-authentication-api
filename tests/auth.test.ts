import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../src/utils/jwt';

describe('Auth Flow', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Clear the database using truncate for a clean test state
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);

    // Seed roles and permissions for testing /me endpoint
    await prisma.role.upsert({
      where: { name: 'CLIENT' },
      update: {},
      create: { name: 'CLIENT', description: 'Client User' },
    });
    await prisma.permission.upsert({
      where: { name: 'read_user_self' },
      update: {},
      create: { name: 'read_user_self', description: 'Read own user data' },
    });

    const userRole = (await prisma.role.findUnique({ where: { name: 'CLIENT' } }))!;
    const readSelfPermission = (await prisma.permission.findUnique({ where: { name: 'read_user_self' } }))!;

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: readSelfPermission.id } },
      update: {},
      create: { roleId: userRole.id, permissionId: readSelfPermission.id },
    });

    // Register a user for /me tests
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'meuser@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    userId = user.id;

    // Assign the 'CLIENT' role to the newly created user
    await prisma.userRole.create({ data: { userId: userId, roleId: userRole.id } });

    // Generate token with roles in payload
    userToken = generateAccessToken({ userId: userId, roles: [userRole.name] });

  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'test@example.com');
  });

  it('should login the user and return tokens', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should get user profile using access token including roles and permissions', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', 'meuser@example.com');
    expect(res.body).toHaveProperty('roles');
    expect(res.body.roles[0].role.name).toEqual('CLIENT');
    const permissions = res.body.roles.flatMap((role: any) => role.role.permissions.map((p: any) => p.permission.name));
    expect(permissions).toContain('read_user_self');
  });

  it('should update user email', async () => {
    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        email: 'updatedmeuser@example.com',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', 'updatedmeuser@example.com');
  });

  it('should update user password with old password verification', async () => {
    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        oldPassword: 'password123',
        newPassword: 'newpassword123',
      });
    expect(res.statusCode).toEqual(200);

    // Try logging in with new password
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'updatedmeuser@example.com',
        password: 'newpassword123',
      });
    expect(loginRes.statusCode).toEqual(200);
  });

  it('should not update password with incorrect old password', async () => {
    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        oldPassword: 'wrongpassword',
        newPassword: 'anothernewpassword',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Invalid old password');
  });

  it('should refresh access token using refresh token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    const refreshToken = loginRes.body.refreshToken;

    const res = await request(app)
      .post('/auth/refresh')
      .send({
        refreshToken,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should logout the user and revoke refresh token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    const refreshToken = loginRes.body.refreshToken;

    const res = await request(app)
      .post('/auth/logout')
      .send({
        refreshToken,
      });
    expect(res.statusCode).toEqual(204);
  });

  it('should deactivate user account', async () => {
    const res = await request(app)
      .delete('/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(204);

    // Verify user is inactive
    const inactiveUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(inactiveUser?.isActive).toBe(false);
  });
});
