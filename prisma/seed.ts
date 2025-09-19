import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding...');

  // Create Resources
  const orgResource = await (prisma as any).resource.upsert({
    where: { name: 'Organization' },
    update: {},
    create: { name: 'Organization', description: 'Company organization' },
  });

  const projectResource = await (prisma as any).resource.upsert({
    where: { name: 'Project' },
    update: {},
    create: { name: 'Project', description: 'Development project' },
  });

  // Create global roles (no resource association) - check if they exist first
  let superAdminRole = await (prisma as any).role.findFirst({
    where: {
      name: 'SUPERADMIN',
      resourceId: null,
    },
  });

  if (!superAdminRole) {
    superAdminRole = await (prisma as any).role.create({
      data: {
        name: 'SUPERADMIN',
        description: 'Global super admin role',
        resourceId: null,
        permissions: [
          'create_user',
          'read_users',
          'update_users',
          'delete_user',
          'read_roles',
          'create_role',
          'read_resources',
          'create_resource',
          'read_permissions',
          'manage_resource_roles'
        ],
      },
    });
  }

  let supportRole = await (prisma as any).role.findFirst({
    where: {
      name: 'SUPPORT',
      resourceId: null,
    },
  });

  if (!supportRole) {
    supportRole = await (prisma as any).role.create({
      data: {
        name: 'SUPPORT',
        description: 'Global support role',
        resourceId: null,
        permissions: ['read_users', 'read_permissions'],
      },
    });
  }

  // Create resource-specific roles
  const orgAdminRole = await (prisma as any).role.upsert({
    where: {
      name_resourceId: {
        name: 'ADMIN',
        resourceId: orgResource.id,
      },
    },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Organization admin role',
      resourceId: orgResource.id,
      permissions: ['read', 'write', 'update', 'delete', 'manage_users'],
    },
  });

  const orgMemberRole = await (prisma as any).role.upsert({
    where: {
      name_resourceId: {
        name: 'MEMBER',
        resourceId: orgResource.id,
      },
    },
    update: {},
    create: {
      name: 'MEMBER',
      description: 'Organization member role',
      resourceId: orgResource.id,
      permissions: ['read'],
    },
  });

  const projectManagerRole = await (prisma as any).role.upsert({
    where: {
      name_resourceId: {
        name: 'MANAGER',
        resourceId: projectResource.id,
      },
    },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Project manager role',
      resourceId: projectResource.id,
      permissions: ['read', 'write', 'update', 'manage_tasks', 'assign_users'],
    },
  });

  const projectContributorRole = await (prisma as any).role.upsert({
    where: {
      name_resourceId: {
        name: 'CONTRIBUTOR',
        resourceId: projectResource.id,
      },
    },
    update: {},
    create: {
      name: 'CONTRIBUTOR',
      description: 'Project contributor role',
      resourceId: projectResource.id,
      permissions: ['read', 'write'],
    },
  });

  // Create users with super admin flag
  const superAdminUser = await (prisma as any).user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      isSuperAdmin: true,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  const orgAdminUser = await (prisma as any).user.upsert({
    where: { email: 'orgadmin@example.com' },
    update: {},
    create: {
      email: 'orgadmin@example.com',
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  // Assign roles to users (org admin gets org admin role)
  await (prisma as any).userResourceRole.upsert({
    where: {
      userId_roleId_resourceId: {
        userId: orgAdminUser.id,
        roleId: orgAdminRole.id,
        resourceId: orgResource.id,
      },
    },
    update: {},
    create: {
      userId: orgAdminUser.id,
      roleId: orgAdminRole.id,
      resourceId: orgResource.id,
    },
  });

  const projectManagerUser = await (prisma as any).user.upsert({
    where: { email: 'projectmanager@example.com' },
    update: {},
    create: {
      email: 'projectmanager@example.com',
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  // Assign project manager role
  await (prisma as any).userResourceRole.upsert({
    where: {
      userId_roleId_resourceId: {
        userId: projectManagerUser.id,
        roleId: projectManagerRole.id,
        resourceId: projectResource.id,
      },
    },
    update: {},
    create: {
      userId: projectManagerUser.id,
      roleId: projectManagerRole.id,
      resourceId: projectResource.id,
    },
  });

  // Also give project manager org member role
  await (prisma as any).userResourceRole.upsert({
    where: {
      userId_roleId_resourceId: {
        userId: projectManagerUser.id,
        roleId: orgMemberRole.id,
        resourceId: orgResource.id,
      },
    },
    update: {},
    create: {
      userId: projectManagerUser.id,
      roleId: orgMemberRole.id,
      resourceId: orgResource.id,
    },
  });

  console.log('✅ Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
