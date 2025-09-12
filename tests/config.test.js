"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const db_1 = require("../src/db");
describe('Config Endpoints', () => {
    beforeAll(async () => {
        // Clear the database using truncate for a clean test state
        await db_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);
        await db_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);
        await db_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);
        await db_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);
        await db_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);
        await db_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);
        await db_1.prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);
        const superAdminRole = await db_1.prisma.role.upsert({
            where: { name: 'SUPERADMIN' },
            update: {},
            create: { name: 'SUPERADMIN', description: 'Full access' },
        });
        const adminRole = await db_1.prisma.role.upsert({
            where: { name: 'ADMIN' },
            update: {},
            create: { name: 'ADMIN', description: 'Admin access' },
        });
        const createUserPerm = await db_1.prisma.permission.upsert({
            where: { name: 'create_user' },
            update: {},
            create: { name: 'create_user', description: 'Create users' },
        });
        const readUsersPerm = await db_1.prisma.permission.upsert({
            where: { name: 'read_users' },
            update: {},
            create: { name: 'read_users', description: 'Read all users' },
        });
        const updateUsersPerm = await db_1.prisma.permission.upsert({
            where: { name: 'update_users' },
            update: {},
            create: { name: 'update_users', description: 'Update any user' },
        });
        const deleteUserPerm = await db_1.prisma.permission.upsert({
            where: { name: 'delete_user' },
            update: {},
            create: { name: 'delete_user', description: 'Delete any user' },
        });
        const readUserSelfPerm = await db_1.prisma.permission.upsert({
            where: { name: 'read_user_self' },
            update: {},
            create: { name: 'read_user_self', description: 'Read own user profile' },
        });
        const updateUserSelfPerm = await db_1.prisma.permission.upsert({
            where: { name: 'update_user_self' },
            update: {},
            create: { name: 'update_user_self', description: 'Update own user profile' },
        });
        // Assign all permissions to SUPERADMIN role
        const allPermissions = [createUserPerm, readUsersPerm, updateUsersPerm, deleteUserPerm, readUserSelfPerm, updateUserSelfPerm];
        for (const perm of allPermissions) {
            await db_1.prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: superAdminRole.id, permissionId: perm.id },
            });
        }
        // Assign a subset of permissions to ADMIN role
        const adminPermissions = [readUsersPerm, readUserSelfPerm, updateUserSelfPerm];
        for (const perm of adminPermissions) {
            await db_1.prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
                update: {},
                create: { roleId: adminRole.id, permissionId: perm.id },
            });
        }
    });
    afterAll(async () => {
        await db_1.prisma.$disconnect();
    });
    it('should return system-wide default role-permission mapping', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/config/permissions');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
        const superAdminRoleData = res.body.find((r) => r.role === 'SUPERADMIN');
        expect(superAdminRoleData).toBeDefined();
        expect(superAdminRoleData.permissions).toContain('create_user');
        expect(superAdminRoleData.permissions).toContain('read_users');
        expect(superAdminRoleData.permissions).toContain('update_users');
        expect(superAdminRoleData.permissions).toContain('delete_user');
        expect(superAdminRoleData.permissions).toContain('read_user_self');
        expect(superAdminRoleData.permissions).toContain('update_user_self');
        const adminRoleData = res.body.find((r) => r.role === 'ADMIN');
        expect(adminRoleData).toBeDefined();
        expect(adminRoleData.permissions).toContain('read_users');
        expect(adminRoleData.permissions).toContain('read_user_self');
        expect(adminRoleData.permissions).toContain('update_user_self');
        expect(adminRoleData.permissions).not.toContain('create_user');
        expect(adminRoleData.permissions).not.toContain('delete_user');
        expect(adminRoleData.permissions).not.toContain('update_users');
    });
});
