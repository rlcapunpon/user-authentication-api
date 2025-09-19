import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // Create or upsert roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: { name: 'SUPERADMIN', description: 'Full access to all resources' },
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Admin access to most resources' },
  });
  const approverRole = await prisma.role.upsert({
    where: { name: 'APPROVER' },
    update: {},
    create: { name: 'APPROVER', description: 'Approver access for specific tasks' },
  });
  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: { name: 'STAFF', description: 'Staff access' },
  });
  const clientRole = await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: { name: 'CLIENT', description: 'Client-level access with limited permissions' },
  });

  // Create or upsert permissions
  const createUser = await prisma.permission.upsert({ where: { name: 'create_user' }, update: {}, create: { name: 'create_user', description: 'Create users' } });
  const readUsers = await prisma.permission.upsert({ where: { name: 'read_users' }, update: {}, create: { name: 'read_users', description: 'Read all users' } });
  const updateUsers = await prisma.permission.upsert({ where: { name: 'update_users' }, update: {}, create: { name: 'update_users', description: 'Update any user' } });
  const deleteUser = await prisma.permission.upsert({ where: { name: 'delete_user' }, update: {}, create: { name: 'delete_user', description: 'Delete any user' } });
  const readUserSelf = await prisma.permission.upsert({ where: { name: 'read_user_self' }, update: {}, create: { name: 'read_user_self', description: 'Read own user profile' } });
  const updateUserSelf = await prisma.permission.upsert({ where: { name: 'update_user_self' }, update: {}, create: { name: 'update_user_self', description: 'Update own user profile' } });

  // Assign all permissions to SUPER_ADMIN role (using deleteMany and createMany to ensure idempotency)
  await prisma.rolePermission.deleteMany({ where: { roleId: superAdminRole.id } });
  const allPermissions = await prisma.permission.findMany();
  await prisma.rolePermission.createMany({
    data: allPermissions.map(perm => ({
      roleId: superAdminRole.id,
      permissionId: perm.id,
    })),
    skipDuplicates: true,
  });

  // Create or upsert Super Admin User
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadminpassword';
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      isActive: true,
      credential: {
        create: {
          passwordHash: hashedPassword,
        },
      },
    },
  });

  // Connect superAdminUser to superAdminRole if not already connected
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log(`Created super admin user: ${superAdminUser.email}`);

  // --- New seeding for resource-based RBAC ---
  const testResourceType = "Organization";
  const testResourceId = "org_123"; // A dummy organization ID

  // Create or upsert ResourceRoles
  const editorResourceRole = await prisma.resourceRole.upsert({
    where: { name_resourceType_resourceId: { name: "editor", resourceType: testResourceType, resourceId: testResourceId } },
    update: {},
    create: {
      name: "editor",
      resourceType: testResourceType,
      resourceId: testResourceId,
      description: "Editor role for a specific resource",
    },
  });

  const viewerResourceRole = await prisma.resourceRole.upsert({
    where: { name_resourceType_resourceId: { name: "viewer", resourceType: testResourceType, resourceId: testResourceId } },
    update: {},
    create: {
      name: "viewer",
      resourceType: testResourceType,
      resourceId: testResourceId,
      description: "Viewer role for a specific resource",
    },
  });

  // Map permissions to ResourceRoles (using deleteMany and createMany to ensure idempotency)
  await prisma.rolePermissionMap.deleteMany({ where: { resourceRoleId: editorResourceRole.id } });
  await prisma.rolePermissionMap.createMany({
    data: [
      { resourceRoleId: editorResourceRole.id, permissionVerb: "read" },
      { resourceRoleId: editorResourceRole.id, permissionVerb: "update" },
      { resourceRoleId: editorResourceRole.id, permissionVerb: "delete" },
    ],
    skipDuplicates: true,
  });

  await prisma.rolePermissionMap.deleteMany({ where: { resourceRoleId: viewerResourceRole.id } });
  await prisma.rolePermissionMap.createMany({
    data: [
      { resourceRoleId: viewerResourceRole.id, permissionVerb: "read" },
    ],
    skipDuplicates: true,
  });

  // Create or upsert a sample user for resource roles
  const resourceUserEmail = "resource.user@example.com";
  const resourceUserPassword = "resourcepassword";
  const hashedResourcePassword = await bcrypt.hash(resourceUserPassword, 10);

  const resourceUser = await prisma.user.upsert({
    where: { email: resourceUserEmail },
    update: {},
    create: {
      email: resourceUserEmail,
      isActive: true,
      credential: {
        create: {
          passwordHash: hashedResourcePassword,
        },
      },
    },
  });

  // Assign resource role to the sample user (using upsert to ensure idempotency)
  await prisma.userResourceRole.upsert({
    where: { userId_resourceType_resourceId: { userId: resourceUser.id, resourceType: testResourceType, resourceId: testResourceId } },
    update: { resourceRoleId: editorResourceRole.id }, // Update role if user already exists for this resource
    create: {
      userId: resourceUser.id,
      resourceRoleId: editorResourceRole.id,
      resourceType: testResourceType,
      resourceId: testResourceId,
    },
  });

  console.log(`Created resource user: ${resourceUser.email} with role ${editorResourceRole.name} for ${testResourceType}:${testResourceId}`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
