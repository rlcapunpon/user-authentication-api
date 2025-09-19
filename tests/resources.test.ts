import request from 'supertest';import request from 'supertest';

import app from '../src/app';import app from '../src/app';

import { prisma } from '../src/db';import { prisma } from '../src/db';

import { generateAccessToken } from '../src/utils/jwt';import { generateAccessToken } from '../src/utils/jwt';

import bcrypt from 'bcrypt';import bcrypt from 'bcrypt';



describe('Resource-Based RBAC Endpoints', () => {describe('Resource-Based RBAC Endpoints', (    it('should return 404 Not Found if assigning to a nonexistent user', async () => {

  let superAdminToken: string;      const nonexistentUserId = 'nonexistent-user-id';

  let resourceUserToken: string;      const res = await request(app)

  let resourceUserId: string;        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

  let superAdminUser: any; // To store the super admin user object        .set('Authorization', `Bearer ${superAdminToken}`)

  let permissionTestUserId: string;        .send({ userId: nonexistentUserId });

  let permissionTestUserToken: string;      expect(res.statusCode).toEqual(404);

  let org1EditorRoleId: string;      expect(res.body).toHaveProperty('message', 'User not found.');

  let org2ViewerRoleId: string;    });let superAdminToken: string;

  let resourceUserToken: string;

  const testResourceType = "Organization";  let resourceUserId: string;

  const testResourceId = "org_456"; // A new dummy organization ID for tests  let superAdminUser: any; // To store the super admin user object

  let permissionTestUserId: string;

  beforeAll(async () => {  let permissionTestUserToken: string;

    // Clear the database using truncate for a clean test state  let org1EditorRoleId: string;

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);  let org2ViewerRoleId: string;

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);  const testResourceType = "Organization";

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);  const testResourceId = "org_456"; // A new dummy organization ID for tests

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);  beforeAll(async () => {

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);    // Clear the database using truncate for a clean test state

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ResourceRole" RESTART IDENTITY CASCADE;`);    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermissionMap" RESTART IDENTITY CASCADE;`);    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserResourceRole" RESTART IDENTITY CASCADE;`);    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);

    // Seed global roles and permissions (similar to seed.ts but for tests)    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);

    const superAdminRole = await prisma.role.upsert({    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);

      where: { name: 'SUPERADMIN' },    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ResourceRole" RESTART IDENTITY CASCADE;`);

      update: {},    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermissionMap" RESTART IDENTITY CASCADE;`);

      create: { name: 'SUPERADMIN', description: 'Full access to all resources' },    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserResourceRole" RESTART IDENTITY CASCADE;`);

    });

    const adminRole = await prisma.role.upsert({

      where: { name: 'ADMIN' },    // Seed global roles and permissions (similar to seed.ts but for tests)

      update: {},    const superAdminRole = await prisma.role.upsert({

      create: { name: 'ADMIN', description: 'Admin access to most resources' },      where: { name: 'SUPERADMIN' },

    });      update: {},

    const readPermission = await prisma.permission.upsert({      create: { name: 'SUPERADMIN', description: 'Full access to all resources' },

      where: { name: 'read_resource' },    });

      update: {},    const adminRole = await prisma.role.upsert({

      create: { name: 'read_resource', description: 'Read any resource' },      where: { name: 'ADMIN' },

    });      update: {},

    const writePermission = await prisma.permission.upsert({      create: { name: 'ADMIN', description: 'Admin access to most resources' },

      where: { name: 'write_resource' },    });

      update: {},    const readPermission = await prisma.permission.upsert({

      create: { name: 'write_resource', description: 'Write any resource' },      where: { name: 'read_resource' },

    });      update: {},

      create: { name: 'read_resource', description: 'Read any resource' },

    await prisma.rolePermission.createMany({    });

      data: [    const writePermission = await prisma.permission.upsert({

        { roleId: superAdminRole.id, permissionId: readPermission.id },      where: { name: 'write_resource' },

        { roleId: superAdminRole.id, permissionId: writePermission.id },      update: {},

      ],      create: { name: 'write_resource', description: 'Write any resource' },

      skipDuplicates: true,    });

    });

    await prisma.rolePermission.createMany({

    // Create Super Admin User      data: [

    const superAdminEmail = 'testsuperadmin@example.com';        { roleId: superAdminRole.id, permissionId: readPermission.id },

    const superAdminPassword = 'password123';        { roleId: superAdminRole.id, permissionId: writePermission.id },

    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);      ],

      skipDuplicates: true,

    superAdminUser = await prisma.user.upsert({    });

      where: { email: superAdminEmail },

      update: {},    // Create Super Admin User

      create: {    const superAdminEmail = 'testsuperadmin@example.com';

        email: superAdminEmail,    const superAdminPassword = 'password123';

        isActive: true,    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

        credential: { create: { passwordHash: hashedPassword } },

      },    superAdminUser = await prisma.user.upsert({

    });      where: { email: superAdminEmail },

    await prisma.userRole.upsert({      update: {},

      where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },      create: {

      update: {},        email: superAdminEmail,

      create: { userId: superAdminUser.id, roleId: superAdminRole.id },        isActive: true,

    });        credential: { create: { passwordHash: hashedPassword } },

    superAdminToken = generateAccessToken({ userId: superAdminUser.id, roles: [superAdminRole.name] });      },

    });

    // Create a regular user for resource roles    await prisma.userRole.upsert({

    const resourceUserEmail = "testresource.user@example.com";      where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },

    const resourceUserPassword = "resourcepassword";      update: {},

    const hashedResourcePassword = await bcrypt.hash(resourceUserPassword, 10);      create: { userId: superAdminUser.id, roleId: superAdminRole.id },

    });

    const resourceUser = await prisma.user.upsert({    superAdminToken = generateAccessToken({ userId: superAdminUser.id, roles: [superAdminRole.name] });

      where: { email: resourceUserEmail },

      update: {},    // Create a regular user for resource roles

      create: {    const resourceUserEmail = "testresource.user@example.com";

        email: resourceUserEmail,    const resourceUserPassword = "resourcepassword";

        isActive: true,    const hashedResourcePassword = await bcrypt.hash(resourceUserPassword, 10);

        credential: { create: { passwordHash: hashedResourcePassword } },

      },    const resourceUser = await prisma.user.upsert({

    });      where: { email: resourceUserEmail },

    resourceUserId = resourceUser.id;      update: {},

    resourceUserToken = generateAccessToken({ userId: resourceUserId, roles: [] }); // Initially no roles      create: {

  });        email: resourceUserEmail,

        isActive: true,

  afterAll(async () => {        credential: { create: { passwordHash: hashedResourcePassword } },

    await prisma.$disconnect();      },

  });    });

    resourceUserId = resourceUser.id;

  // --- Role Creation Tests ---    resourceUserToken = generateAccessToken({ userId: resourceUserId, roles: [] }); // Initially no roles

  describe('POST /resources/:resourceType/:resourceId/roles', () => {  });

    it('should create a valid role for a resource', async () => {

      const res = await request(app)  afterAll(async () => {

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)    await prisma.$disconnect();

        .set('Authorization', `Bearer ${superAdminToken}`)  });

        .send({

          name: 'editor',  // --- Role Creation Tests ---

          description: 'Can edit items in this resource',  describe('POST /resources/:resourceType/:resourceId/roles', () => {

          permissions: ['read', 'update'],    it('should create a valid role for a resource', async () => {

        });      const res = await request(app)

      expect(res.statusCode).toEqual(201);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

      expect(res.body).toHaveProperty('id');        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(res.body).toHaveProperty('name', 'editor');        .send({

      expect(res.body).toHaveProperty('resourceType', testResourceType);          name: 'editor',

      expect(res.body).toHaveProperty('resourceId', testResourceId);          description: 'Can edit items in this resource',

      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));          permissions: ['read', 'update'],

    });        });

      expect(res.statusCode).toEqual(201);

    it('should return 409 Conflict if creating a duplicate role in the same resource', async () => {      expect(res.body).toHaveProperty('id');

      // First create the role      expect(res.body).toHaveProperty('name', 'editor');

      await request(app)      expect(res.body).toHaveProperty('resourceType', testResourceType);

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)      expect(res.body).toHaveProperty('resourceId', testResourceId);

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));

        .send({    });

          name: 'duplicate_role',

          description: 'A role to be duplicated',    it('should return 409 Conflict if creating a duplicate role in the same resource', async () => {

          permissions: ['read'],      // First create the role

        });      await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

      // Then try to create it again        .set('Authorization', `Bearer ${superAdminToken}`)

      const res = await request(app)        .send({

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)          name: 'duplicate_role',

        .set('Authorization', `Bearer ${superAdminToken}`)          description: 'A role to be duplicated',

        .send({          permissions: ['read'],

          name: 'duplicate_role',        });

          description: 'A role to be duplicated',

          permissions: ['read'],      // Then try to create it again

        });      const res = await request(app)

      expect(res.statusCode).toEqual(409);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

      expect(res.body).toHaveProperty('message', 'Role with this name already exists for this resource.');        .set('Authorization', `Bearer ${superAdminToken}`)

    });        .send({

          name: 'duplicate_role',

    it('should return 400 Bad Request for invalid body (missing fields)', async () => {          description: 'A role to be duplicated',

      const res = await request(app)          permissions: ['read'],

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)        });

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.statusCode).toEqual(409);

        .send({      expect(res.body).toHaveProperty('message', 'Role with this name already exists for this resource.');

          name: 'invalid_role',    });

          // Missing permissions

        });    it('should return 400 Bad Request for invalid body (missing fields)', async () => {

      expect(res.statusCode).toEqual(400);      const res = await request(app)

      expect(res.body).toHaveProperty('message'); // Expecting a validation error message        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

    });        .set('Authorization', `Bearer ${superAdminToken}`)

  });        .send({

          name: 'invalid_role',

  // --- Role Assignment Tests ---          // Missing permissions

  describe('POST /resources/:resourceType/:resourceId/roles/:roleId/assign', () => {        });

    let editorResourceRoleId: string;      expect(res.statusCode).toEqual(400);

    let viewerResourceRoleId: string;      expect(res.body).toHaveProperty('message'); // Expecting a validation error message

    });

    beforeAll(async () => {  });

      // Ensure the editor role exists for assignment tests

      const editorRole = await prisma.resourceRole.upsert({  // --- Role Assignment Tests ---

        where: { name_resourceType_resourceId: { name: 'assign_editor', resourceType: testResourceType, resourceId: testResourceId } },  describe('POST /resources/:resourceType/:resourceId/roles/:roleId/assign', () => {

        update: {},    let editorResourceRoleId: string;

        create: {    let viewerResourceRoleId: string;

          name: 'assign_editor',

          resourceType: testResourceType,    beforeAll(async () => {

          resourceId: testResourceId,      // Ensure the editor role exists for assignment tests

          description: 'Editor role for assignment tests',      const editorRole = await prisma.resourceRole.upsert({

        },        where: { name_resourceType_resourceId: { name: 'assign_editor', resourceType: testResourceType, resourceId: testResourceId } },

      });        update: {},

      editorResourceRoleId = editorRole.id;        create: {

          name: 'assign_editor',

      // Ensure a viewer role exists for assignment tests on a different resource          resourceType: testResourceType,

      const viewerRole = await prisma.resourceRole.upsert({          resourceId: testResourceId,

        where: { name_resourceType_resourceId: { name: 'assign_viewer', resourceType: testResourceType, resourceId: 'org_different' } },          description: 'Editor role for assignment tests',

        update: {},        },

        create: {      });

          name: 'assign_viewer',      editorResourceRoleId = editorRole.id;

          resourceType: testResourceType,

          resourceId: 'org_different',      // Ensure a viewer role exists for assignment tests on a different resource

          description: 'Viewer role for a different resource',      const viewerRole = await prisma.resourceRole.upsert({

        },        where: { name_resourceType_resourceId: { name: 'assign_viewer', resourceType: testResourceType, resourceId: 'org_different' } },

      });        update: {},

      viewerResourceRoleId = viewerRole.id;        create: {

    });          name: 'assign_viewer',

          resourceType: testResourceType,

    it('should assign a role to a user for a resource', async () => {          resourceId: 'org_different',

      const res = await request(app)          description: 'Viewer role for a different resource',

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)        },

        .set('Authorization', `Bearer ${superAdminToken}`)      });

        .send({ userId: resourceUserId });      viewerResourceRoleId = viewerRole.id;

      expect(res.statusCode).toEqual(201);    });

      expect(res.body).toHaveProperty('userId', resourceUserId);

      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);    it('should assign a role to a user for a resource', async () => {

      expect(res.body).toHaveProperty('resourceType', testResourceType);      const res = await request(app)

      expect(res.body).toHaveProperty('resourceId', testResourceId);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

    });        .set('Authorization', `Bearer ${superAdminToken}`)

        .send({ userId: resourceUserId });

    it('should return 409 Conflict if user already has a role for that resource', async () => {      expect(res.statusCode).toEqual(201);

      // Assign once (done in previous test or setup)      expect(res.body).toHaveProperty('userId', resourceUserId);

      // Try to assign again      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);

      const res = await request(app)      expect(res.body).toHaveProperty('resourceType', testResourceType);

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)      expect(res.body).toHaveProperty('resourceId', testResourceId);

        .set('Authorization', `Bearer ${superAdminToken}`)    });

        .send({ userId: resourceUserId });

      expect(res.statusCode).toEqual(409);    it('should return 409 Conflict if user already has a role for that resource', async () => {

      expect(res.body).toHaveProperty('message', 'User already has a role assigned for this resource.');      // Assign once (done in previous test or setup)

    });      // Try to assign again

      const res = await request(app)

    it('should return 404 Not Found if assigning to a nonexistent role', async () => {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

      const nonexistentRoleId = 'nonexistent-role-id';        .set('Authorization', `Bearer ${superAdminToken}`)

      const res = await request(app)        .send({ userId: resourceUserId });

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${nonexistentRoleId}/assign`)      expect(res.statusCode).toEqual(409);

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body).toHaveProperty('message', 'User already has a role assigned for this resource.');

        .send({ userId: resourceUserId });    });

      expect(res.statusCode).toEqual(404);

      expect(res.body).toHaveProperty('message', 'Resource role not found.');    it('should return 404 Not Found if assigning to a nonexistent role', async () => {

    });      const nonexistentRoleId = 'nonexistent-role-id';

      const res = await request(app)

    it('should return 404 Not Found if assigning to a nonexistent user', async () => {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${nonexistentRoleId}/assign`)

      const nonexistentUserId = 'nonexistent-user-id';        .set('Authorization', `Bearer ${superAdminToken}`)

      const res = await request(app)        .send({ userId: resourceUserId });

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)      expect(res.statusCode).toEqual(404);

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body).toHaveProperty('message', 'Resource role not found.');

        .send({ userId: nonexistentUserId });    });

      expect(res.statusCode).toEqual(404);

      expect(res.body).toHaveProperty('message', 'User not found.');    it('should return 404 Not Found if assigning to a nonexistent user', async () => {

    });      const nonexistentUserId = 'nonexistent-user-id';

      const res = await request(app)

    it('should be able to give an existing role to a new user and then map the user to an existing resource', async () => {        .post(`/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

      const newUserEmail = "new.user.for.role@example.com";        .set('Authorization', `Bearer ${superAdminToken}`)

      const hashedNewUserPassword = await bcrypt.hash('password123', 10);        .send({ userId: nonexistentUserId });

      const newUser = await prisma.user.upsert({      expect(res.statusCode).toEqual(404);

        where: { email: newUserEmail },      expect(res.body).toHaveProperty('message', 'User not found.');

        update: {},    });

        create: {

          email: newUserEmail,    it('should be able to give an existing role to a new user and then map the user to an existing resource', async () => {

          isActive: true,      const newUserEmail = "new.user.for.role@example.com";

          credential: { create: { passwordHash: hashedNewUserPassword } },      const hashedNewUserPassword = await bcrypt.hash('password123', 10);

        },      const newUser = await prisma.user.upsert({

      });        where: { email: newUserEmail },

        update: {},

      const res = await request(app)        create: {

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)          email: newUserEmail,

        .set('Authorization', `Bearer ${superAdminToken}`)          isActive: true,

        .send({ userId: newUser.id });          credential: { create: { passwordHash: hashedNewUserPassword } },

        },

      expect(res.statusCode).toEqual(201);      });

      expect(res.body).toHaveProperty('userId', newUser.id);

      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);      const res = await request(app)

      expect(res.body).toHaveProperty('resourceType', testResourceType);        .post(`/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

      expect(res.body).toHaveProperty('resourceId', testResourceId);        .set('Authorization', `Bearer ${superAdminToken}`)

    });        .send({ userId: newUser.id });



    it('should be able to give an existing user a different role for a different resource', async () => {      expect(res.statusCode).toEqual(201);

      const differentResourceId = "org_different";      expect(res.body).toHaveProperty('userId', newUser.id);

      const res = await request(app)      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);

        .post(`/api/resources/${testResourceType}/${differentResourceId}/roles/${viewerResourceRoleId}/assign`)      expect(res.body).toHaveProperty('resourceType', testResourceType);

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body).toHaveProperty('resourceId', testResourceId);

        .send({ userId: resourceUserId });    });



      expect(res.statusCode).toEqual(201);    it('should be able to give an existing user a different role for a different resource', async () => {

      expect(res.body).toHaveProperty('userId', resourceUserId);      const differentResourceId = "org_different";

      expect(res.body).toHaveProperty('resourceRoleId', viewerResourceRoleId);      const res = await request(app)

      expect(res.body).toHaveProperty('resourceType', testResourceType);        .post(`/resources/${testResourceType}/${differentResourceId}/roles/${viewerResourceRoleId}/assign`)

      expect(res.body).toHaveProperty('resourceId', differentResourceId);        .set('Authorization', `Bearer ${superAdminToken}`)

    });        .send({ userId: resourceUserId });

  });

      expect(res.statusCode).toEqual(201);

  // --- Role Unassignment Tests ---      expect(res.body).toHaveProperty('userId', resourceUserId);

  describe('DELETE /resources/:resourceType/:resourceId/roles/:roleId/assign/:userId', () => {      expect(res.body).toHaveProperty('resourceRoleId', viewerResourceRoleId);

    let unassignableRoleId: string;      expect(res.body).toHaveProperty('resourceType', testResourceType);

    let userToUnassignId: string;      expect(res.body).toHaveProperty('resourceId', differentResourceId);

    let userToUnassignToken: string;    });

  });

    beforeAll(async () => {

      // Create a role and user specifically for unassignment tests  // --- Role Unassignment Tests ---

      const unassignRole = await prisma.resourceRole.upsert({  describe('DELETE /resources/:resourceType/:resourceId/roles/:roleId/assign/:userId', () => {

        where: { name_resourceType_resourceId: { name: 'unassign_role', resourceType: testResourceType, resourceId: 'org_unassign' } },    let unassignableRoleId: string;

        update: {},    let userToUnassignId: string;

        create: {    let userToUnassignToken: string;

          name: 'unassign_role',

          resourceType: testResourceType,    beforeAll(async () => {

          resourceId: 'org_unassign',      // Create a role and user specifically for unassignment tests

          description: 'Role for unassignment tests',      const unassignRole = await prisma.resourceRole.upsert({

        },        where: { name_resourceType_resourceId: { name: 'unassign_role', resourceType: testResourceType, resourceId: 'org_unassign' } },

      });        update: {},

      unassignableRoleId = unassignRole.id;        create: {

          name: 'unassign_role',

      const unassignUserEmail = "unassign.user@example.com";          resourceType: testResourceType,

      const hashedUnassignPassword = await bcrypt.hash('password123', 10);          resourceId: 'org_unassign',

      const unassignUser = await prisma.user.upsert({          description: 'Role for unassignment tests',

        where: { email: unassignUserEmail },        },

        update: {},      });

        create: {      unassignableRoleId = unassignRole.id;

          email: unassignUserEmail,

          isActive: true,      const unassignUserEmail = "unassign.user@example.com";

          credential: { create: { passwordHash: hashedUnassignPassword } },      const hashedUnassignPassword = await bcrypt.hash('password123', 10);

        },      const unassignUser = await prisma.user.upsert({

      });        where: { email: unassignUserEmail },

      userToUnassignId = unassignUser.id;        update: {},

      userToUnassignToken = generateAccessToken({ userId: userToUnassignId, roles: [] });        create: {

          email: unassignUserEmail,

      // Assign the role to the user          isActive: true,

      await prisma.userResourceRole.upsert({          credential: { create: { passwordHash: hashedUnassignPassword } },

        where: { userId_resourceType_resourceId: { userId: userToUnassignId, resourceType: testResourceType, resourceId: 'org_unassign' } },        },

        update: {},      });

        create: {      userToUnassignId = unassignUser.id;

          userId: userToUnassignId,      userToUnassignToken = generateAccessToken({ userId: userToUnassignId, roles: [] });

          resourceRoleId: unassignableRoleId,

          resourceType: testResourceType,      // Assign the role to the user

          resourceId: 'org_unassign',      await prisma.userResourceRole.upsert({

        },        where: { userId_resourceType_resourceId: { userId: userToUnassignId, resourceType: testResourceType, resourceId: 'org_unassign' } },

      });        update: {},

    });        create: {

          userId: userToUnassignId,

    it('should remove a role assignment for a user in a resource', async () => {          resourceRoleId: unassignableRoleId,

      const res = await request(app)          resourceType: testResourceType,

        .delete(`/api/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`)          resourceId: 'org_unassign',

        .set('Authorization', `Bearer ${superAdminToken}`);        },

      expect(res.statusCode).toEqual(200);      });

      expect(res.body).toHaveProperty('success', true);    });



      // Verify assignment is gone    it('should remove a role assignment for a user in a resource', async () => {

      const assignment = await prisma.userResourceRole.findUnique({      const res = await request(app)

        where: {        .delete(`/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`)

          userId_resourceRoleId: {        .set('Authorization', `Bearer ${superAdminToken}`);

            userId: userToUnassignId,      expect(res.statusCode).toEqual(200);

            resourceRoleId: unassignableRoleId,      expect(res.body).toHaveProperty('success', true);

          },

        },      // Verify assignment is gone

      });      const assignment = await prisma.userResourceRole.findUnique({

      expect(assignment).toBeNull();        where: {

    });          userId_resourceRoleId: {

            userId: userToUnassignId,

    it('should return 404 Not Found for a nonexistent assignment', async () => {            resourceRoleId: unassignableRoleId,

      const res = await request(app)          },

        .delete(`/api/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`) // Already unassigned        },

        .set('Authorization', `Bearer ${superAdminToken}`);      });

      expect(res.statusCode).toEqual(404);      expect(assignment).toBeNull();

      expect(res.body).toHaveProperty('message', 'User resource role assignment not found.');    });

    });

  });    it('should return 404 Not Found for a nonexistent assignment', async () => {

      const res = await request(app)

  // --- Effective Permissions Tests ---        .delete(`/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`) // Already unassigned

  describe('GET /resources/:resourceType/:resourceId/users/:userId/permissions', () => {        .set('Authorization', `Bearer ${superAdminToken}`);

    beforeAll(async () => {      expect(res.statusCode).toEqual(404);

      // Create a user for permission tests      expect(res.body).toHaveProperty('message', 'User resource role assignment not found.');

      const permissionUserEmail = "permission.user@example.com";    });

      const hashedPermissionPassword = await bcrypt.hash('password123', 10);  });

      const permissionUser = await prisma.user.upsert({

        where: { email: permissionUserEmail },  // --- Effective Permissions Tests ---

        update: {},  describe('GET /resources/:resourceType/:resourceId/users/:userId/permissions', () => {

        create: {    beforeAll(async () => {

          email: permissionUserEmail,      // Create a user for permission tests

          isActive: true,      const permissionUserEmail = "permission.user@example.com";

          credential: { create: { passwordHash: hashedPermissionPassword } },      const hashedPermissionPassword = await bcrypt.hash('password123', 10);

        },      const permissionUser = await prisma.user.upsert({

      });        where: { email: permissionUserEmail },

      permissionTestUserId = permissionUser.id;        update: {},

      permissionTestUserToken = generateAccessToken({ userId: permissionTestUserId, roles: [] });        create: {

          email: permissionUserEmail,

      // Create roles for different resources          isActive: true,

      const org1EditorRole = await prisma.resourceRole.upsert({          credential: { create: { passwordHash: hashedPermissionPassword } },

        where: { name_resourceType_resourceId: { name: 'editor', resourceType: 'Organization', resourceId: 'org_perm_1' } },        },

        update: {},      });

        create: { name: 'editor', resourceType: 'Organization', resourceId: 'org_perm_1', description: 'Editor for Org 1' },      permissionTestUserId = permissionUser.id;

      });      permissionTestUserToken = generateAccessToken({ userId: permissionTestUserId, roles: [] });

      org1EditorRoleId = org1EditorRole.id;

      await prisma.rolePermissionMap.createMany({      // Create roles for different resources

        data: [      const org1EditorRole = await prisma.resourceRole.upsert({

          { resourceRoleId: org1EditorRoleId, permissionVerb: 'read' },        where: { name_resourceType_resourceId: { name: 'editor', resourceType: 'Organization', resourceId: 'org_perm_1' } },

          { resourceRoleId: org1EditorRoleId, permissionVerb: 'update' },        update: {},

        ],        create: { name: 'editor', resourceType: 'Organization', resourceId: 'org_perm_1', description: 'Editor for Org 1' },

        skipDuplicates: true,      });

      });      org1EditorRoleId = org1EditorRole.id;

      await prisma.rolePermissionMap.createMany({

      const org2ViewerRole = await prisma.resourceRole.upsert({        data: [

        where: { name_resourceType_resourceId: { name: 'viewer', resourceType: 'Organization', resourceId: 'org_perm_2' } },          { resourceRoleId: org1EditorRoleId, permissionVerb: 'read' },

        update: {},          { resourceRoleId: org1EditorRoleId, permissionVerb: 'update' },

        create: { name: 'viewer', resourceType: 'Organization', resourceId: 'org_perm_2', description: 'Viewer for Org 2' },        ],

      });        skipDuplicates: true,

      org2ViewerRoleId = org2ViewerRole.id;      });

      await prisma.rolePermissionMap.createMany({

        data: [      const org2ViewerRole = await prisma.resourceRole.upsert({

          { resourceRoleId: org2ViewerRoleId, permissionVerb: 'read' }        where: { name_resourceType_resourceId: { name: 'viewer', resourceType: 'Organization', resourceId: 'org_perm_2' } },

        ],        update: {},

        skipDuplicates: true,        create: { name: 'viewer', resourceType: 'Organization', resourceId: 'org_perm_2', description: 'Viewer for Org 2' },

      });      });

      org2ViewerRoleId = org2ViewerRole.id;

      // Assign roles to the user      await prisma.rolePermissionMap.createMany({

      await prisma.userResourceRole.upsert({        data: [

        where: { userId_resourceType_resourceId: { userId: permissionTestUserId, resourceType: 'Organization', resourceId: 'org_perm_1' } },          { resourceRoleId: org2ViewerRoleId, permissionVerb: 'read' }

        update: {},        ],

        create: { userId: permissionTestUserId, resourceRoleId: org1EditorRoleId, resourceType: 'Organization', resourceId: 'org_perm_1' },        skipDuplicates: true,

      });      });

      await prisma.userResourceRole.upsert({

        where: { userId_resourceType_resourceId: { userId: permissionTestUserId, resourceType: 'Organization', resourceId: 'org_perm_2' } },      // Assign roles to the user

        update: {},      await prisma.userResourceRole.upsert({

        create: { userId: permissionTestUserId, resourceRoleId: org2ViewerRoleId, resourceType: 'Organization', resourceId: 'org_perm_2' },        where: { userId_resourceType_resourceId: { userId: permissionTestUserId, resourceType: 'Organization', resourceId: 'org_perm_1' } },

      });        update: {},

    });        create: { userId: permissionTestUserId, resourceRoleId: org1EditorRoleId, resourceType: 'Organization', resourceId: 'org_perm_1' },

      });

    it('should return permissions for a user in a specific resource', async () => {      await prisma.userResourceRole.upsert({

      const res = await request(app)        where: { userId_resourceType_resourceId: { userId: permissionTestUserId, resourceType: 'Organization', resourceId: 'org_perm_2' } },

        .get(`/api/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`)        update: {},

        .set('Authorization', `Bearer ${superAdminToken}`); // Super admin can query any user's permissions        create: { userId: permissionTestUserId, resourceRoleId: org2ViewerRoleId, resourceType: 'Organization', resourceId: 'org_perm_2' },

      expect(res.statusCode).toEqual(200);      });

      expect(res.body).toHaveProperty('permissions');    });

      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));

      expect(res.body.permissions).not.toContain('delete'); // Should not include permissions from other roles/resources    it('should return permissions for a user in a specific resource', async () => {

    });      const res = await request(app)

        .get(`/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`)

    it('should return 404 Not Found if user has no role in the specified resource', async () => {        .set('Authorization', `Bearer ${superAdminToken}`); // Super admin can query any user's permissions

      const res = await request(app)      expect(res.statusCode).toEqual(200);

        .get(`/api/resources/Organization/nonexistent_org/users/${permissionTestUserId}/permissions`)      expect(res.body).toHaveProperty('permissions');

        .set('Authorization', `Bearer ${superAdminToken}`);      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));

      expect(res.statusCode).toEqual(404);      expect(res.body.permissions).not.toContain('delete'); // Should not include permissions from other roles/resources

      expect(res.body).toHaveProperty('message', 'User has no role in this resource.');    });

    });

    it('should return 404 Not Found if user has no role in the specified resource', async () => {

    it('should return 401 Unauthorized if unauthenticated', async () => {      const res = await request(app)

      const res = await request(app)        .get(`/resources/Organization/nonexistent_org/users/${permissionTestUserId}/permissions`)

        .get(`/api/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`);        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.statusCode).toEqual(401);      expect(res.statusCode).toEqual(404);

    });      expect(res.body).toHaveProperty('message', 'User has no role in this resource.');

    });

    it('should return 403 Forbidden if authenticated but not authorized to query permissions', async () => {

      // A regular user trying to query another user's permissions without proper global role    it('should return 401 Unauthorized if unauthenticated', async () => {

      const res = await request(app)      const res = await request(app)

        .get(`/api/resources/Organization/org_perm_1/users/${superAdminUser.id}/permissions`) // resourceUser trying to query superAdmin        .get(`/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`);

        .set('Authorization', `Bearer ${permissionTestUserToken}`);      expect(res.statusCode).toEqual(401);

      expect(res.statusCode).toEqual(403);    });

    });

  });    it('should return 403 Forbidden if authenticated but not authorized to query permissions', async () => {

      // A regular user trying to query another user's permissions without proper global role

  // --- Middleware: authorizeResource Tests ---      const res = await request(app)

  describe('Middleware: authorizeResource', () => {        .get(`/resources/Organization/org_perm_1/users/${superAdminUser.id}/permissions`) // resourceUser trying to query superAdmin

    it('should allow access if user has required permission on resource', async () => {        .set('Authorization', `Bearer ${permissionTestUserToken}`);

      // Use the user that has 'read' and 'update' permissions for org_perm_1      expect(res.statusCode).toEqual(403);

      const res = await request(app)    });

        .get('/api/resources/Organization/org_perm_1/test-read')  });

        .set('Authorization', `Bearer ${permissionTestUserToken}`);

        // --- Middleware: authorizeResource Tests ---

      expect(res.statusCode).toEqual(200);  describe('Middleware: authorizeResource', () => {

      expect(res.body).toHaveProperty('message', 'Access granted');    it('should allow access if user has required permission on resource', async () => {

      expect(res.body).toHaveProperty('action', 'read');      // Use the user that has 'read' and 'update' permissions for org_perm_1

    });      const res = await request(app)

        .get('/resources/Organization/org_perm_1/test-read')

    it('should deny access if user does not have required permission on resource', async () => {        .set('Authorization', `Bearer ${permissionTestUserToken}`);

      // Try to access a write endpoint when user only has read permission for org_perm_2      

      const res = await request(app)      expect(res.statusCode).toEqual(200);

        .post('/api/resources/Organization/org_perm_2/test-write')      expect(res.body).toHaveProperty('message', 'Access granted');

        .set('Authorization', `Bearer ${permissionTestUserToken}`);      expect(res.body).toHaveProperty('action', 'read');

          });

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Forbidden: Insufficient permissions for this resource');    it('should deny access if user does not have required permission on resource', async () => {

    });      // Try to access a write endpoint when user only has read permission for org_perm_2

      const res = await request(app)

    it('should deny access if unauthenticated', async () => {        .post('/resources/Organization/org_perm_2/test-write')

      const res = await request(app)        .set('Authorization', `Bearer ${permissionTestUserToken}`);

        .get('/api/resources/Organization/org_perm_1/test-read');      

            expect(res.statusCode).toEqual(403);

      expect(res.statusCode).toEqual(401);      expect(res.body).toHaveProperty('message', 'Forbidden: Insufficient permissions for this resource');

      expect(res.body).toHaveProperty('message', 'No token provided');    });

    });

    it('should deny access if unauthenticated', async () => {

    it('should deny access if user has no role in the resource', async () => {      const res = await request(app)

      // Try to access a resource that the permission test user has no role in        .get('/resources/Organization/org_perm_1/test-read');

      const res = await request(app)      

        .get('/api/resources/Organization/nonexistent_org/test-read')      expect(res.statusCode).toEqual(401);

        .set('Authorization', `Bearer ${permissionTestUserToken}`);      expect(res.body).toHaveProperty('message', 'No token provided');

          });

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Forbidden: No access to this resource');    it('should deny access if user has no role in the resource', async () => {

    });      // Try to access a resource that the permission test user has no role in

  });      const res = await request(app)

});        .get('/resources/Organization/nonexistent_org/test-read')
        .set('Authorization', `Bearer ${permissionTestUserToken}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Forbidden: No access to this resource');
    });
  });
});