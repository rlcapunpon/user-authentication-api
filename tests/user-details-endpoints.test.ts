import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { hashPassword } from '../src/utils/crypto';
import { generateAccessToken } from '../src/utils/jwt';

describe('User Details Endpoints', () => {
  let testUserId: string;
  let testUserToken: string;
  let adminUserId: string;
  let adminUserToken: string;
  let managerUserId: string;
  let managerUserToken: string;
  let subordinateUserId: string;
  let subordinateUserToken: string;

  const testEmail = 'testuser@example.com';
  const testPassword = 'testpassword123';
  const adminEmail = 'admin@example.com';
  const adminPassword = 'adminpassword123';
  const managerEmail = 'manager@example.com';
  const managerPassword = 'managerpassword123';
  const subordinateEmail = 'subordinate@example.com';
  const subordinatePassword = 'subordinatepassword123';

  beforeAll(async () => {
    // Clear test data
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
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
    });
    testUserId = testUser.id;

    // Create UserDetails for test user
    await (prisma as any).userDetails.create({
      data: {
        id: testUserId,
        firstName: 'Test',
        lastName: 'User',
        nickName: 'Tester',
        contactNumber: '+1-555-0101',
      },
    });

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

    // Create UserDetails for admin user
    await (prisma as any).userDetails.create({
      data: {
        id: adminUserId,
        firstName: 'Admin',
        lastName: 'User',
        nickName: 'Boss',
        contactNumber: '+1-555-0102',
      },
    });

    // Create manager test user
    const managerHashedPassword = await hashPassword(managerPassword);
    const managerUser = await (prisma as any).user.create({
      data: {
        email: managerEmail,
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: managerHashedPassword,
          },
        },
      },
    });
    managerUserId = managerUser.id;

    // Create UserDetails for manager user
    await (prisma as any).userDetails.create({
      data: {
        id: managerUserId,
        firstName: 'Manager',
        lastName: 'User',
        nickName: 'Mgr',
        contactNumber: '+1-555-0103',
      },
    });

    // Create subordinate test user
    const subordinateHashedPassword = await hashPassword(subordinatePassword);
    const subordinateUser = await (prisma as any).user.create({
      data: {
        email: subordinateEmail,
        isSuperAdmin: false,
        credential: {
          create: {
            passwordHash: subordinateHashedPassword,
          },
        },
      },
    });
    subordinateUserId = subordinateUser.id;

    // Create UserDetails for subordinate user (reports to manager)
    await (prisma as any).userDetails.create({
      data: {
        id: subordinateUserId,
        firstName: 'Subordinate',
        lastName: 'User',
        nickName: 'Sub',
        contactNumber: '+1-555-0104',
        reportToId: managerUserId,
      },
    });

    // Generate tokens
    testUserToken = generateAccessToken({ 
      userId: testUserId, 
      isSuperAdmin: false,
      permissions: [] // Regular user has no permissions
    });
    adminUserToken = generateAccessToken({ 
      userId: adminUserId, 
      isSuperAdmin: true,
      permissions: ['*'] // Admin has all permissions
    });
    managerUserToken = generateAccessToken({ 
      userId: managerUserId, 
      isSuperAdmin: false,
      permissions: [] // Manager has no permissions
    });
    subordinateUserToken = generateAccessToken({ 
      userId: subordinateUserId, 
      isSuperAdmin: false,
      permissions: [] // Subordinate has no permissions
    });
  });

  afterAll(async () => {
    // Clean up test data
    await (prisma as any).userResourceRole.deleteMany({});
    await (prisma as any).refreshToken.deleteMany({});
    await (prisma as any).userDetails.deleteMany({});
    await (prisma as any).user.deleteMany({});
    await (prisma as any).role.deleteMany({});
    await (prisma as any).resource.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/user-details', () => {
    it('should return all user details for superadmin', async () => {
      const response = await request(app)
        .get('/api/user-details')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check that response includes expected user details
      const testUserDetails = response.body.find((user: any) => user.id === testUserId);
      expect(testUserDetails).toBeDefined();
      expect(testUserDetails.firstName).toBe('Test');
      expect(testUserDetails.lastName).toBe('User');
      expect(testUserDetails.nickName).toBe('Tester');
      expect(testUserDetails.contactNumber).toBe('+1-555-0101');
      expect(testUserDetails.user.email).toBe(testEmail);
    });

    it('should fail for non-superadmin users', async () => {
      const response = await request(app)
        .get('/api/user-details')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only superadmin can view all user details');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/user-details')
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('GET /api/user-details/:id', () => {
    it('should return user details for the authenticated user', async () => {
      const response = await request(app)
        .get(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body.firstName).toBe('Test');
      expect(response.body.lastName).toBe('User');
      expect(response.body.nickName).toBe('Tester');
      expect(response.body.contactNumber).toBe('+1-555-0101');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should return user details for superadmin accessing any user', async () => {
      const response = await request(app)
        .get(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body.firstName).toBe('Test');
      expect(response.body.lastName).toBe('User');
    });

    it('should fail when user tries to access another user\'s details', async () => {
      const response = await request(app)
        .get(`/api/user-details/${adminUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.message).toContain('You can only view your own details');
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/user-details/invalid-uuid')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID format');
    });

    it('should fail when user details not found', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/user-details/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);

      expect(response.body.message).toContain('User details not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/user-details/${testUserId}`)
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('PUT /api/user-details/:id', () => {
    it('should update user details for the authenticated user', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        nickName: 'UpdatedNick',
        contactNumber: '+1-555-9999',
      };

      const response = await request(app)
        .put(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('Name');
      expect(response.body.nickName).toBe('UpdatedNick');
      expect(response.body.contactNumber).toBe('+1-555-9999');
    });

    it('should update user details for superadmin', async () => {
      const updateData = {
        firstName: 'SuperUpdated',
        lastName: 'Admin',
      };

      const response = await request(app)
        .put(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe('SuperUpdated');
      expect(response.body.lastName).toBe('Admin');
    });

    it('should update reportTo field with valid user ID', async () => {
      const updateData = {
        reportTo: adminUserId,
      };

      const response = await request(app)
        .put(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.reportTo.id).toBe(adminUserId);
      expect(response.body.reportTo.email).toBe(adminEmail);
    });

    it('should fail when updating reportTo with invalid user ID', async () => {
      const updateData = {
        reportTo: 'invalid-user-id',
      };

      const response = await request(app)
        .put(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('Invalid reportTo user ID');
    });

    it('should fail when user tries to update another user\'s details', async () => {
      const updateData = {
        firstName: 'Hacked',
      };

      const response = await request(app)
        .put(`/api/user-details/${adminUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('You can only update your own details');
    });

    it('should fail with invalid user ID', async () => {
      const updateData = {
        firstName: 'Test',
      };

      const response = await request(app)
        .put('/api/user-details/invalid-uuid')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID format');
    });

    it('should fail when user details not found', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        firstName: 'Test',
      };

      const response = await request(app)
        .put(`/api/user-details/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain('User details not found');
    });

    it('should fail without authentication', async () => {
      const updateData = {
        firstName: 'Test',
      };

      const response = await request(app)
        .put(`/api/user-details/${testUserId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });

    it('should handle partial updates correctly', async () => {
      // First, reset the user details to a known state
      const resetData = {
        firstName: 'Test',
        lastName: 'User',
        nickName: 'Tester',
        contactNumber: '+1-555-0101',
      };

      await request(app)
        .put(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(resetData)
        .expect(200);

      // Now test partial update
      const updateData = {
        nickName: 'PartialUpdate',
      };

      const response = await request(app)
        .put(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.nickName).toBe('PartialUpdate');
      // Other fields should remain unchanged
      expect(response.body.firstName).toBe('Test');
      expect(response.body.lastName).toBe('User');
    });
  });

  describe('DELETE /api/user-details/:id', () => {
    it('should fail for non-superadmin users', async () => {
      const response = await request(app)
        .delete(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.message).toContain('Only superadmin can delete user details');
    });

    it('should delete user details for superadmin', async () => {
      const response = await request(app)
        .delete(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body.message).toContain('User details deleted successfully');

      // Verify details are deleted
      const getResponse = await request(app)
        .get(`/api/user-details/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);

      expect(getResponse.body.message).toContain('User details not found');
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .delete('/api/user-details/invalid-uuid')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID format');
    });

    it('should fail when user details not found', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/user-details/${fakeUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);

      expect(response.body.message).toContain('User details not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/user-details/${testUserId}`)
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('GET /api/user-details/:id/subordinates', () => {
    it('should return subordinates for manager user', async () => {
      const response = await request(app)
        .get(`/api/user-details/${managerUserId}/subordinates`)
        .set('Authorization', `Bearer ${managerUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const subordinate = response.body[0];
      expect(subordinate.id).toBe(subordinateUserId);
      expect(subordinate.firstName).toBe('Subordinate');
      expect(subordinate.lastName).toBe('User');
      expect(subordinate.user.email).toBe(subordinateEmail);
    });

    it('should return subordinates for superadmin', async () => {
      const response = await request(app)
        .get(`/api/user-details/${managerUserId}/subordinates`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(subordinateUserId);
    });

    it('should return empty array when user has no subordinates', async () => {
      const response = await request(app)
        .get(`/api/user-details/${subordinateUserId}/subordinates`)
        .set('Authorization', `Bearer ${subordinateUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should fail when user tries to view another user\'s subordinates', async () => {
      const response = await request(app)
        .get(`/api/user-details/${managerUserId}/subordinates`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      expect(response.body.message).toContain('You can only view your own subordinates');
    });

    it('should fail with invalid user ID', async () => {
      const response = await request(app)
        .get('/api/user-details/invalid-uuid/subordinates')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID format');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/user-details/${managerUserId}/subordinates`)
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full user details management flow', async () => {
      // Create a new user for testing
      const newUserEmail = 'integration-test@example.com';
      const newUserPassword = 'integrationpass123';
      const hashedPassword = await hashPassword(newUserPassword);

      const newUser = await (prisma as any).user.create({
        data: {
          email: newUserEmail,
          isSuperAdmin: false,
          credential: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });

      // Create UserDetails for the new user
      await (prisma as any).userDetails.create({
        data: {
          id: newUser.id,
          firstName: 'Integration',
          lastName: 'Test',
          nickName: 'IT',
          contactNumber: '+1-555-0199',
        },
      });

      const newUserToken = generateAccessToken({ 
        userId: newUser.id, 
        isSuperAdmin: false,
        permissions: [] // New user has no permissions
      });

      // 1. Get user details
      const getResponse = await request(app)
        .get(`/api/user-details/${newUser.id}`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(getResponse.body.firstName).toBe('Integration');
      expect(getResponse.body.lastName).toBe('Test');

      // 2. Update user details
      const updateData = {
        firstName: 'UpdatedIntegration',
        nickName: 'UpdatedIT',
        reportTo: adminUserId,
      };

      const updateResponse = await request(app)
        .put(`/api/user-details/${newUser.id}`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.firstName).toBe('UpdatedIntegration');
      expect(updateResponse.body.nickName).toBe('UpdatedIT');
      expect(updateResponse.body.reportTo.id).toBe(adminUserId);

      // 3. Admin can view all user details
      const allDetailsResponse = await request(app)
        .get('/api/user-details')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      const newUserDetails = allDetailsResponse.body.find((user: any) => user.id === newUser.id);
      expect(newUserDetails).toBeDefined();
      expect(newUserDetails.firstName).toBe('UpdatedIntegration');

      // 4. Admin can view subordinates
      const subordinatesResponse = await request(app)
        .get(`/api/user-details/${adminUserId}/subordinates`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      const subordinate = subordinatesResponse.body.find((sub: any) => sub.id === newUser.id);
      expect(subordinate).toBeDefined();

      // 5. Admin can delete user details
      const deleteResponse = await request(app)
        .delete(`/api/user-details/${newUser.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(deleteResponse.body.message).toContain('User details deleted successfully');

      // Cleanup
      await (prisma as any).user.delete({ where: { id: newUser.id } });
    });
  });
});