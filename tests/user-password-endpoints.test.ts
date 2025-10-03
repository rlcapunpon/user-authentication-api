import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('User Password Update Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;
  let otherUserId: string;
  let otherUserToken: string;

  const testEmail = 'testuser-password@example.com';
  const testPassword = 'testpassword123';
  const newPassword = 'newpassword456';
  const adminEmail = 'admin-password@example.com';
  const adminPassword = 'adminpassword123';
  const otherEmail = 'otheruser-password@example.com';
  const otherPassword = 'otherpassword123';

  beforeAll(async () => {
    // Clear test data
    await (prisma as any).userPasswordUpdate.deleteMany({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});

    // Create regular test user
    const hashedPassword = await hashPassword(testPassword);
    const testUser = await (prisma as any).user.create({
      data: {
        email: testEmail,
        isActive: true,
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    testUserId = testUser.id;
    testUserToken = generateAccessToken({ userId: testUserId, email: testEmail, isSuperAdmin: false });

    // Create admin user
    const adminHashedPassword = await hashPassword(adminPassword);
    const adminUser = await (prisma as any).user.create({
      data: {
        email: adminEmail,
        isActive: true,
        isSuperAdmin: true,
        credential: {
          create: {
            passwordHash: adminHashedPassword,
          },
        },
      },
    });
    adminUserId = adminUser.id;
    adminUserToken = generateAccessToken({ userId: adminUserId, email: adminEmail, isSuperAdmin: true });

    // Create another regular user
    const otherHashedPassword = await hashPassword(otherPassword);
    const otherUser = await (prisma as any).user.create({
      data: {
        email: otherEmail,
        isActive: true,
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: otherHashedPassword,
          },
        },
      },
    });
    otherUserId = otherUser.id;
    otherUserToken = generateAccessToken({ userId: otherUserId, email: otherEmail, isSuperAdmin: false });
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).userPasswordUpdate.deleteMany({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
  });

  describe('POST /api/users/update/password', () => {
    it('should allow SUPERADMIN to update any user password without current password', async () => {
      const response = await request(app)
        .post('/api/users/update/password')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: testUserId,
          userEmail: testEmail,
          current_password: '', // Should be ignored for SUPERADMIN
          new_password: newPassword,
          new_password_confirmation: newPassword,
        });

      expect(response.status).toBe(200);
      // Verify password was updated
      const updatedUser = await (prisma as any).user.findUnique({
        where: { id: testUserId },
        include: { credential: true },
      });
      expect(updatedUser?.credential?.passwordHash).not.toBeUndefined();
      // Verify UserPasswordUpdate record was created
      const passwordUpdate = await (prisma as any).userPasswordUpdate.findFirst({
        where: { userId: testUserId },
      });
      expect(passwordUpdate).not.toBeNull();
      expect(passwordUpdate?.updatedBy).toBe(adminUserId);
    });

    it('should allow regular user to update their own password with correct current password', async () => {
      // Create a fresh user for this test since the previous test changed the password
      const freshUserEmail = 'freshuser-password@example.com';
      const freshUserPassword = 'freshpassword123';
      const freshNewPassword = 'freshnewpassword456';
      
      const freshHashedPassword = await hashPassword(freshUserPassword);
      const freshUser = await (prisma as any).user.create({
        data: {
          email: freshUserEmail,
          isActive: true,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: freshHashedPassword,
            },
          },
        },
      });
      const freshUserId = freshUser.id;
      const freshUserToken = generateAccessToken({ userId: freshUserId, email: freshUserEmail, isSuperAdmin: false });

      const response = await request(app)
        .post('/api/users/update/password')
        .set('Authorization', `Bearer ${freshUserToken}`)
        .send({
          userId: freshUserId,
          userEmail: freshUserEmail,
          current_password: freshUserPassword,
          new_password: freshNewPassword,
          new_password_confirmation: freshNewPassword,
        });

      expect(response.status).toBe(200);
      // Verify password was updated
      const updatedUser = await (prisma as any).user.findUnique({
        where: { id: freshUserId },
        include: { credential: true },
      });
      expect(updatedUser?.credential?.passwordHash).not.toBeUndefined();

      // Clean up
      await (prisma as any).userPasswordUpdate.deleteMany({ where: { userId: freshUserId } });
      await (prisma as any).user.delete({ where: { id: freshUserId } });
    });

    it('should reject regular user updating another user password', async () => {
      const response = await request(app)
        .post('/api/users/update/password')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          userId: testUserId,
          userEmail: testEmail,
          current_password: otherPassword,
          new_password: newPassword,
          new_password_confirmation: newPassword,
        });

      expect(response.status).toBe(403);
    });

    it('should reject when current password is incorrect', async () => {
      const response = await request(app)
        .post('/api/users/update/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          userId: testUserId,
          userEmail: testEmail,
          current_password: 'wrongpassword',
          new_password: newPassword,
          new_password_confirmation: newPassword,
        });

      expect(response.status).toBe(400);
    });

    it('should reject when new password confirmation does not match', async () => {
      const response = await request(app)
        .post('/api/users/update/password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          userId: testUserId,
          userEmail: testEmail,
          current_password: testPassword,
          new_password: newPassword,
          new_password_confirmation: 'differentpassword',
        });

      expect(response.status).toBe(400);
    });

    it('should reject when user not found', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/api/users/update/password')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          userId: fakeUserId,
          userEmail: 'fake@example.com',
          current_password: '',
          new_password: newPassword,
          new_password_confirmation: newPassword,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/last-update/creds/:userId', () => {
    it('should return password update history for existing user with updates', async () => {
      // First create a password update record
      await (prisma as any).userPasswordUpdate.create({
        data: {
          userId: testUserId,
          updatedBy: adminUserId,
        },
      });

      const response = await request(app)
        .get(`/api/users/last-update/creds/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('last_update');
      expect(response.body).toHaveProperty('updated_by');
      expect(response.body).toHaveProperty('how_many');
      expect(response.body.how_many).toBeGreaterThan(0);
    });

    it('should return null values for user with no password updates', async () => {
      const response = await request(app)
        .get(`/api/users/last-update/creds/${otherUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.last_update).toBeNull();
      expect(response.body.updated_by).toBeNull();
      expect(response.body.how_many).toBe(0);
    });

    it('should reject when user not found', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/users/last-update/creds/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject when regular user tries to access another user history', async () => {
      const response = await request(app)
        .get(`/api/users/last-update/creds/${testUserId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });
});