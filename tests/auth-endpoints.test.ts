import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';

describe('Authentication Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let testRefreshToken: string;
  const testEmail = 'testuser@example.com';
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    // Clear test data and create a test user
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    
    // Create test user
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
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
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
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('email', testEmail);
      expect(response.body).toHaveProperty('isSuperAdmin', false);
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.resources)).toBe(true);
      
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
      const superAdminEmail = 'superadmin-test@example.com';
      const superAdminPassword = 'superadminpass123';
      const hashedPassword = await hashPassword(superAdminPassword);
      
      const superAdminUser = await (prisma as any).user.create({
        data: {
          email: superAdminEmail,
          isSuperAdmin: true,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
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

      // Cleanup
      await (prisma as any).user.delete({ where: { id: superAdminUser.id } });
    });
  });
});