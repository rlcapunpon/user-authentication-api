import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('User Login History Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;

  const testEmail = 'testuser-login@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin-login@example.com';
  const adminPassword = 'adminpassword123';

  beforeAll(async () => {
    // Clear test data
    await (prisma as any).userLoginHistory?.deleteMany?.({});
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
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).userLoginHistory?.deleteMany?.({});
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
  });

  describe('GET /api/users/last-login', () => {
    it('should return last login timestamp for authenticated user with login history', async () => {
      // First, simulate a login by creating a login history entry
      await (prisma as any).userLoginHistory?.create?.({
        data: {
          userId: testUserId,
          lastLogin: new Date('2025-10-03T10:30:00Z'),
          ipAddress: '127.0.0.1',
          metadata: { userAgent: 'test-agent' },
        },
      });

      const response = await request(app)
        .get('/api/users/last-login')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('last_login');
      expect(typeof response.body.last_login).toBe('string');
      // Should match the format mm/dd/yyyy hh:mm:ss
      expect(response.body.last_login).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    });

    it('should return null last_login for user with no login history', async () => {
      const response = await request(app)
        .get('/api/users/last-login')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('last_login');
      expect(response.body.last_login).toBeNull();
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/users/last-login')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app)
        .get('/api/users/last-login')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return the most recent login when multiple entries exist', async () => {
      // Clear existing login history for this user to ensure test isolation
      await (prisma as any).userLoginHistory?.deleteMany?.({
        where: { userId: testUserId },
      });

      // Create multiple login entries with local time dates
      const now = new Date();
      const earlierTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const recentTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

      await (prisma as any).userLoginHistory?.create?.({
        data: {
          userId: testUserId,
          lastLogin: earlierTime,
          ipAddress: '127.0.0.1',
          metadata: { userAgent: 'test-agent-1' },
        },
      });

      await (prisma as any).userLoginHistory?.create?.({
        data: {
          userId: testUserId,
          lastLogin: recentTime,
          ipAddress: '127.0.0.1',
          metadata: { userAgent: 'test-agent-2' },
        },
      });

      const response = await request(app)
        .get('/api/users/last-login')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      // Format the expected date using the same logic as the service
      const expectedMonth = String(recentTime.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(recentTime.getDate()).padStart(2, '0');
      const expectedYear = recentTime.getFullYear();
      const expectedHours = String(recentTime.getHours()).padStart(2, '0');
      const expectedMinutes = String(recentTime.getMinutes()).padStart(2, '0');
      const expectedSeconds = String(recentTime.getSeconds()).padStart(2, '0');
      const expectedFormattedDate = `${expectedMonth}/${expectedDay}/${expectedYear} ${expectedHours}:${expectedMinutes}:${expectedSeconds}`;

      expect(response.body.last_login).toBe(expectedFormattedDate);
    });
  });

  describe('Login History Recording', () => {
    it('should record login history when user logs in via POST /api/auth/login', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('refreshToken');

      // Check if login history was recorded
      const loginHistory = await (prisma as any).userLoginHistory?.findMany?.({
        where: { userId: testUserId },
        orderBy: { lastLogin: 'desc' },
        take: 1,
      });

      expect(loginHistory).toBeDefined();
      expect(loginHistory?.length).toBeGreaterThan(0);
      expect(loginHistory?.[0]).toHaveProperty('userId', testUserId);
      expect(loginHistory?.[0]).toHaveProperty('lastLogin');
      expect(loginHistory?.[0]).toHaveProperty('ipAddress');
      expect(loginHistory?.[0]).toHaveProperty('metadata');
    });

    it('should record correct IP address in login history', async () => {
      const testIp = '192.168.1.100';

      // Clear existing login history for this user to ensure test isolation
      await (prisma as any).userLoginHistory?.deleteMany?.({
        where: { userId: testUserId },
      });

      // Mock the request to have a specific IP
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      // Check if login history was recorded with correct IP
      const loginHistory = await (prisma as any).userLoginHistory?.findMany?.({
        where: { userId: testUserId },
        orderBy: { lastLogin: 'desc' },
        take: 1,
      });

      expect(loginHistory?.[0]?.ipAddress).toBe(testIp);
    });
  });
});