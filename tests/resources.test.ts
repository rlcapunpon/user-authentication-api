import request from 'supertest';import request from 'supertest';import request from 'supertest';import request from 'supertest';

import app from '../src/app';

import { prisma } from '../src/db';import app from '../src/app';

import bcrypt from 'bcrypt';

import { generateAccessToken } from '../src/utils/jwt';import { prisma } from '../src/db';import app from '../src/app';import app from '../src/app';



// Test data variablesimport bcrypt from 'bcrypt';

let superAdminToken: string;

let superAdminUser: any;import { generateAccessToken } from '../src/utils/jwt';import { prisma } from '../src/db';import { prisma } from '../src/db';

let adminToken: string;

let adminUser: any;

let regularUserToken: string;

let regularUser: any;// Test data variablesimport { generateAccessToken } from '../src/utils/jwt';import { generateAccessToken } from '../src/utils/jwt';

let testResourceType: string;

let testResourceId: string;let superAdminToken: string;

let createdResourceRoleId: string;

let viewerResourceRoleId: string;let superAdminUser: any;import bcrypt from 'bcrypt';import bcrypt from 'bcrypt';

let editorResourceRoleId: string;

let adminToken: string;

beforeAll(async () => {

  // Clean up existing test datalet adminUser: any;

  await prisma.userResourceRole.deleteMany();

  await prisma.rolePermissionMap.deleteMany();let regularUserToken: string;

  await prisma.resourceRole.deleteMany();

  await prisma.userRole.deleteMany();let regularUser: any;describe('Resource-Based RBAC Endpoints', () => {describe('Resource-Based RBAC Endpoints', (    it('should return 404 Not Found if assigning to a nonexistent user', async () => {

  await prisma.rolePermission.deleteMany();

  await prisma.credential.deleteMany();let testResourceType: string;

  await prisma.user.deleteMany();

  await prisma.role.deleteMany();let testResourceId: string;  let superAdminToken: string;      const nonexistentUserId = 'nonexistent-user-id';

  await prisma.permission.deleteMany();

let createdResourceRoleId: string;

  testResourceType = 'Organization';

  testResourceId = 'test_org_123';let viewerResourceRoleId: string;  let resourceUserToken: string;      const res = await request(app)



  // Create permissionslet editorResourceRoleId: string;

  const readPerm = await prisma.permission.create({

    data: { name: 'read_users', description: 'Read users' }  let resourceUserId: string;        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

  });

beforeAll(async () => {

  // Create roles

  const superAdminRole = await prisma.role.create({  // Clean up existing test data  let superAdminUser: any; // To store the super admin user object        .set('Authorization', `Bearer ${superAdminToken}`)

    data: { name: 'SUPERADMIN', description: 'Super admin role' }

  });  await prisma.userResourceRole.deleteMany();



  const adminRole = await prisma.role.create({  await prisma.rolePermissionMap.deleteMany();  let permissionTestUserId: string;        .send({ userId: nonexistentUserId });

    data: { name: 'ADMIN', description: 'Admin role' }

  });  await prisma.resourceRole.deleteMany();



  const staffRole = await prisma.role.create({  await prisma.userRole.deleteMany();  let permissionTestUserToken: string;      expect(res.statusCode).toEqual(404);

    data: { name: 'STAFF', description: 'Staff role' }

  });  await prisma.rolePermission.deleteMany();



  // Assign permissions to roles  await prisma.credential.deleteMany();  let org1EditorRoleId: string;      expect(res.body).toHaveProperty('message', 'User not found.');

  await prisma.rolePermission.create({

    data: { roleId: superAdminRole.id, permissionId: readPerm.id }  await prisma.user.deleteMany();

  });

  await prisma.role.deleteMany();  let org2ViewerRoleId: string;    });let superAdminToken: string;

  await prisma.rolePermission.create({

    data: { roleId: adminRole.id, permissionId: readPerm.id }  await prisma.permission.deleteMany();

  });

  let resourceUserToken: string;

  // Create super admin user

  const hashedSuperAdminPassword = await bcrypt.hash('superadminpass', 10);  testResourceType = 'Organization';

  superAdminUser = await prisma.user.create({

    data: {  testResourceId = 'test_org_123';  const testResourceType = "Organization";  let resourceUserId: string;

      email: 'superadmin@test.com',

      isActive: true,

      credential: {

        create: { passwordHash: hashedSuperAdminPassword }  // Create permissions  const testResourceId = "org_456"; // A new dummy organization ID for tests  let superAdminUser: any; // To store the super admin user object

      }

    }  const readPerm = await prisma.permission.create({

  });

    data: { name: 'read_users', description: 'Read users' }  let permissionTestUserId: string;

  await prisma.userRole.create({

    data: { userId: superAdminUser.id, roleId: superAdminRole.id }  });

  });

  beforeAll(async () => {  let permissionTestUserToken: string;

  superAdminToken = generateAccessToken({ 

    userId: superAdminUser.id,   // Create roles

    roles: ['SUPERADMIN'] 

  });  const superAdminRole = await prisma.role.create({    // Clear the database using truncate for a clean test state  let org1EditorRoleId: string;



  // Create admin user    data: { name: 'SUPERADMIN', description: 'Super admin role' }

  const hashedAdminPassword = await bcrypt.hash('adminpass', 10);

  adminUser = await prisma.user.create({  });    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);  let org2ViewerRoleId: string;

    data: {

      email: 'admin@test.com',

      isActive: true,

      credential: {  const adminRole = await prisma.role.create({    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);

        create: { passwordHash: hashedAdminPassword }

      }    data: { name: 'ADMIN', description: 'Admin role' }

    }

  });  });    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);  const testResourceType = "Organization";



  await prisma.userRole.create({

    data: { userId: adminUser.id, roleId: adminRole.id }

  });  const staffRole = await prisma.role.create({    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);  const testResourceId = "org_456"; // A new dummy organization ID for tests



  adminToken = generateAccessToken({     data: { name: 'STAFF', description: 'Staff role' }

    userId: adminUser.id, 

    roles: ['ADMIN']   });    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);

  });



  // Create regular user

  const hashedRegularPassword = await bcrypt.hash('regularpass', 10);  // Assign permissions to roles    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);  beforeAll(async () => {

  regularUser = await prisma.user.create({

    data: {  await prisma.rolePermission.create({

      email: 'regular@test.com',

      isActive: true,    data: { roleId: superAdminRole.id, permissionId: readPerm.id }    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);    // Clear the database using truncate for a clean test state

      credential: {

        create: { passwordHash: hashedRegularPassword }  });

      }

    }    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ResourceRole" RESTART IDENTITY CASCADE;`);    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserRole" RESTART IDENTITY CASCADE;`);

  });

  await prisma.rolePermission.create({

  await prisma.userRole.create({

    data: { userId: regularUser.id, roleId: staffRole.id }    data: { roleId: adminRole.id, permissionId: readPerm.id }    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermissionMap" RESTART IDENTITY CASCADE;`);    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermission" RESTART IDENTITY CASCADE;`);

  });

  });

  regularUserToken = generateAccessToken({ 

    userId: regularUser.id,     await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserResourceRole" RESTART IDENTITY CASCADE;`);    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RefreshToken" RESTART IDENTITY CASCADE;`);

    roles: ['STAFF'] 

  });  // Create super admin user

});

  const hashedSuperAdminPassword = await bcrypt.hash('superadminpass', 10);    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Credential" RESTART IDENTITY CASCADE;`);

afterAll(async () => {

  // Clean up test data  superAdminUser = await prisma.user.create({

  await prisma.userResourceRole.deleteMany();

  await prisma.rolePermissionMap.deleteMany();    data: {    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`);

  await prisma.resourceRole.deleteMany();

  await prisma.userRole.deleteMany();      email: 'superadmin@test.com',

  await prisma.rolePermission.deleteMany();

  await prisma.credential.deleteMany();      isActive: true,    // Seed global roles and permissions (similar to seed.ts but for tests)    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" RESTART IDENTITY CASCADE;`);

  await prisma.user.deleteMany();

  await prisma.role.deleteMany();      credential: {

  await prisma.permission.deleteMany();

  await prisma.$disconnect();        create: { passwordHash: hashedSuperAdminPassword }    const superAdminRole = await prisma.role.upsert({    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission" RESTART IDENTITY CASCADE;`);

});

      }

describe('Resources Endpoints', () => {

  describe('POST /api/resources/:resourceType/:resourceId/roles', () => {    }      where: { name: 'SUPERADMIN' },    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ResourceRole" RESTART IDENTITY CASCADE;`);

    it('should create a new resource role successfully as super admin', async () => {

      const roleData = {  });

        name: 'editor',

        description: 'Editor role for the resource',      update: {},    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RolePermissionMap" RESTART IDENTITY CASCADE;`);

        permissions: ['read', 'update', 'delete']

      };  await prisma.userRole.create({



      const res = await request(app)    data: { userId: superAdminUser.id, roleId: superAdminRole.id }      create: { name: 'SUPERADMIN', description: 'Full access to all resources' },    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserResourceRole" RESTART IDENTITY CASCADE;`);

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

        .set('Authorization', `Bearer ${superAdminToken}`)  });

        .send(roleData);

    });

      expect(res.statusCode).toEqual(201);

      expect(res.body).toHaveProperty('id');  superAdminToken = generateAccessToken({ 

      expect(res.body.name).toEqual(roleData.name);

      expect(res.body.resourceType).toEqual(testResourceType);    userId: superAdminUser.id,     const adminRole = await prisma.role.upsert({

      expect(res.body.resourceId).toEqual(testResourceId);

      expect(res.body.description).toEqual(roleData.description);    roles: ['SUPERADMIN'] 

      expect(res.body.permissions).toEqual(expect.arrayContaining(roleData.permissions));

  });      where: { name: 'ADMIN' },    // Seed global roles and permissions (similar to seed.ts but for tests)

      createdResourceRoleId = res.body.id;

    });



    it('should create a new resource role successfully as admin', async () => {  // Create admin user      update: {},    const superAdminRole = await prisma.role.upsert({

      const roleData = {

        name: 'viewer',  const hashedAdminPassword = await bcrypt.hash('adminpass', 10);

        description: 'Viewer role for the resource',

        permissions: ['read']  adminUser = await prisma.user.create({      create: { name: 'ADMIN', description: 'Admin access to most resources' },      where: { name: 'SUPERADMIN' },

      };

    data: {

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)      email: 'admin@test.com',    });      update: {},

        .set('Authorization', `Bearer ${adminToken}`)

        .send(roleData);      isActive: true,



      expect(res.statusCode).toEqual(201);      credential: {    const readPermission = await prisma.permission.upsert({      create: { name: 'SUPERADMIN', description: 'Full access to all resources' },

      expect(res.body).toHaveProperty('id');

      expect(res.body.name).toEqual(roleData.name);        create: { passwordHash: hashedAdminPassword }

      expect(res.body.resourceType).toEqual(testResourceType);

      expect(res.body.resourceId).toEqual(testResourceId);      }      where: { name: 'read_resource' },    });

      expect(res.body.permissions).toEqual(roleData.permissions);

    }

      viewerResourceRoleId = res.body.id;

    });  });      update: {},    const adminRole = await prisma.role.upsert({



    it('should return 409 Conflict when trying to create a role with existing name for same resource', async () => {

      const roleData = {

        name: 'editor', // Same name as already created  await prisma.userRole.create({      create: { name: 'read_resource', description: 'Read any resource' },      where: { name: 'ADMIN' },

        description: 'Another editor role',

        permissions: ['read']    data: { userId: adminUser.id, roleId: adminRole.id }

      };

  });    });      update: {},

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

        .set('Authorization', `Bearer ${superAdminToken}`)

        .send(roleData);  adminToken = generateAccessToken({     const writePermission = await prisma.permission.upsert({      create: { name: 'ADMIN', description: 'Admin access to most resources' },



      expect(res.statusCode).toEqual(409);    userId: adminUser.id, 

      expect(res.body).toHaveProperty('message', 'Role with this name already exists for this resource.');

    });    roles: ['ADMIN']       where: { name: 'write_resource' },    });



    it('should allow creating role with same name for different resource', async () => {  });

      const differentResourceId = 'different_org_456';

      const roleData = {      update: {},    const readPermission = await prisma.permission.upsert({

        name: 'editor', // Same name but different resource

        description: 'Editor for different resource',  // Create regular user

        permissions: ['read', 'update']

      };  const hashedRegularPassword = await bcrypt.hash('regularpass', 10);      create: { name: 'write_resource', description: 'Write any resource' },      where: { name: 'read_resource' },



      const res = await request(app)  regularUser = await prisma.user.create({

        .post(`/api/resources/${testResourceType}/${differentResourceId}/roles`)

        .set('Authorization', `Bearer ${superAdminToken}`)    data: {    });      update: {},

        .send(roleData);

      email: 'regular@test.com',

      expect(res.statusCode).toEqual(201);

      expect(res.body.name).toEqual(roleData.name);      isActive: true,      create: { name: 'read_resource', description: 'Read any resource' },

      expect(res.body.resourceId).toEqual(differentResourceId);

      credential: {

      editorResourceRoleId = res.body.id;

    });        create: { passwordHash: hashedRegularPassword }    await prisma.rolePermission.createMany({    });



    it('should return 403 Forbidden for regular user without admin privileges', async () => {      }

      const roleData = {

        name: 'unauthorized_role',    }      data: [    const writePermission = await prisma.permission.upsert({

        permissions: ['read']

      };  });



      const res = await request(app)        { roleId: superAdminRole.id, permissionId: readPermission.id },      where: { name: 'write_resource' },

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

        .set('Authorization', `Bearer ${regularUserToken}`)  await prisma.userRole.create({

        .send(roleData);

    data: { userId: regularUser.id, roleId: staffRole.id }        { roleId: superAdminRole.id, permissionId: writePermission.id },      update: {},

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions');  });

    });

      ],      create: { name: 'write_resource', description: 'Write any resource' },

    it('should return 401 Unauthorized when no token provided', async () => {

      const roleData = {  regularUserToken = generateAccessToken({ 

        name: 'no_auth_role',

        permissions: ['read']    userId: regularUser.id,       skipDuplicates: true,    });

      };

    roles: ['STAFF'] 

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)  });    });

        .send(roleData);

});

      expect(res.statusCode).toEqual(401);

      expect(res.body).toHaveProperty('message', 'No token provided');    await prisma.rolePermission.createMany({

    });

afterAll(async () => {

    it('should return 400 Bad Request for invalid input - missing name', async () => {

      const roleData = {  // Clean up test data    // Create Super Admin User      data: [

        description: 'Role without name',

        permissions: ['read']  await prisma.userResourceRole.deleteMany();

      };

  await prisma.rolePermissionMap.deleteMany();    const superAdminEmail = 'testsuperadmin@example.com';        { roleId: superAdminRole.id, permissionId: readPermission.id },

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)  await prisma.resourceRole.deleteMany();

        .set('Authorization', `Bearer ${superAdminToken}`)

        .send(roleData);  await prisma.userRole.deleteMany();    const superAdminPassword = 'password123';        { roleId: superAdminRole.id, permissionId: writePermission.id },



      expect(res.statusCode).toEqual(400);  await prisma.rolePermission.deleteMany();

      expect(res.body).toHaveProperty('error');

    });  await prisma.credential.deleteMany();    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);      ],



    it('should return 400 Bad Request for invalid input - missing permissions', async () => {  await prisma.user.deleteMany();

      const roleData = {

        name: 'role_without_permissions',  await prisma.role.deleteMany();      skipDuplicates: true,

        description: 'Role without permissions'

      };  await prisma.permission.deleteMany();



      const res = await request(app)  await prisma.$disconnect();    superAdminUser = await prisma.user.upsert({    });

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

        .set('Authorization', `Bearer ${superAdminToken}`)});

        .send(roleData);

      where: { email: superAdminEmail },

      expect(res.statusCode).toEqual(400);

      expect(res.body).toHaveProperty('error');describe('Resources Endpoints', () => {

    });

  describe('POST /api/resources/:resourceType/:resourceId/roles', () => {      update: {},    // Create Super Admin User

    it('should return 400 Bad Request for empty permissions array', async () => {

      const roleData = {    it('should create a new resource role successfully as super admin', async () => {

        name: 'role_empty_permissions',

        description: 'Role with empty permissions',      const roleData = {      create: {    const superAdminEmail = 'testsuperadmin@example.com';

        permissions: []

      };        name: 'editor',



      const res = await request(app)        description: 'Editor role for the resource',        email: superAdminEmail,    const superAdminPassword = 'password123';

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

        .set('Authorization', `Bearer ${superAdminToken}`)        permissions: ['read', 'update', 'delete']

        .send(roleData);

      };        isActive: true,    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

      expect(res.statusCode).toEqual(400);

      expect(res.body).toHaveProperty('error');

    });

  });      const res = await request(app)        credential: { create: { passwordHash: hashedPassword } },



  describe('POST /api/resources/:resourceType/:resourceId/roles/:roleId/assign', () => {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

    it('should assign user to resource role successfully as super admin', async () => {

      const assignmentData = {        .set('Authorization', `Bearer ${superAdminToken}`)      },    superAdminUser = await prisma.user.upsert({

        userId: regularUser.id

      };        .send(roleData);



      const res = await request(app)    });      where: { email: superAdminEmail },

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.statusCode).toEqual(201);

        .send(assignmentData);

      expect(res.body).toHaveProperty('id');    await prisma.userRole.upsert({      update: {},

      expect(res.statusCode).toEqual(201);

      expect(res.body.userId).toEqual(regularUser.id);      expect(res.body.name).toEqual(roleData.name);

      expect(res.body.resourceRoleId).toEqual(createdResourceRoleId);

      expect(res.body.resourceType).toEqual(testResourceType);      expect(res.body.resourceType).toEqual(testResourceType);      where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },      create: {

      expect(res.body.resourceId).toEqual(testResourceId);

    });      expect(res.body.resourceId).toEqual(testResourceId);



    it('should assign user to resource role successfully as admin', async () => {      expect(res.body.description).toEqual(roleData.description);      update: {},        email: superAdminEmail,

      const assignmentData = {

        userId: adminUser.id      expect(res.body.permissions).toEqual(expect.arrayContaining(roleData.permissions));

      };

      create: { userId: superAdminUser.id, roleId: superAdminRole.id },        isActive: true,

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/different_org_456/roles/${editorResourceRoleId}/assign`)      createdResourceRoleId = res.body.id;

        .set('Authorization', `Bearer ${adminToken}`)

        .send(assignmentData);    });    });        credential: { create: { passwordHash: hashedPassword } },



      expect(res.statusCode).toEqual(201);

      expect(res.body.userId).toEqual(adminUser.id);

      expect(res.body.resourceRoleId).toEqual(editorResourceRoleId);    it('should create a new resource role successfully as admin', async () => {    superAdminToken = generateAccessToken({ userId: superAdminUser.id, roles: [superAdminRole.name] });      },

    });

      const roleData = {

    it('should return 409 Conflict when user already has a role for the resource', async () => {

      const assignmentData = {        name: 'viewer',    });

        userId: regularUser.id // Already assigned to this resource

      };        description: 'Viewer role for the resource',



      const res = await request(app)        permissions: ['read']    // Create a regular user for resource roles    await prisma.userRole.upsert({

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${viewerResourceRoleId}/assign`)

        .set('Authorization', `Bearer ${superAdminToken}`)      };

        .send(assignmentData);

    const resourceUserEmail = "testresource.user@example.com";      where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },

      expect(res.statusCode).toEqual(409);

      expect(res.body).toHaveProperty('message', 'User already has a role assigned for this resource.');      const res = await request(app)

    });

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)    const resourceUserPassword = "resourcepassword";      update: {},

    it('should return 404 Not Found for non-existent role', async () => {

      const assignmentData = {        .set('Authorization', `Bearer ${adminToken}`)

        userId: regularUser.id

      };        .send(roleData);    const hashedResourcePassword = await bcrypt.hash(resourceUserPassword, 10);      create: { userId: superAdminUser.id, roleId: superAdminRole.id },



      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/non-existent-role-id/assign`)

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.statusCode).toEqual(201);    });

        .send(assignmentData);

      expect(res.body).toHaveProperty('id');

      expect(res.statusCode).toEqual(404);

      expect(res.body).toHaveProperty('message', 'Resource role not found.');      expect(res.body.name).toEqual(roleData.name);    const resourceUser = await prisma.user.upsert({    superAdminToken = generateAccessToken({ userId: superAdminUser.id, roles: [superAdminRole.name] });

    });

      expect(res.body.resourceType).toEqual(testResourceType);

    it('should return 404 Not Found for non-existent user', async () => {

      const assignmentData = {      expect(res.body.resourceId).toEqual(testResourceId);      where: { email: resourceUserEmail },

        userId: 'non-existent-user-id'

      };      expect(res.body.permissions).toEqual(roleData.permissions);



      const res = await request(app)      update: {},    // Create a regular user for resource roles

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .set('Authorization', `Bearer ${superAdminToken}`)      viewerResourceRoleId = res.body.id;

        .send(assignmentData);

    });      create: {    const resourceUserEmail = "testresource.user@example.com";

      expect(res.statusCode).toEqual(404);

      expect(res.body).toHaveProperty('message', 'User not found.');

    });

    it('should return 409 Conflict when trying to create a role with existing name for same resource', async () => {        email: resourceUserEmail,    const resourceUserPassword = "resourcepassword";

    it('should return 403 Forbidden for regular user without admin privileges', async () => {

      const assignmentData = {      const roleData = {

        userId: superAdminUser.id

      };        name: 'editor', // Same name as already created        isActive: true,    const hashedResourcePassword = await bcrypt.hash(resourceUserPassword, 10);



      const res = await request(app)        description: 'Another editor role',

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .set('Authorization', `Bearer ${regularUserToken}`)        permissions: ['read']        credential: { create: { passwordHash: hashedResourcePassword } },

        .send(assignmentData);

      };

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions');      },    const resourceUser = await prisma.user.upsert({

    });

      const res = await request(app)

    it('should return 401 Unauthorized when no token provided', async () => {

      const assignmentData = {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)    });      where: { email: resourceUserEmail },

        userId: superAdminUser.id

      };        .set('Authorization', `Bearer ${superAdminToken}`)



      const res = await request(app)        .send(roleData);    resourceUserId = resourceUser.id;      update: {},

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .send(assignmentData);



      expect(res.statusCode).toEqual(401);      expect(res.statusCode).toEqual(409);    resourceUserToken = generateAccessToken({ userId: resourceUserId, roles: [] }); // Initially no roles      create: {

      expect(res.body).toHaveProperty('message', 'No token provided');

    });      expect(res.body).toHaveProperty('message', 'Role with this name already exists for this resource.');



    it('should return 400 Bad Request for missing userId', async () => {    });  });        email: resourceUserEmail,

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .set('Authorization', `Bearer ${superAdminToken}`)

        .send({});    it('should allow creating role with same name for different resource', async () => {        isActive: true,



      expect(res.statusCode).toEqual(400);      const differentResourceId = 'different_org_456';

      expect(res.body).toHaveProperty('error');

    });      const roleData = {  afterAll(async () => {        credential: { create: { passwordHash: hashedResourcePassword } },

  });

        name: 'editor', // Same name but different resource

  describe('DELETE /api/resources/:resourceType/:resourceId/roles/:roleId/assign/:userId', () => {

    it('should unassign user from resource role successfully as super admin', async () => {        description: 'Editor for different resource',    await prisma.$disconnect();      },

      const res = await request(app)

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`)        permissions: ['read', 'update']

        .set('Authorization', `Bearer ${superAdminToken}`);

      };  });    });

      expect(res.statusCode).toEqual(200);

      expect(res.body).toHaveProperty('success', true);



      // Verify assignment is gone      const res = await request(app)    resourceUserId = resourceUser.id;

      const assignment = await prisma.userResourceRole.findUnique({

        where: {        .post(`/api/resources/${testResourceType}/${differentResourceId}/roles`)

          userId_resourceRoleId: {

            userId: regularUser.id,        .set('Authorization', `Bearer ${superAdminToken}`)  // --- Role Creation Tests ---    resourceUserToken = generateAccessToken({ userId: resourceUserId, roles: [] }); // Initially no roles

            resourceRoleId: createdResourceRoleId,

          },        .send(roleData);

        },

      });  describe('POST /resources/:resourceType/:resourceId/roles', () => {  });



      expect(assignment).toBeNull();      expect(res.statusCode).toEqual(201);

    });

      expect(res.body.name).toEqual(roleData.name);    it('should create a valid role for a resource', async () => {

    it('should return 404 Not Found for a nonexistent assignment', async () => {

      const res = await request(app)      expect(res.body.resourceId).toEqual(differentResourceId);

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`) // Already unassigned

        .set('Authorization', `Bearer ${superAdminToken}`);      const res = await request(app)  afterAll(async () => {



      expect(res.statusCode).toEqual(404);      editorResourceRoleId = res.body.id;

      expect(res.body).toHaveProperty('message', 'User resource role assignment not found.');

    });    });        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)    await prisma.$disconnect();



    it('should unassign user from resource role successfully as admin', async () => {

      const res = await request(app)

        .delete(`/api/resources/${testResourceType}/different_org_456/roles/${editorResourceRoleId}/assign/${adminUser.id}`)    it('should return 403 Forbidden for regular user without admin privileges', async () => {        .set('Authorization', `Bearer ${superAdminToken}`)  });

        .set('Authorization', `Bearer ${adminToken}`);

      const roleData = {

      expect(res.statusCode).toEqual(200);

      expect(res.body).toHaveProperty('success', true);        name: 'unauthorized_role',        .send({

    });

        permissions: ['read']

    it('should return 403 Forbidden for regular user without admin privileges', async () => {

      // First reassign to have something to unassign      };          name: 'editor',  // --- Role Creation Tests ---

      await prisma.userResourceRole.create({

        data: {

          userId: regularUser.id,

          resourceRoleId: createdResourceRoleId,      const res = await request(app)          description: 'Can edit items in this resource',  describe('POST /resources/:resourceType/:resourceId/roles', () => {

          resourceType: testResourceType,

          resourceId: testResourceId,        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

        },

      });        .set('Authorization', `Bearer ${regularUserToken}`)          permissions: ['read', 'update'],    it('should create a valid role for a resource', async () => {



      const res = await request(app)        .send(roleData);

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`)

        .set('Authorization', `Bearer ${regularUserToken}`);        });      const res = await request(app)



      expect(res.statusCode).toEqual(403);      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions');

    });      expect(res.body).toHaveProperty('message', 'Insufficient permissions');      expect(res.statusCode).toEqual(201);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)



    it('should return 401 Unauthorized when no token provided', async () => {    });

      const res = await request(app)

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`);      expect(res.body).toHaveProperty('id');        .set('Authorization', `Bearer ${superAdminToken}`)



      expect(res.statusCode).toEqual(401);    it('should return 401 Unauthorized when no token provided', async () => {

      expect(res.body).toHaveProperty('message', 'No token provided');

    });      const roleData = {      expect(res.body).toHaveProperty('name', 'editor');        .send({

  });

        name: 'no_auth_role',

  describe('GET /api/resources/:resourceType/:resourceId/users/:userId/permissions', () => {

    let permissionTestUserId: string;        permissions: ['read']      expect(res.body).toHaveProperty('resourceType', testResourceType);          name: 'editor',

    let permissionTestUserToken: string;

    let org1EditorRoleId: string;      };

    let org2ViewerRoleId: string;

      expect(res.body).toHaveProperty('resourceId', testResourceId);          description: 'Can edit items in this resource',

    beforeAll(async () => {

      // Create a test user for permission tests      const res = await request(app)

      const permissionUserEmail = "permission.user@example.com";

      const hashedPermissionPassword = await bcrypt.hash('password123', 10);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));          permissions: ['read', 'update'],



      const permissionUser = await prisma.user.create({        .send(roleData);

        data: {

          email: permissionUserEmail,    });        });

          isActive: true,

          credential: { create: { passwordHash: hashedPermissionPassword } },      expect(res.statusCode).toEqual(401);

        },

      });      expect(res.body).toHaveProperty('message', 'No token provided');      expect(res.statusCode).toEqual(201);



      permissionTestUserId = permissionUser.id;    });

      permissionTestUserToken = generateAccessToken({ userId: permissionTestUserId, roles: [] });

    it('should return 409 Conflict if creating a duplicate role in the same resource', async () => {      expect(res.body).toHaveProperty('id');

      // Create resource roles for permission testing

      const org1EditorRole = await prisma.resourceRole.create({    it('should return 400 Bad Request for invalid input - missing name', async () => {

        data: {

          name: 'editor',      const roleData = {      // First create the role      expect(res.body).toHaveProperty('name', 'editor');

          resourceType: 'Organization',

          resourceId: 'org_perm_1',        description: 'Role without name',

          description: 'Editor for Org 1',

        },        permissions: ['read']      await request(app)      expect(res.body).toHaveProperty('resourceType', testResourceType);

      });

      };

      org1EditorRoleId = org1EditorRole.id;

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)      expect(res.body).toHaveProperty('resourceId', testResourceId);

      // Create permissions for the editor role

      await prisma.rolePermissionMap.createMany({      const res = await request(app)

        data: [

          { resourceRoleId: org1EditorRoleId, permissionVerb: 'read' },        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));

          { resourceRoleId: org1EditorRoleId, permissionVerb: 'update' },

        ],        .set('Authorization', `Bearer ${superAdminToken}`)

        skipDuplicates: true,

      });        .send(roleData);        .send({    });



      const org2ViewerRole = await prisma.resourceRole.create({

        data: {

          name: 'viewer',      expect(res.statusCode).toEqual(400);          name: 'duplicate_role',

          resourceType: 'Organization',

          resourceId: 'org_perm_2',      expect(res.body).toHaveProperty('error');

          description: 'Viewer for Org 2',

        },    });          description: 'A role to be duplicated',    it('should return 409 Conflict if creating a duplicate role in the same resource', async () => {

      });



      org2ViewerRoleId = org2ViewerRole.id;

    it('should return 400 Bad Request for invalid input - missing permissions', async () => {          permissions: ['read'],      // First create the role

      // Create permissions for the viewer role

      await prisma.rolePermissionMap.createMany({      const roleData = {

        data: [

          { resourceRoleId: org2ViewerRoleId, permissionVerb: 'read' }        name: 'role_without_permissions',        });      await request(app)

        ],

        skipDuplicates: true,        description: 'Role without permissions'

      });

      };        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

      // Assign user to roles

      await prisma.userResourceRole.create({

        data: {

          userId: permissionTestUserId,      const res = await request(app)      // Then try to create it again        .set('Authorization', `Bearer ${superAdminToken}`)

          resourceRoleId: org1EditorRoleId,

          resourceType: 'Organization',        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

          resourceId: 'org_perm_1',

        },        .set('Authorization', `Bearer ${superAdminToken}`)      const res = await request(app)        .send({

      });

        .send(roleData);

      await prisma.userResourceRole.create({

        data: {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)          name: 'duplicate_role',

          userId: permissionTestUserId,

          resourceRoleId: org2ViewerRoleId,      expect(res.statusCode).toEqual(400);

          resourceType: 'Organization',

          resourceId: 'org_perm_2',      expect(res.body).toHaveProperty('error');        .set('Authorization', `Bearer ${superAdminToken}`)          description: 'A role to be duplicated',

        },

      });    });

    });

        .send({          permissions: ['read'],

    it('should return user permissions for a resource as super admin', async () => {

      const res = await request(app)    it('should return 400 Bad Request for empty permissions array', async () => {

        .get(`/api/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`)

        .set('Authorization', `Bearer ${superAdminToken}`); // Super admin can query any user's permissions      const roleData = {          name: 'duplicate_role',        });



      expect(res.statusCode).toEqual(200);        name: 'role_empty_permissions',

      expect(res.body).toHaveProperty('permissions');

      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));        description: 'Role with empty permissions',          description: 'A role to be duplicated',

    });

        permissions: []

    it('should return user permissions for a resource as admin', async () => {

      const res = await request(app)      };          permissions: ['read'],      // Then try to create it again

        .get(`/api/resources/Organization/org_perm_2/users/${permissionTestUserId}/permissions`)

        .set('Authorization', `Bearer ${adminToken}`);



      expect(res.statusCode).toEqual(200);      const res = await request(app)        });      const res = await request(app)

      expect(res.body).toHaveProperty('permissions');

      expect(res.body.permissions).toEqual(['read']);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

    });

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.statusCode).toEqual(409);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

    it('should return 404 Not Found if user has no role in the specified resource', async () => {

      const res = await request(app)        .send(roleData);

        .get(`/api/resources/Organization/nonexistent_org/users/${permissionTestUserId}/permissions`)

        .set('Authorization', `Bearer ${superAdminToken}`);      expect(res.body).toHaveProperty('message', 'Role with this name already exists for this resource.');        .set('Authorization', `Bearer ${superAdminToken}`)



      expect(res.statusCode).toEqual(404);      expect(res.statusCode).toEqual(400);

      expect(res.body).toHaveProperty('message', 'User has no role in this resource.');

    });      expect(res.body).toHaveProperty('error');    });        .send({



    it('should return 403 Forbidden if authenticated but not authorized to query permissions', async () => {    });

      const res = await request(app)

        .get(`/api/resources/Organization/org_perm_1/users/${superAdminUser.id}/permissions`) // resourceUser trying to query superAdmin  });          name: 'duplicate_role',

        .set('Authorization', `Bearer ${permissionTestUserToken}`);



      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions');  describe('POST /api/resources/:resourceType/:resourceId/roles/:roleId/assign', () => {    it('should return 400 Bad Request for invalid body (missing fields)', async () => {          description: 'A role to be duplicated',

    });

    it('should assign user to resource role successfully as super admin', async () => {

    it('should return 401 Unauthorized when no token provided', async () => {

      const res = await request(app)      const assignmentData = {      const res = await request(app)          permissions: ['read'],

        .get(`/api/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`);

        userId: regularUser.id

      expect(res.statusCode).toEqual(401);

      expect(res.body).toHaveProperty('message', 'No token provided');      };        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)        });

    });

  });



  describe('Middleware: authorizeResource', () => {      const res = await request(app)        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.statusCode).toEqual(409);

    it('should allow access if user has required permission on resource', async () => {

      // First create a user with permissions for testing        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

      const testUser = await prisma.user.create({

        data: {        .set('Authorization', `Bearer ${superAdminToken}`)        .send({      expect(res.body).toHaveProperty('message', 'Role with this name already exists for this resource.');

          email: 'resource.test@example.com',

          isActive: true,        .send(assignmentData);

          credential: {

            create: { passwordHash: await bcrypt.hash('password', 10) }          name: 'invalid_role',    });

          }

        }      expect(res.statusCode).toEqual(201);

      });

      expect(res.body.userId).toEqual(regularUser.id);          // Missing permissions

      const testRole = await prisma.resourceRole.create({

        data: {      expect(res.body.resourceRoleId).toEqual(createdResourceRoleId);

          name: 'tester',

          resourceType: testResourceType,      expect(res.body.resourceType).toEqual(testResourceType);        });    it('should return 400 Bad Request for invalid body (missing fields)', async () => {

          resourceId: testResourceId,

          description: 'Test role'      expect(res.body.resourceId).toEqual(testResourceId);

        }

      });    });      expect(res.statusCode).toEqual(400);      const res = await request(app)



      await prisma.rolePermissionMap.create({

        data: {

          resourceRoleId: testRole.id,    it('should assign user to resource role successfully as admin', async () => {      expect(res.body).toHaveProperty('message'); // Expecting a validation error message        .post(`/api/resources/${testResourceType}/${testResourceId}/roles`)

          permissionVerb: 'read'

        }      const assignmentData = {

      });

        userId: adminUser.id    });        .set('Authorization', `Bearer ${superAdminToken}`)

      await prisma.userResourceRole.create({

        data: {      };

          userId: testUser.id,

          resourceRoleId: testRole.id,  });        .send({

          resourceType: testResourceType,

          resourceId: testResourceId      const res = await request(app)

        }

      });        .post(`/api/resources/${testResourceType}/different_org_456/roles/${editorResourceRoleId}/assign`)          name: 'invalid_role',



      const testToken = generateAccessToken({ userId: testUser.id, roles: [] });        .set('Authorization', `Bearer ${adminToken}`)



      const res = await request(app)        .send(assignmentData);  // --- Role Assignment Tests ---          // Missing permissions

        .get(`/api/resources/${testResourceType}/${testResourceId}/test-read`)

        .set('Authorization', `Bearer ${testToken}`);



      expect(res.statusCode).toEqual(200);      expect(res.statusCode).toEqual(201);  describe('POST /resources/:resourceType/:resourceId/roles/:roleId/assign', () => {        });

      expect(res.body).toHaveProperty('message', 'Access granted');

      expect(res.body).toHaveProperty('action', 'read');      expect(res.body.userId).toEqual(adminUser.id);

    });

      expect(res.body.resourceRoleId).toEqual(editorResourceRoleId);    let editorResourceRoleId: string;      expect(res.statusCode).toEqual(400);

    it('should deny access if user does not have required permission on resource', async () => {

      // Create a user without write permissions    });

      const testUser = await prisma.user.create({

        data: {    let viewerResourceRoleId: string;      expect(res.body).toHaveProperty('message'); // Expecting a validation error message

          email: 'no.write.user@example.com',

          isActive: true,    it('should return 409 Conflict when user already has a role for the resource', async () => {

          credential: {

            create: { passwordHash: await bcrypt.hash('password', 10) }      const assignmentData = {    });

          }

        }        userId: regularUser.id // Already assigned to this resource

      });

      };    beforeAll(async () => {  });

      const testToken = generateAccessToken({ userId: testUser.id, roles: [] });



      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/test-write`)      const res = await request(app)      // Ensure the editor role exists for assignment tests

        .set('Authorization', `Bearer ${testToken}`);

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${viewerResourceRoleId}/assign`)

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions for this resource');        .set('Authorization', `Bearer ${superAdminToken}`)      const editorRole = await prisma.resourceRole.upsert({  // --- Role Assignment Tests ---

    });

        .send(assignmentData);

    it('should deny access if unauthenticated', async () => {

      const res = await request(app)        where: { name_resourceType_resourceId: { name: 'assign_editor', resourceType: testResourceType, resourceId: testResourceId } },  describe('POST /resources/:resourceType/:resourceId/roles/:roleId/assign', () => {

        .get(`/api/resources/${testResourceType}/${testResourceId}/test-read`);

      expect(res.statusCode).toEqual(409);

      expect(res.statusCode).toEqual(401);

      expect(res.body).toHaveProperty('message', 'No token provided');      expect(res.body).toHaveProperty('message', 'User already has a role assigned for this resource.');        update: {},    let editorResourceRoleId: string;

    });

    });

    it('should deny access for non-existent resource', async () => {

      const testUser = await prisma.user.create({        create: {    let viewerResourceRoleId: string;

        data: {

          email: 'nonexistent.test@example.com',    it('should return 404 Not Found for non-existent role', async () => {

          isActive: true,

          credential: {      const assignmentData = {          name: 'assign_editor',

            create: { passwordHash: await bcrypt.hash('password', 10) }

          }        userId: regularUser.id

        }

      });      };          resourceType: testResourceType,    beforeAll(async () => {



      const testToken = generateAccessToken({ userId: testUser.id, roles: [] });



      const res = await request(app)      const res = await request(app)          resourceId: testResourceId,      // Ensure the editor role exists for assignment tests

        .get(`/api/resources/Organization/nonexistent_resource/test-read`)

        .set('Authorization', `Bearer ${testToken}`);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/non-existent-role-id/assign`)



      expect(res.statusCode).toEqual(403);        .set('Authorization', `Bearer ${superAdminToken}`)          description: 'Editor role for assignment tests',      const editorRole = await prisma.resourceRole.upsert({

      expect(res.body).toHaveProperty('message', 'Insufficient permissions for this resource');

    });        .send(assignmentData);

  });

});        },        where: { name_resourceType_resourceId: { name: 'assign_editor', resourceType: testResourceType, resourceId: testResourceId } },

      expect(res.statusCode).toEqual(404);

      expect(res.body).toHaveProperty('message', 'Resource role not found.');      });        update: {},

    });

      editorResourceRoleId = editorRole.id;        create: {

    it('should return 404 Not Found for non-existent user', async () => {

      const assignmentData = {          name: 'assign_editor',

        userId: 'non-existent-user-id'

      };      // Ensure a viewer role exists for assignment tests on a different resource          resourceType: testResourceType,



      const res = await request(app)      const viewerRole = await prisma.resourceRole.upsert({          resourceId: testResourceId,

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .set('Authorization', `Bearer ${superAdminToken}`)        where: { name_resourceType_resourceId: { name: 'assign_viewer', resourceType: testResourceType, resourceId: 'org_different' } },          description: 'Editor role for assignment tests',

        .send(assignmentData);

        update: {},        },

      expect(res.statusCode).toEqual(404);

      expect(res.body).toHaveProperty('message', 'User not found.');        create: {      });

    });

          name: 'assign_viewer',      editorResourceRoleId = editorRole.id;

    it('should return 403 Forbidden for regular user without admin privileges', async () => {

      const assignmentData = {          resourceType: testResourceType,

        userId: superAdminUser.id

      };          resourceId: 'org_different',      // Ensure a viewer role exists for assignment tests on a different resource



      const res = await request(app)          description: 'Viewer role for a different resource',      const viewerRole = await prisma.resourceRole.upsert({

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .set('Authorization', `Bearer ${regularUserToken}`)        },        where: { name_resourceType_resourceId: { name: 'assign_viewer', resourceType: testResourceType, resourceId: 'org_different' } },

        .send(assignmentData);

      });        update: {},

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions');      viewerResourceRoleId = viewerRole.id;        create: {

    });

    });          name: 'assign_viewer',

    it('should return 401 Unauthorized when no token provided', async () => {

      const assignmentData = {          resourceType: testResourceType,

        userId: superAdminUser.id

      };    it('should assign a role to a user for a resource', async () => {          resourceId: 'org_different',



      const res = await request(app)      const res = await request(app)          description: 'Viewer role for a different resource',

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)

        .send(assignmentData);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)        },



      expect(res.statusCode).toEqual(401);        .set('Authorization', `Bearer ${superAdminToken}`)      });

      expect(res.body).toHaveProperty('message', 'No token provided');

    });        .send({ userId: resourceUserId });      viewerResourceRoleId = viewerRole.id;



    it('should return 400 Bad Request for missing userId', async () => {      expect(res.statusCode).toEqual(201);    });

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign`)      expect(res.body).toHaveProperty('userId', resourceUserId);

        .set('Authorization', `Bearer ${superAdminToken}`)

        .send({});      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);    it('should assign a role to a user for a resource', async () => {



      expect(res.statusCode).toEqual(400);      expect(res.body).toHaveProperty('resourceType', testResourceType);      const res = await request(app)

      expect(res.body).toHaveProperty('error');

    });      expect(res.body).toHaveProperty('resourceId', testResourceId);        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

  });

    });        .set('Authorization', `Bearer ${superAdminToken}`)

  describe('DELETE /api/resources/:resourceType/:resourceId/roles/:roleId/assign/:userId', () => {

    it('should unassign user from resource role successfully as super admin', async () => {        .send({ userId: resourceUserId });

      const res = await request(app)

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`)    it('should return 409 Conflict if user already has a role for that resource', async () => {      expect(res.statusCode).toEqual(201);

        .set('Authorization', `Bearer ${superAdminToken}`);

      // Assign once (done in previous test or setup)      expect(res.body).toHaveProperty('userId', resourceUserId);

      expect(res.statusCode).toEqual(200);

      expect(res.body).toHaveProperty('success', true);      // Try to assign again      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);



      // Verify assignment is gone      const res = await request(app)      expect(res.body).toHaveProperty('resourceType', testResourceType);

      const assignment = await prisma.userResourceRole.findUnique({

        where: {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)      expect(res.body).toHaveProperty('resourceId', testResourceId);

          userId_resourceRoleId: {

            userId: regularUser.id,        .set('Authorization', `Bearer ${superAdminToken}`)    });

            resourceRoleId: createdResourceRoleId,

          },        .send({ userId: resourceUserId });

        },

      });      expect(res.statusCode).toEqual(409);    it('should return 409 Conflict if user already has a role for that resource', async () => {



      expect(assignment).toBeNull();      expect(res.body).toHaveProperty('message', 'User already has a role assigned for this resource.');      // Assign once (done in previous test or setup)

    });

    });      // Try to assign again

    it('should return 404 Not Found for a nonexistent assignment', async () => {

      const res = await request(app)      const res = await request(app)

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`) // Already unassigned

        .set('Authorization', `Bearer ${superAdminToken}`);    it('should return 404 Not Found if assigning to a nonexistent role', async () => {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)



      expect(res.statusCode).toEqual(404);      const nonexistentRoleId = 'nonexistent-role-id';        .set('Authorization', `Bearer ${superAdminToken}`)

      expect(res.body).toHaveProperty('message', 'User resource role assignment not found.');

    });      const res = await request(app)        .send({ userId: resourceUserId });



    it('should unassign user from resource role successfully as admin', async () => {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${nonexistentRoleId}/assign`)      expect(res.statusCode).toEqual(409);

      const res = await request(app)

        .delete(`/api/resources/${testResourceType}/different_org_456/roles/${editorResourceRoleId}/assign/${adminUser.id}`)        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body).toHaveProperty('message', 'User already has a role assigned for this resource.');

        .set('Authorization', `Bearer ${adminToken}`);

        .send({ userId: resourceUserId });    });

      expect(res.statusCode).toEqual(200);

      expect(res.body).toHaveProperty('success', true);      expect(res.statusCode).toEqual(404);

    });

      expect(res.body).toHaveProperty('message', 'Resource role not found.');    it('should return 404 Not Found if assigning to a nonexistent role', async () => {

    it('should return 403 Forbidden for regular user without admin privileges', async () => {

      // First reassign to have something to unassign    });      const nonexistentRoleId = 'nonexistent-role-id';

      await prisma.userResourceRole.create({

        data: {      const res = await request(app)

          userId: regularUser.id,

          resourceRoleId: createdResourceRoleId,    it('should return 404 Not Found if assigning to a nonexistent user', async () => {        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${nonexistentRoleId}/assign`)

          resourceType: testResourceType,

          resourceId: testResourceId,      const nonexistentUserId = 'nonexistent-user-id';        .set('Authorization', `Bearer ${superAdminToken}`)

        },

      });      const res = await request(app)        .send({ userId: resourceUserId });



      const res = await request(app)        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)      expect(res.statusCode).toEqual(404);

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`)

        .set('Authorization', `Bearer ${regularUserToken}`);        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body).toHaveProperty('message', 'Resource role not found.');



      expect(res.statusCode).toEqual(403);        .send({ userId: nonexistentUserId });    });

      expect(res.body).toHaveProperty('message', 'Insufficient permissions');

    });      expect(res.statusCode).toEqual(404);



    it('should return 401 Unauthorized when no token provided', async () => {      expect(res.body).toHaveProperty('message', 'User not found.');    it('should return 404 Not Found if assigning to a nonexistent user', async () => {

      const res = await request(app)

        .delete(`/api/resources/${testResourceType}/${testResourceId}/roles/${createdResourceRoleId}/assign/${regularUser.id}`);    });      const nonexistentUserId = 'nonexistent-user-id';



      expect(res.statusCode).toEqual(401);      const res = await request(app)

      expect(res.body).toHaveProperty('message', 'No token provided');

    });    it('should be able to give an existing role to a new user and then map the user to an existing resource', async () => {        .post(`/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

  });

      const newUserEmail = "new.user.for.role@example.com";        .set('Authorization', `Bearer ${superAdminToken}`)

  describe('GET /api/resources/:resourceType/:resourceId/users/:userId/permissions', () => {

    let permissionTestUserId: string;      const hashedNewUserPassword = await bcrypt.hash('password123', 10);        .send({ userId: nonexistentUserId });

    let permissionTestUserToken: string;

    let org1EditorRoleId: string;      const newUser = await prisma.user.upsert({      expect(res.statusCode).toEqual(404);

    let org2ViewerRoleId: string;

        where: { email: newUserEmail },      expect(res.body).toHaveProperty('message', 'User not found.');

    beforeAll(async () => {

      // Create a test user for permission tests        update: {},    });

      const permissionUserEmail = "permission.user@example.com";

      const hashedPermissionPassword = await bcrypt.hash('password123', 10);        create: {



      const permissionUser = await prisma.user.create({          email: newUserEmail,    it('should be able to give an existing role to a new user and then map the user to an existing resource', async () => {

        where: { email: permissionUserEmail },

        update: {},          isActive: true,      const newUserEmail = "new.user.for.role@example.com";

        create: {

          email: permissionUserEmail,          credential: { create: { passwordHash: hashedNewUserPassword } },      const hashedNewUserPassword = await bcrypt.hash('password123', 10);

          isActive: true,

          credential: { create: { passwordHash: hashedPermissionPassword } },        },      const newUser = await prisma.user.upsert({

        },

      });      });        where: { email: newUserEmail },



      permissionTestUserId = permissionUser.id;        update: {},

      permissionTestUserToken = generateAccessToken({ userId: permissionTestUserId, roles: [] });

      const res = await request(app)        create: {

      // Create resource roles for permission testing

      const org1EditorRole = await prisma.resourceRole.create({        .post(`/api/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)          email: newUserEmail,

        data: {

          name: 'editor',        .set('Authorization', `Bearer ${superAdminToken}`)          isActive: true,

          resourceType: 'Organization',

          resourceId: 'org_perm_1',        .send({ userId: newUser.id });          credential: { create: { passwordHash: hashedNewUserPassword } },

          description: 'Editor for Org 1',

        },        },

      });

      expect(res.statusCode).toEqual(201);      });

      org1EditorRoleId = org1EditorRole.id;

      expect(res.body).toHaveProperty('userId', newUser.id);

      // Create permissions for the editor role

      await prisma.rolePermissionMap.createMany({      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);      const res = await request(app)

        data: [

          { resourceRoleId: org1EditorRoleId, permissionVerb: 'read' },      expect(res.body).toHaveProperty('resourceType', testResourceType);        .post(`/resources/${testResourceType}/${testResourceId}/roles/${editorResourceRoleId}/assign`)

          { resourceRoleId: org1EditorRoleId, permissionVerb: 'update' },

        ],      expect(res.body).toHaveProperty('resourceId', testResourceId);        .set('Authorization', `Bearer ${superAdminToken}`)

        skipDuplicates: true,

      });    });        .send({ userId: newUser.id });



      const org2ViewerRole = await prisma.resourceRole.create({

        data: {

          name: 'viewer',    it('should be able to give an existing user a different role for a different resource', async () => {      expect(res.statusCode).toEqual(201);

          resourceType: 'Organization',

          resourceId: 'org_perm_2',      const differentResourceId = "org_different";      expect(res.body).toHaveProperty('userId', newUser.id);

          description: 'Viewer for Org 2',

        },      const res = await request(app)      expect(res.body).toHaveProperty('resourceRoleId', editorResourceRoleId);

      });

        .post(`/api/resources/${testResourceType}/${differentResourceId}/roles/${viewerResourceRoleId}/assign`)      expect(res.body).toHaveProperty('resourceType', testResourceType);

      org2ViewerRoleId = org2ViewerRole.id;

        .set('Authorization', `Bearer ${superAdminToken}`)      expect(res.body).toHaveProperty('resourceId', testResourceId);

      // Create permissions for the viewer role

      await prisma.rolePermissionMap.createMany({        .send({ userId: resourceUserId });    });

        data: [

          { resourceRoleId: org2ViewerRoleId, permissionVerb: 'read' }

        ],

        skipDuplicates: true,      expect(res.statusCode).toEqual(201);    it('should be able to give an existing user a different role for a different resource', async () => {

      });

      expect(res.body).toHaveProperty('userId', resourceUserId);      const differentResourceId = "org_different";

      // Assign user to roles

      await prisma.userResourceRole.create({      expect(res.body).toHaveProperty('resourceRoleId', viewerResourceRoleId);      const res = await request(app)

        data: {

          userId: permissionTestUserId,      expect(res.body).toHaveProperty('resourceType', testResourceType);        .post(`/resources/${testResourceType}/${differentResourceId}/roles/${viewerResourceRoleId}/assign`)

          resourceRoleId: org1EditorRoleId,

          resourceType: 'Organization',      expect(res.body).toHaveProperty('resourceId', differentResourceId);        .set('Authorization', `Bearer ${superAdminToken}`)

          resourceId: 'org_perm_1',

        },    });        .send({ userId: resourceUserId });

      });

  });

      await prisma.userResourceRole.create({

        data: {      expect(res.statusCode).toEqual(201);

          userId: permissionTestUserId,

          resourceRoleId: org2ViewerRoleId,  // --- Role Unassignment Tests ---      expect(res.body).toHaveProperty('userId', resourceUserId);

          resourceType: 'Organization',

          resourceId: 'org_perm_2',  describe('DELETE /resources/:resourceType/:resourceId/roles/:roleId/assign/:userId', () => {      expect(res.body).toHaveProperty('resourceRoleId', viewerResourceRoleId);

        },

      });    let unassignableRoleId: string;      expect(res.body).toHaveProperty('resourceType', testResourceType);

    });

    let userToUnassignId: string;      expect(res.body).toHaveProperty('resourceId', differentResourceId);

    it('should return user permissions for a resource as super admin', async () => {

      const res = await request(app)    let userToUnassignToken: string;    });

        .get(`/api/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`)

        .set('Authorization', `Bearer ${superAdminToken}`); // Super admin can query any user's permissions  });



      expect(res.statusCode).toEqual(200);    beforeAll(async () => {

      expect(res.body).toHaveProperty('permissions');

      expect(res.body.permissions).toEqual(expect.arrayContaining(['read', 'update']));      // Create a role and user specifically for unassignment tests  // --- Role Unassignment Tests ---

    });

      const unassignRole = await prisma.resourceRole.upsert({  describe('DELETE /resources/:resourceType/:resourceId/roles/:roleId/assign/:userId', () => {

    it('should return user permissions for a resource as admin', async () => {

      const res = await request(app)        where: { name_resourceType_resourceId: { name: 'unassign_role', resourceType: testResourceType, resourceId: 'org_unassign' } },    let unassignableRoleId: string;

        .get(`/api/resources/Organization/org_perm_2/users/${permissionTestUserId}/permissions`)

        .set('Authorization', `Bearer ${adminToken}`);        update: {},    let userToUnassignId: string;



      expect(res.statusCode).toEqual(200);        create: {    let userToUnassignToken: string;

      expect(res.body).toHaveProperty('permissions');

      expect(res.body.permissions).toEqual(['read']);          name: 'unassign_role',

    });

          resourceType: testResourceType,    beforeAll(async () => {

    it('should return 404 Not Found if user has no role in the specified resource', async () => {

      const res = await request(app)          resourceId: 'org_unassign',      // Create a role and user specifically for unassignment tests

        .get(`/api/resources/Organization/nonexistent_org/users/${permissionTestUserId}/permissions`)

        .set('Authorization', `Bearer ${superAdminToken}`);          description: 'Role for unassignment tests',      const unassignRole = await prisma.resourceRole.upsert({



      expect(res.statusCode).toEqual(404);        },        where: { name_resourceType_resourceId: { name: 'unassign_role', resourceType: testResourceType, resourceId: 'org_unassign' } },

      expect(res.body).toHaveProperty('message', 'User has no role in this resource.');

    });      });        update: {},



    it('should return 403 Forbidden if authenticated but not authorized to query permissions', async () => {      unassignableRoleId = unassignRole.id;        create: {

      const res = await request(app)

        .get(`/api/resources/Organization/org_perm_1/users/${superAdminUser.id}/permissions`) // resourceUser trying to query superAdmin          name: 'unassign_role',

        .set('Authorization', `Bearer ${permissionTestUserToken}`);

      const unassignUserEmail = "unassign.user@example.com";          resourceType: testResourceType,

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions');      const hashedUnassignPassword = await bcrypt.hash('password123', 10);          resourceId: 'org_unassign',

    });

      const unassignUser = await prisma.user.upsert({          description: 'Role for unassignment tests',

    it('should return 401 Unauthorized when no token provided', async () => {

      const res = await request(app)        where: { email: unassignUserEmail },        },

        .get(`/api/resources/Organization/org_perm_1/users/${permissionTestUserId}/permissions`);

        update: {},      });

      expect(res.statusCode).toEqual(401);

      expect(res.body).toHaveProperty('message', 'No token provided');        create: {      unassignableRoleId = unassignRole.id;

    });

  });          email: unassignUserEmail,



  describe('Middleware: authorizeResource', () => {          isActive: true,      const unassignUserEmail = "unassign.user@example.com";

    it('should allow access if user has required permission on resource', async () => {

      // First create a user with permissions for testing          credential: { create: { passwordHash: hashedUnassignPassword } },      const hashedUnassignPassword = await bcrypt.hash('password123', 10);

      const testUser = await prisma.user.create({

        data: {        },      const unassignUser = await prisma.user.upsert({

          email: 'resource.test@example.com',

          isActive: true,      });        where: { email: unassignUserEmail },

          credential: {

            create: { passwordHash: await bcrypt.hash('password', 10) }      userToUnassignId = unassignUser.id;        update: {},

          }

        }      userToUnassignToken = generateAccessToken({ userId: userToUnassignId, roles: [] });        create: {

      });

          email: unassignUserEmail,

      const testRole = await prisma.resourceRole.create({

        data: {      // Assign the role to the user          isActive: true,

          name: 'tester',

          resourceType: testResourceType,      await prisma.userResourceRole.upsert({          credential: { create: { passwordHash: hashedUnassignPassword } },

          resourceId: testResourceId,

          description: 'Test role'        where: { userId_resourceType_resourceId: { userId: userToUnassignId, resourceType: testResourceType, resourceId: 'org_unassign' } },        },

        }

      });        update: {},      });



      await prisma.rolePermissionMap.create({        create: {      userToUnassignId = unassignUser.id;

        data: {

          resourceRoleId: testRole.id,          userId: userToUnassignId,      userToUnassignToken = generateAccessToken({ userId: userToUnassignId, roles: [] });

          permissionVerb: 'read'

        }          resourceRoleId: unassignableRoleId,

      });

          resourceType: testResourceType,      // Assign the role to the user

      await prisma.userResourceRole.create({

        data: {          resourceId: 'org_unassign',      await prisma.userResourceRole.upsert({

          userId: testUser.id,

          resourceRoleId: testRole.id,        },        where: { userId_resourceType_resourceId: { userId: userToUnassignId, resourceType: testResourceType, resourceId: 'org_unassign' } },

          resourceType: testResourceType,

          resourceId: testResourceId      });        update: {},

        }

      });    });        create: {



      const testToken = generateAccessToken({ userId: testUser.id, roles: [] });          userId: userToUnassignId,



      const res = await request(app)    it('should remove a role assignment for a user in a resource', async () => {          resourceRoleId: unassignableRoleId,

        .get(`/api/resources/${testResourceType}/${testResourceId}/test-read`)

        .set('Authorization', `Bearer ${testToken}`);      const res = await request(app)          resourceType: testResourceType,



      expect(res.statusCode).toEqual(200);        .delete(`/api/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`)          resourceId: 'org_unassign',

      expect(res.body).toHaveProperty('message', 'Access granted');

      expect(res.body).toHaveProperty('action', 'read');        .set('Authorization', `Bearer ${superAdminToken}`);        },

    });

      expect(res.statusCode).toEqual(200);      });

    it('should deny access if user does not have required permission on resource', async () => {

      // Create a user without write permissions      expect(res.body).toHaveProperty('success', true);    });

      const testUser = await prisma.user.create({

        data: {

          email: 'no.write.user@example.com',

          isActive: true,      // Verify assignment is gone    it('should remove a role assignment for a user in a resource', async () => {

          credential: {

            create: { passwordHash: await bcrypt.hash('password', 10) }      const assignment = await prisma.userResourceRole.findUnique({      const res = await request(app)

          }

        }        where: {        .delete(`/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`)

      });

          userId_resourceRoleId: {        .set('Authorization', `Bearer ${superAdminToken}`);

      const testToken = generateAccessToken({ userId: testUser.id, roles: [] });

            userId: userToUnassignId,      expect(res.statusCode).toEqual(200);

      const res = await request(app)

        .post(`/api/resources/${testResourceType}/${testResourceId}/test-write`)            resourceRoleId: unassignableRoleId,      expect(res.body).toHaveProperty('success', true);

        .set('Authorization', `Bearer ${testToken}`);

          },

      expect(res.statusCode).toEqual(403);

      expect(res.body).toHaveProperty('message', 'Insufficient permissions for this resource');        },      // Verify assignment is gone

    });

      });      const assignment = await prisma.userResourceRole.findUnique({

    it('should deny access if unauthenticated', async () => {

      const res = await request(app)      expect(assignment).toBeNull();        where: {

        .get(`/api/resources/${testResourceType}/${testResourceId}/test-read`);

    });          userId_resourceRoleId: {

      expect(res.statusCode).toEqual(401);

      expect(res.body).toHaveProperty('message', 'No token provided');            userId: userToUnassignId,

    });

    it('should return 404 Not Found for a nonexistent assignment', async () => {            resourceRoleId: unassignableRoleId,

    it('should deny access for non-existent resource', async () => {

      const testUser = await prisma.user.create({      const res = await request(app)          },

        data: {

          email: 'nonexistent.test@example.com',        .delete(`/api/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`) // Already unassigned        },

          isActive: true,

          credential: {        .set('Authorization', `Bearer ${superAdminToken}`);      });

            create: { passwordHash: await bcrypt.hash('password', 10) }

          }      expect(res.statusCode).toEqual(404);      expect(assignment).toBeNull();

        }

      });      expect(res.body).toHaveProperty('message', 'User resource role assignment not found.');    });



      const testToken = generateAccessToken({ userId: testUser.id, roles: [] });    });



      const res = await request(app)  });    it('should return 404 Not Found for a nonexistent assignment', async () => {

        .get(`/api/resources/Organization/nonexistent_resource/test-read`)

        .set('Authorization', `Bearer ${testToken}`);      const res = await request(app)



      expect(res.statusCode).toEqual(403);  // --- Effective Permissions Tests ---        .delete(`/resources/${testResourceType}/org_unassign/roles/${unassignableRoleId}/assign/${userToUnassignId}`) // Already unassigned

      expect(res.body).toHaveProperty('message', 'Insufficient permissions for this resource');

    });  describe('GET /resources/:resourceType/:resourceId/users/:userId/permissions', () => {        .set('Authorization', `Bearer ${superAdminToken}`);

  });

});    beforeAll(async () => {      expect(res.statusCode).toEqual(404);

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