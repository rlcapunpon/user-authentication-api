"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
        try {
            await db_1.prisma.$connect();
            // Try to query a simple table to ensure connection is active
            await db_1.prisma.user.count();
            expect(true).toBe(true); // If we reach here, connection is successful
        }
        catch (error) {
            console.error('Database connection failed:', error);
            fail('Failed to connect to the database.');
        }
    });
    afterAll(async () => {
        await db_1.prisma.$disconnect();
    });
});
