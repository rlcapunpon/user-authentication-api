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
    },
  });

  if (!superAdminRole) {
    superAdminRole = await (prisma as any).role.create({
      data: {
        name: 'SUPERADMIN',
        description: 'Global super admin role with full system access',
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
    },
  });

  if (!approverRole) {
    approverRole = await (prisma as any).role.create({
      data: {
        name: 'APPROVER',
        description: 'Role for approving requests and managing workflows',
        permissions: ['approve_requests', 'read_users', 'read_permissions', 'manage_workflows'],
      },
    });
  }

  let staffRole = await (prisma as any).role.findFirst({
    where: {
      name: 'STAFF',
    },
  });

  if (!staffRole) {
    staffRole = await (prisma as any).role.create({
      data: {
        name: 'STAFF',
        description: 'General staff role for operational tasks',
        permissions: ['read_users', 'read_permissions', 'create_requests', 'update_profile'],
      },
    });
  }

  let clientRole = await (prisma as any).role.findFirst({
    where: {
      name: 'CLIENT',
    },
  });

  if (!clientRole) {
    clientRole = await (prisma as any).role.create({
      data: {
        name: 'CLIENT',
        description: 'Client role for accessing services and submitting requests',
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

  // Create UserDetails for all users
  console.log('Creating user details...');

  await (prisma as any).userDetails.upsert({
    where: { id: superAdminUser.id },
    update: {},
    create: {
      id: superAdminUser.id,
      firstName: 'Super',
      lastName: 'Admin',
      nickName: 'Boss',
      contactNumber: '+1-555-0100',
      reportToId: null, // SuperAdmin doesn't report to anyone
    },
  });

  await (prisma as any).userDetails.upsert({
    where: { id: approverUser.id },
    update: {},
    create: {
      id: approverUser.id,
      firstName: 'John',
      lastName: 'Approver',
      nickName: 'Approver',
      contactNumber: '+1-555-0101',
      reportToId: superAdminUser.id, // Reports to SuperAdmin
    },
  });

  await (prisma as any).userDetails.upsert({
    where: { id: staffUser.id },
    update: {},
    create: {
      id: staffUser.id,
      firstName: 'Jane',
      lastName: 'Staff',
      nickName: 'Staff',
      contactNumber: '+1-555-0102',
      reportToId: approverUser.id, // Reports to Approver
    },
  });

  await (prisma as any).userDetails.upsert({
    where: { id: clientUser.id },
    update: {},
    create: {
      id: clientUser.id,
      firstName: 'Bob',
      lastName: 'Client',
      nickName: 'Client',
      contactNumber: '+1-555-0103',
      reportToId: staffUser.id, // Reports to Staff
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

  // Create Resources (departments/projects/organizations)
  console.log('Creating resources...');

  const resources = [
    {
      name: 'HR_DEPARTMENT',
      description: 'Human Resources Department',
    },
    {
      name: 'IT_DEPARTMENT',
      description: 'Information Technology Department',
    },
    {
      name: 'FINANCE_DEPARTMENT',
      description: 'Finance and Accounting Department',
    },
    {
      name: 'MARKETING_DEPARTMENT',
      description: 'Marketing and Sales Department',
    },
    {
      name: 'PROJECT_ALPHA',
      description: 'Alpha Project - Main product development',
    },
    {
      name: 'PROJECT_BETA',
      description: 'Beta Project - Research and development',
    },
  ];

  const createdResources = [];
  for (const resourceData of resources) {
    const resource = await (prisma as any).resource.upsert({
      where: { name: resourceData.name },
      update: {},
      create: resourceData,
    });
    createdResources.push(resource);
  }

  // Create UserResourceRole mappings (users to roles for specific resources)
  console.log('Creating user-resource-role mappings...');

  // SuperAdmin gets all roles for all resources
  for (const resource of createdResources) {
    for (const role of [superAdminRole, approverRole, staffRole, clientRole]) {
      const existingMapping = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId: superAdminUser.id,
          roleId: role.id,
          resourceId: resource.id,
        },
      });

      if (!existingMapping) {
        await (prisma as any).userResourceRole.create({
          data: {
            userId: superAdminUser.id,
            roleId: role.id,
            resourceId: resource.id,
          },
        });
      }
    }
  }

  // Approver gets APPROVER role for HR, Finance, and Marketing departments
  const approverResources = createdResources.filter(r =>
    ['HR_DEPARTMENT', 'FINANCE_DEPARTMENT', 'MARKETING_DEPARTMENT'].includes(r.name)
  );

  for (const resource of approverResources) {
    const existingMapping = await (prisma as any).userResourceRole.findFirst({
      where: {
        userId: approverUser.id,
        roleId: approverRole.id,
        resourceId: resource.id,
      },
    });

    if (!existingMapping) {
      await (prisma as any).userResourceRole.create({
        data: {
          userId: approverUser.id,
          roleId: approverRole.id,
          resourceId: resource.id,
        },
      });
    }
  }

  // Staff gets STAFF role for IT Department and both projects
  const staffResources = createdResources.filter(r =>
    ['IT_DEPARTMENT', 'PROJECT_ALPHA', 'PROJECT_BETA'].includes(r.name)
  );

  for (const resource of staffResources) {
    const existingMapping = await (prisma as any).userResourceRole.findFirst({
      where: {
        userId: staffUser.id,
        roleId: staffRole.id,
        resourceId: resource.id,
      },
    });

    if (!existingMapping) {
      await (prisma as any).userResourceRole.create({
        data: {
          userId: staffUser.id,
          roleId: staffRole.id,
          resourceId: resource.id,
        },
      });
    }
  }

  // Client gets CLIENT role for Marketing Department and Project Alpha
  const clientResources = createdResources.filter(r =>
    ['MARKETING_DEPARTMENT', 'PROJECT_ALPHA'].includes(r.name)
  );

  for (const resource of clientResources) {
    const existingMapping = await (prisma as any).userResourceRole.findFirst({
      where: {
        userId: clientUser.id,
        roleId: clientRole.id,
        resourceId: resource.id,
      },
    });

    if (!existingMapping) {
      await (prisma as any).userResourceRole.create({
        data: {
          userId: clientUser.id,
          roleId: clientRole.id,
          resourceId: resource.id,
        },
      });
    }
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
