import { prisma } from '../src/db';

describe('Database Connection', () => {
  it('should connect to the database successfully', async () => {
    try {
      await prisma.$connect();
      // Try to query a simple table to ensure connection is active
      await prisma.user.count(); 
      expect(true).toBe(true); // If we reach here, connection is successful
    } catch (error) {
      console.error('Database connection failed:', error);
      fail('Failed to connect to the database.');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
