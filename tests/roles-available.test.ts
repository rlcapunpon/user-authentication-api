import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { generateAccessToken } from '../src/utils/jwt';

describe('GET /api/roles/available', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Create a test user with credential
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        isActive: true,
        credential: {
          create: {
            passwordHash: 'hashedpassword',
          },
        },
      },
    });

    // Generate auth token
    authToken = generateAccessToken({ userId: testUser.id });
  });

  afterAll(async () => {
    // Clean up
    await prisma.credential.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should return available roles for authenticated user', async () => {
    const response = await request(app)
      .get('/api/roles/available')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
    }
  });

  it('should return 401 for unauthenticated request', async () => {
    const response = await request(app)
      .get('/api/roles/available')
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });
});