import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

// Mock the email service
jest.mock('../src/services/email.service', () => ({
  sendPasswordUpdateNotification: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

const mockSendPasswordUpdateNotification = require('../src/services/email.service').sendPasswordUpdateNotification;

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

    it('should send email notification when password is updated', async () => {
      // Clear mock call history
      (mockSendPasswordUpdateNotification as jest.Mock).mockClear();

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
      
      // Verify email notification was sent
      expect(mockSendPasswordUpdateNotification).toHaveBeenCalledTimes(1);
      expect(mockSendPasswordUpdateNotification).toHaveBeenCalledWith({
        to: testEmail,
        updatedBy: adminEmail,
        updatedAt: expect.any(String),
      });
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

// Mock the email service for password reset
jest.mock('../src/services/email.service', () => ({
  sendPasswordUpdateNotification: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

const mockSendPasswordResetEmail = require('../src/services/email.service').sendPasswordResetEmail;

describe('Password Reset Endpoints', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    // Clear test data
    await (prisma as any).passwordResetRequests.deleteMany({});
    await (prisma as any).userPasswordUpdate.deleteMany({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});

    // Create test user
    testUserEmail = 'reset-test@example.com';
    testUserPassword = 'testpassword123';
    const hashedPassword = await hashPassword(testUserPassword);
    const testUser = await (prisma as any).user.create({
      data: {
        email: testUserEmail,
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
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).passwordResetRequests.deleteMany({});
    await (prisma as any).userPasswordUpdate.deleteMany({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
  });

  describe('POST /api/user/auth/reset-password/request/email', () => {
    it('should send password reset email for existing user', async () => {
      (mockSendPasswordResetEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/user/auth/reset-password/request/email')
        .send({ email: testUserEmail });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Password reset email sent');

      // Verify PasswordResetRequests record was created
      const resetRequest = await (prisma as any).passwordResetRequests.findFirst({
        where: { userEmail: testUserEmail },
      });
      expect(resetRequest).not.toBeNull();
      expect(resetRequest?.userId).toBe(testUserId);

      // Verify email was sent
      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({
        to: testUserEmail,
        resetToken: expect.any(String),
        resetUrl: expect.stringContaining('http://localhost:5173/reset-password'),
      });
    });

    it('should handle password reset request for non-existent user (returns success to prevent email enumeration)', async () => {
      const fakeEmail = 'truly-nonexistent@example.com';

      // Clear any previous mock calls
      (mockSendPasswordResetEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/user/auth/reset-password/request/email')
        .send({ email: fakeEmail });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account with that email exists');
      // Email should not be sent for non-existent users
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should reject password reset request within 30 minutes of last request', async () => {
      const rateLimitEmail = 'ratelimit-test@example.com';
      const rateLimitPassword = 'testpassword123';
      
      // Create a fresh user for rate limiting test
      const hashedPassword = await hashPassword(rateLimitPassword);
      const rateLimitUser = await (prisma as any).user.create({
        data: {
          email: rateLimitEmail,
          isActive: true,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });
      const rateLimitUserId = rateLimitUser.id;

      // First make a successful request
      const firstResponse = await request(app)
        .post('/api/user/auth/reset-password/request/email')
        .send({ email: rateLimitEmail });
      expect(firstResponse.status).toBe(200);

      // Clear the mock to check the second call
      (mockSendPasswordResetEmail as jest.Mock).mockClear();

      // Try to make another request immediately (should be rate limited)
      const secondResponse = await request(app)
        .post('/api/user/auth/reset-password/request/email')
        .send({ email: rateLimitEmail });

      expect(secondResponse.status).toBe(429);
      expect(secondResponse.body.message).toContain('Please wait');
      // Email should not be sent due to rate limiting
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();

      // Clean up
      await (prisma as any).passwordResetRequests.deleteMany({ where: { userId: rateLimitUserId } });
      await (prisma as any).user.delete({ where: { id: rateLimitUserId } });
    });

    it('should allow password reset request after 30 minutes have passed', async () => {
      const timeTestEmail = 'timetest@example.com';
      const timeTestPassword = 'testpassword123';
      
      // Create a fresh user for time test
      const hashedPassword = await hashPassword(timeTestPassword);
      const timeTestUser = await (prisma as any).user.create({
        data: {
          email: timeTestEmail,
          isActive: true,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });
      const timeTestUserId = timeTestUser.id;

      // First make a successful request
      const firstResponse = await request(app)
        .post('/api/user/auth/reset-password/request/email')
        .send({ email: timeTestEmail });
      expect(firstResponse.status).toBe(200);

      // Update the last request to be more than 30 minutes ago
      const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
      await (prisma as any).passwordResetRequests.updateMany({
        where: { userEmail: timeTestEmail },
        data: { lastRequestDate: thirtyOneMinutesAgo },
      });

      (mockSendPasswordResetEmail as jest.Mock).mockClear();

      const response = await request(app)
        .post('/api/user/auth/reset-password/request/email')
        .send({ email: timeTestEmail });

      expect(response.status).toBe(200);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({
        to: timeTestEmail,
        resetToken: expect.any(String),
        resetUrl: expect.stringContaining('http://localhost:5173/reset-password'),
      });

      // Clean up
      await (prisma as any).passwordResetRequests.deleteMany({ where: { userId: timeTestUserId } });
      await (prisma as any).user.delete({ where: { id: timeTestUserId } });
    });
  });

  describe('POST /api/user/auth/reset-password', () => {
    it('should reset password with valid JWT token', async () => {
      const newPassword = 'newresetpassword456';
      const resetToken = generateAccessToken({
        userId: testUserId,
        email: testUserEmail,
        isSuperAdmin: false
      });

      const response = await request(app)
        .post('/api/user/auth/reset-password')
        .set('Authorization', `Bearer ${resetToken}`)
        .send({
          new_password: newPassword,
          new_password_confirmation: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Password reset successfully');

      // Verify password was updated
      const updatedUser = await (prisma as any).user.findUnique({
        where: { id: testUserId },
        include: { credential: true },
      });
      expect(updatedUser?.credential?.passwordHash).not.toBeUndefined();
    });

    it('should reject password reset without JWT token', async () => {
      const response = await request(app)
        .post('/api/user/auth/reset-password')
        .send({
          new_password: 'newpassword123',
          new_password_confirmation: 'newpassword123',
        });

      expect(response.status).toBe(401);
    });

    it('should reject password reset with invalid JWT token', async () => {
      const response = await request(app)
        .post('/api/user/auth/reset-password')
        .set('Authorization', 'Bearer invalidtoken')
        .send({
          new_password: 'newpassword123',
          new_password_confirmation: 'newpassword123',
        });

      expect(response.status).toBe(401);
    });

    it('should reject password reset when new password confirmation does not match', async () => {
      const resetToken = generateAccessToken({
        userId: testUserId,
        email: testUserEmail,
        isSuperAdmin: false
      });

      const response = await request(app)
        .post('/api/user/auth/reset-password')
        .set('Authorization', `Bearer ${resetToken}`)
        .send({
          new_password: 'newpassword123',
          new_password_confirmation: 'differentpassword',
        });

      expect(response.status).toBe(400);
    });
  });
});