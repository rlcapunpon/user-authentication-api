import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';

describe('Authentication Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let testRefreshToken: string;
  const testEmail = 'testuser-auth@example.com';
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    // Clear test data and create a test user
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userVerification.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    await (prisma as any).resourceStatus.deleteMany({});
    
    // Create required roles and resources for tests
    const superAdminRole = await (prisma as any).role.create({
      data: {
        name: 'SUPERADMIN',
        description: 'Global super admin role with full system access',
        permissions: ['*'],
      },
    });
    
    const windbooksAppResource = await (prisma as any).resource.create({
      data: {
        name: 'WINDBOOKS_APP',
        description: 'Main frontend application resource for global role assignments',
      },
    });

    // Create ResourceStatus ACTIVE for the WINDBOOKS_APP resource
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: windbooksAppResource.id,
        status: 'ACTIVE',
      },
    });
    
    // Create test user
    const hashedPassword = await hashPassword(testPassword);
    const testUser = await (prisma as any).user.create({
      data: {
        email: testEmail,
        isActive: true,
        isSuperAdmin: false,
      },
    });
    testUserId = testUser.id;

    // Create Credential record separately
    await (prisma as any).credential.create({
      data: {
        userId: testUserId,
        passwordHash: hashedPassword,
      },
    });

    // Create UserVerification record separately
    await (prisma as any).userVerification.create({
      data: {
        userId: testUserId,
        isEmailVerified: true,
        verificationStatus: 'verified',
        userStatus: 'active',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).userVerification.deleteMany({});
    await (prisma as any).credential.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    await (prisma as any).resourceStatus.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      
      // Store tokens for subsequent tests
      testUserToken = response.body.accessToken;
      testRefreshToken = response.body.refreshToken;
    });

    it('should include role field in JWT payload', async () => {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(testUserToken);
      
      expect(decoded).toHaveProperty('role');
      expect(typeof decoded.role).toBe('string');
      // For a user with no roles, should default to 'User'
      expect(decoded.role).toBe('User');
      
      // Verify other JWT payload fields are present
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('isSuperAdmin');
      expect(decoded).toHaveProperty('permissions');
      expect(decoded).toHaveProperty('username');
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.isSuperAdmin).toBe(false);
      expect(Array.isArray(decoded.permissions)).toBe(true);
      expect(decoded.username).toBe(testEmail);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: testPassword,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testPassword,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail login for deactivated user', async () => {
      // Create a deactivated user
      const deactivatedEmail = 'deactivated@example.com';
      const deactivatedPassword = 'testpassword123';
      const hashedPassword = await hashPassword(deactivatedPassword);
      
      const deactivatedUser = await (prisma as any).user.create({
        data: {
          email: deactivatedEmail,
          isActive: false, // User is deactivated
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });

      // Create UserVerification record for deactivated user
      await (prisma as any).userVerification.create({
        data: {
          userId: deactivatedUser.id,
          isEmailVerified: true, // User is verified but deactivated
          verificationStatus: 'verified',
          userStatus: 'active',
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: deactivatedEmail,
          password: deactivatedPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Account is deactivated');

      // Cleanup
      await (prisma as any).user.delete({ where: { id: deactivatedUser.id } });
    });
  });

  describe('GET /api/auth/me', () => {
    beforeAll(async () => {
      // Ensure we have a valid token for testing
      if (!testUserToken) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          })
          .expect(200);
        
        testUserToken = loginResponse.body.accessToken;
      }

      // Assign a role to the test user for testing resourceName inclusion
      const testRole = await (prisma as any).role.findFirst({
        where: { name: 'SUPERADMIN' },
      });
      const windbooksAppResource = await (prisma as any).resource.findFirst({
        where: { name: 'WINDBOOKS_APP' },
      });

      if (testRole && windbooksAppResource) {
        await (prisma as any).userResourceRole.upsert({
          where: {
            userId_roleId_resourceId: {
              userId: testUserId,
              roleId: testRole.id,
              resourceId: windbooksAppResource.id,
            },
          },
          update: {},
          create: {
            userId: testUserId,
            roleId: testRole.id,
            resourceId: windbooksAppResource.id,
          },
        });
      }
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('email', testEmail);
      expect(response.body).toHaveProperty('isSuperAdmin', true); // User now has SUPERADMIN role
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
      
      // Check that resources array includes resourceName
      if (response.body.resources.length > 0) {
        expect(response.body.resources[0]).toHaveProperty('resourceId');
        expect(response.body.resources[0]).toHaveProperty('role');
        expect(response.body.resources[0]).toHaveProperty('resourceName');
      }
      
      // Should not include sensitive data like passwordHash
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid token');
    });

    it('should fail with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', testUserToken) // Missing "Bearer "
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No token provided');
    });

    it('should fail with expired token', async () => {
      // Create an expired token for testing
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUserId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: testRefreshToken,
        })
        .expect(204);

      // 204 No Content means no response body
    });

    it('should handle invalid refresh token gracefully (idempotent)', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(204);

      // No response body for 204 status
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail when trying to logout with already used refresh token', async () => {
      // Try to logout again with the same refresh token
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: testRefreshToken,
        })
        .expect(204); // Logout should be idempotent, so it might still return 204

      // No assertions needed for 204 response
    });
  });

  describe('POST /api/auth/refresh', () => {
    let newRefreshToken: string;

    beforeAll(async () => {
      // Create a fresh login to get a new refresh token for testing
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);
      
      newRefreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh tokens successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: newRefreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      
      // New refresh token should be different from the old one
      expect(response.body.refreshToken).not.toBe(newRefreshToken);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail when trying to reuse an already used refresh token', async () => {
      // Try to use the original refresh token again (should be revoked)
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: newRefreshToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full authentication flow', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body;

      // 2. Get user profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe(testEmail);

      // 3. Refresh tokens
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.body;

      // 4. Use new access token
      const newProfileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(newProfileResponse.body.email).toBe(testEmail);

      // 5. Logout
      await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: newRefreshToken })
        .expect(204);

      // 6. Verify refresh token is invalidated
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: newRefreshToken })
        .expect(401);
    });

    it('should handle super admin user correctly', async () => {
      // Create super admin user
      const superAdminEmail = 'superadmin-auth@example.com';
      const superAdminPassword = 'superadminpass123';
      const hashedPassword = await hashPassword(superAdminPassword);
      
      const superAdminUser = await (prisma as any).user.create({
        data: {
          email: superAdminEmail,
          isActive: true,
          isSuperAdmin: true,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });

      // Create UserVerification record for super admin user
      await (prisma as any).userVerification.create({
        data: {
          userId: superAdminUser.id,
          isEmailVerified: true,
          verificationStatus: 'verified',
          userStatus: 'active',
        },
      });

      // Get the SUPERADMIN role and WINDBOOKS_APP resource
      const superAdminRole = await (prisma as any).role.findFirst({
        where: { name: 'SUPERADMIN' },
      });
      const windbooksAppResource = await (prisma as any).resource.findFirst({
        where: { name: 'WINDBOOKS_APP' },
      });

      // Assign SUPERADMIN role to WINDBOOKS_APP resource for the user
      await (prisma as any).userResourceRole.create({
        data: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
          resourceId: windbooksAppResource.id,
        },
      });

      // Login as super admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: superAdminEmail,
          password: superAdminPassword,
        })
        .expect(200);

      // Get profile and verify super admin flag
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(profileResponse.body.isSuperAdmin).toBe(true);
      expect(profileResponse.body.email).toBe(superAdminEmail);

      // Verify that SUPERADMIN users get empty resources array (they have access to all resources)
      expect(profileResponse.body).toHaveProperty('resources');
      expect(Array.isArray(profileResponse.body.resources)).toBe(true);
      
      // SUPERADMIN should have empty resources array since they have access to everything
      expect(profileResponse.body.resources.length).toBe(0);

      // Verify JWT contains Super Admin role
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(loginResponse.body.accessToken);
      expect(decoded).toHaveProperty('role');
      expect(decoded.role).toBe('Super Admin');
      expect(decoded.isSuperAdmin).toBe(true);
      expect(decoded.permissions).toEqual(['*']); // Super admin has all permissions
      expect(decoded).toHaveProperty('username');
      expect(decoded.username).toBe(superAdminEmail);

      // Cleanup
      await (prisma as any).user.delete({ where: { id: superAdminUser.id } });
    });
  });

  describe('Email Verification Workflow', () => {
    const verificationTestEmail = 'verify-test@example.com';
    const verificationTestPassword = 'testpassword123';
    let verificationCode: string;
    let testUserId: string;

    beforeAll(async () => {
      // Clean up any existing test data
      await (prisma as any).emailVerificationCode.deleteMany({});
      await (prisma as any).userVerification.deleteMany({});
      await (prisma as any).user.deleteMany({ where: { email: verificationTestEmail } });
    });

    afterAll(async () => {
      // Clean up test data
      await (prisma as any).emailVerificationCode.deleteMany({});
      await (prisma as any).userVerification.deleteMany({});
      await (prisma as any).user.deleteMany({ where: { email: verificationTestEmail } });
    });

    it('should register a user and create verification code', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: verificationTestEmail,
          password: verificationTestPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(verificationTestEmail);
      expect(response.body.isActive).toBe(false); // User should be inactive until verified

      testUserId = response.body.id;

      // Verify that verification code was created
      const verificationRecord = await (prisma as any).emailVerificationCode.findFirst({
        where: { userId: testUserId },
      });

      expect(verificationRecord).toBeTruthy();
      expect(verificationRecord.isUsed).toBe(false);
      expect(verificationRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());

      verificationCode = verificationRecord.verificationCode;

      // Verify user verification status
      const userVerification = await (prisma as any).userVerification.findUnique({
        where: { userId: testUserId },
      });

      expect(userVerification).toBeTruthy();
      expect(userVerification.isEmailVerified).toBe(false);
      expect(userVerification.verificationStatus).toBe('unverified');
      expect(userVerification.userStatus).toBe('pending');
    }, 10000); // Increase timeout to 10 seconds

    it('should fail login for unverified user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: verificationTestEmail,
          password: verificationTestPassword,
        })
        .expect(401);

      expect(response.body.message).toContain('not active');
    });

    it('should verify email successfully with valid code', async () => {
      // Ensure verificationCode is set
      if (!verificationCode) {
        throw new Error('verificationCode is not set. Previous test may have failed.');
      }

      const response = await request(app)
        .post(`/api/auth/verify/${verificationCode}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Email verified successfully');
    });

    it('should update user and verification status after successful verification', async () => {
      // Ensure testUserId is set
      if (!testUserId) {
        throw new Error('testUserId is not set. Previous test may have failed.');
      }

      // Check user status
      const user = await (prisma as any).user.findUnique({
        where: { id: testUserId },
      });

      expect(user.isActive).toBe(true);

      // Check verification status
      const userVerification = await (prisma as any).userVerification.findUnique({
        where: { userId: testUserId },
      });

      expect(userVerification.isEmailVerified).toBe(true);
      expect(userVerification.verificationStatus).toBe('verified');
      expect(userVerification.userStatus).toBe('active');
      expect(userVerification.emailVerificationDate).toBeTruthy();

      // Check verification code status
      const verificationRecord = await (prisma as any).emailVerificationCode.findUnique({
        where: { verificationCode },
      });

      expect(verificationRecord.isUsed).toBe(true);
    });

    it('should allow login after email verification', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: verificationTestEmail,
          password: verificationTestPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should fail verification with invalid code', async () => {
      const response = await request(app)
        .post('/api/auth/verify/invalid-code-12345')
        .expect(400);

      expect(response.body.message).toBe('Invalid verification code format. Expected 32-character hexadecimal string.');
    });

    it('should fail verification with expired code', async () => {
      // Ensure testUserId is set
      if (!testUserId) {
        throw new Error('testUserId is not set. Previous test may have failed.');
      }

      // Create an expired verification code with valid format (32-character hex)
      const expiredCode = 'abcdef1234567890abcdef1234567890'; // 32-character hex string
      const expiredTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago

      await (prisma as any).emailVerificationCode.create({
        data: {
          userId: testUserId,
          verificationCode: expiredCode,
          expiresAt: expiredTime,
          isUsed: false,
        },
      });

      const response = await request(app)
        .post(`/api/auth/verify/${expiredCode}`)
        .expect(400);

      expect(response.body.message).toBe('Verification code has expired');
    });

    it('should fail verification with already used code', async () => {
      // Ensure verificationCode is set
      if (!verificationCode) {
        throw new Error('verificationCode is not set. Previous test may have failed.');
      }

      // Try to use the same verification code again
      const response = await request(app)
        .post(`/api/auth/verify/${verificationCode}`)
        .expect(400);

      expect(response.body.message).toBe('Verification code has already been used');
    });
  });

  describe('Email Verification Resend', () => {
    const resendTestEmail = 'resend-test@example.com';
    const resendTestPassword = 'testpassword123';
    let testUserId: string;
    let originalVerificationCode: string;

    beforeAll(async () => {
      // Clean up any existing test data
      await (prisma as any).emailVerificationCode.deleteMany({});
      await (prisma as any).userVerification.deleteMany({});
      await (prisma as any).user.deleteMany({ where: { email: resendTestEmail } });
    });

    afterAll(async () => {
      // Clean up test data
      await (prisma as any).emailVerificationCode.deleteMany({});
      await (prisma as any).userVerification.deleteMany({});
      await (prisma as any).user.deleteMany({ where: { email: resendTestEmail } });
    });

    it('should register a user for resend testing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: resendTestEmail,
          password: resendTestPassword,
        })
        .expect(201);

      testUserId = response.body.id;

      // Get the original verification code
      const verificationRecord = await (prisma as any).emailVerificationCode.findFirst({
        where: { userId: testUserId },
      });

      expect(verificationRecord).toBeTruthy();
      originalVerificationCode = verificationRecord.verificationCode;
    }, 10000); // Increase timeout to 10 seconds

    it('should resend verification email with valid existing code', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: resendTestEmail,
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Verification email sent successfully');

      // Verify the same code is still valid and not used
      const verificationRecord = await (prisma as any).emailVerificationCode.findFirst({
        where: { userId: testUserId },
      });

      expect(verificationRecord.verificationCode).toBe(originalVerificationCode);
      expect(verificationRecord.isUsed).toBe(false);
      expect(verificationRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());
    }, 10000); // Increase timeout to 10 seconds

    it('should fail resend for already verified user', async () => {
      // Ensure originalVerificationCode is set
      if (!originalVerificationCode) {
        throw new Error('originalVerificationCode is not set. Previous test may have failed.');
      }

      // First verify the user
      await request(app)
        .post(`/api/auth/verify/${originalVerificationCode}`)
        .expect(200);

      // Now try to resend - should fail
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: resendTestEmail,
        })
        .expect(400);

      expect(response.body.message).toBe('Email is already verified');
    });

    it('should resend verification email with new code when original is expired', async () => {
      // Create a new user for this test
      const expiredTestEmail = 'expired-resend@example.com';
      const expiredTestPassword = 'testpassword123';

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: expiredTestEmail,
          password: expiredTestPassword,
        })
        .expect(201);

      const user = await (prisma as any).user.findFirst({
        where: { email: expiredTestEmail },
      });

      // Expire the verification code
      const expiredTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      await (prisma as any).emailVerificationCode.updateMany({
        where: { userId: user.id },
        data: { expiresAt: expiredTime },
      });

      // Try to resend - should create new code
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: expiredTestEmail,
        })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent successfully');

      // Verify a new code was created
      const verificationRecords = await (prisma as any).emailVerificationCode.findMany({
        where: { userId: user.id },
      });

      expect(verificationRecords.length).toBe(2); // Original expired + new one
      const newRecord = verificationRecords.find((r: any) => r.expiresAt.getTime() > Date.now());
      expect(newRecord).toBeTruthy();
      expect(newRecord.isUsed).toBe(false);

      // Cleanup
      await (prisma as any).user.delete({ where: { id: user.id } });
    }, 10000); // Increase timeout to 10 seconds

    it('should fail resend for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(400);

      expect(response.body.message).toBe('User not found');
    });

    it('should fail resend with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should fail resend with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: 'invalid-email-format',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should resend verification email when no verification code exists', async () => {
      // Create a new user for this test
      const noCodeTestEmail = 'no-code-resend@example.com';
      const noCodeTestPassword = 'testpassword123';

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: noCodeTestEmail,
          password: noCodeTestPassword,
        })
        .expect(201);

      const user = await (prisma as any).user.findFirst({
        where: { email: noCodeTestEmail },
      });

      // Delete all verification codes for this user (simulate no codes exist)
      await (prisma as any).emailVerificationCode.deleteMany({
        where: { userId: user.id },
      });

      // Verify no codes exist
      const codesBefore = await (prisma as any).emailVerificationCode.findMany({
        where: { userId: user.id },
      });
      expect(codesBefore.length).toBe(0);

      // Try to resend - should create new code
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({
          email: noCodeTestEmail,
        })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent successfully');

      // Verify a new code was created
      const codesAfter = await (prisma as any).emailVerificationCode.findMany({
        where: { userId: user.id },
      });

      expect(codesAfter.length).toBe(1);
      const newCode = codesAfter[0];
      expect(newCode.isUsed).toBe(false);
      expect(newCode.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Cleanup
      await (prisma as any).user.delete({ where: { id: user.id } });
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('Duplicate Email Registration Guards', () => {
    const duplicateTestEmail = 'duplicate-test@example.com';
    const duplicateTestPassword = 'testpassword123';
    let existingUserId: string;

    beforeAll(async () => {
      // Clean up any existing test data
      await (prisma as any).emailVerificationCode.deleteMany({});
      await (prisma as any).userVerification.deleteMany({});
      await (prisma as any).user.deleteMany({ where: { email: duplicateTestEmail } });

      // Create an existing user for duplicate tests
      const hashedPassword = await hashPassword(duplicateTestPassword);
      const existingUser = await (prisma as any).user.create({
        data: {
          email: duplicateTestEmail,
          isActive: true,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });
      existingUserId = existingUser.id;

      // Create UserVerification record for existing user
      await (prisma as any).userVerification.create({
        data: {
          userId: existingUserId,
          isEmailVerified: true,
          verificationStatus: 'verified',
          userStatus: 'active',
        },
      });
    });

    afterAll(async () => {
      // Clean up test data
      await (prisma as any).emailVerificationCode.deleteMany({});
      await (prisma as any).userVerification.deleteMany({});
      await (prisma as any).user.deleteMany({ where: { email: duplicateTestEmail } });
    });

    it('should return 409 when trying to register with existing active user email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: duplicateTestEmail,
          password: 'anewpassword123',
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Email is already used');
    });

    it('should return 409 when trying to register with existing inactive user email', async () => {
      // First deactivate the existing user
      await (prisma as any).user.update({
        where: { id: existingUserId },
        data: { isActive: false },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: duplicateTestEmail,
          password: 'anewpassword456',
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Email is already used');

      // Reactivate for cleanup
      await (prisma as any).user.update({
        where: { id: existingUserId },
        data: { isActive: true },
      });
    });

    it('should return 409 with case insensitive email check', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: duplicateTestEmail.toUpperCase(),
          password: 'anewpassword789',
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Email is already used');
    });
  });
});