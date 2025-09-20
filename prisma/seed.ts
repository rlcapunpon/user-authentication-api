import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding...');

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
        description: 'Global super admin role with full system access',
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
          'manage_resource_roles',
          'approve_requests',
          'manage_staff',
          'manage_clients'
        ],
      },
    });
  }

  let approverRole = await (prisma as any).role.findFirst({
    where: {
      name: 'APPROVER',
      resourceId: null,
    },
  });

  if (!approverRole) {
    approverRole = await (prisma as any).role.create({
      data: {
        name: 'APPROVER',
        description: 'Role for approving requests and managing workflows',
        resourceId: null,
        permissions: ['approve_requests', 'read_users', 'read_permissions', 'manage_workflows'],
      },
    });
  }

  let staffRole = await (prisma as any).role.findFirst({
    where: {
      name: 'STAFF',
      resourceId: null,
    },
  });

  if (!staffRole) {
    staffRole = await (prisma as any).role.create({
      data: {
        name: 'STAFF',
        description: 'General staff role for operational tasks',
        resourceId: null,
        permissions: ['read_users', 'read_permissions', 'create_requests', 'update_profile'],
      },
    });
  }

  let clientRole = await (prisma as any).role.findFirst({
    where: {
      name: 'CLIENT',
      resourceId: null,
    },
  });

  if (!clientRole) {
    clientRole = await (prisma as any).role.create({
      data: {
        name: 'CLIENT',
        description: 'Client role for accessing services and submitting requests',
        resourceId: null,
        permissions: ['read_own_data', 'create_requests', 'update_profile'],
      },
    });
  }

  // Create users for each role
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

  const approverUser = await (prisma as any).user.upsert({
    where: { email: 'approver@example.com' },
    update: {},
    create: {
      email: 'approver@example.com',
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  const staffUser = await (prisma as any).user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  const clientUser = await (prisma as any).user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  // Assign users to global roles
  console.log('Assigning users to global roles...');

  // Assign approver role to approver user (global)
  const existingApproverRole = await (prisma as any).userResourceRole.findFirst({
    where: {
      userId: approverUser.id,
      roleId: approverRole.id,
      resourceId: null,
    },
  });

  if (!existingApproverRole) {
    await (prisma as any).userResourceRole.create({
      data: {
        userId: approverUser.id,
        roleId: approverRole.id,
        resourceId: null,
      },
    });
  }

  // Assign staff role to staff user (global)
  const existingStaffRole = await (prisma as any).userResourceRole.findFirst({
    where: {
      userId: staffUser.id,
      roleId: staffRole.id,
      resourceId: null,
    },
  });

  if (!existingStaffRole) {
    await (prisma as any).userResourceRole.create({
      data: {
        userId: staffUser.id,
        roleId: staffRole.id,
        resourceId: null,
      },
    });
  }

  // Assign client role to client user (global)
  const existingClientRole = await (prisma as any).userResourceRole.findFirst({
    where: {
      userId: clientUser.id,
      roleId: clientRole.id,
      resourceId: null,
    },
  });

  if (!existingClientRole) {
    await (prisma as any).userResourceRole.create({
      data: {
        userId: clientUser.id,
        roleId: clientRole.id,
        resourceId: null,
      },
    });
  }

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
