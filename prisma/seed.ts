import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ROLE_PERMISSIONS } from '../src/config/permissions';

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
        permissions: ROLE_PERMISSIONS.SUPERADMIN,
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
        permissions: ROLE_PERMISSIONS.APPROVER,
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
        permissions: ROLE_PERMISSIONS.STAFF,
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
        permissions: ROLE_PERMISSIONS.CLIENT,
      },
    });
  }

  // Create FRONT_END_APP resource for global role assignments
  let frontEndAppResource = await (prisma as any).resource.findFirst({
    where: {
      name: 'WINDBOOKS_APP',
    },
  });

  if (!frontEndAppResource) {
    frontEndAppResource = await (prisma as any).resource.create({
      data: {
        name: 'WINDBOOKS_APP',
        description: 'Main frontend application resource for global role assignments',
      },
    });

    // Create ResourceStatus ACTIVE for WINDBOOKS_APP
    await (prisma as any).resourceStatus.create({
      data: {
        resourceId: frontEndAppResource.id,
        status: 'ACTIVE',
      },
    });
  }

  // Create users for each role
  const superAdminUser = await (prisma as any).user.upsert({
    where: { email: 'superadmin@dvconsultingph.com' },
    update: {},
    create: {
      email: 'superadmin@dvconsultingph.com',
      isActive: true,
      isSuperAdmin: true,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  // Create UserVerification record for superAdminUser
  await (prisma as any).userVerification.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: {
      userId: superAdminUser.id,
      isEmailVerified: true,
      isContactVerified: false,
      isReporterAssigned: false,
      verificationStatus: 'verified',
      userStatus: 'active',
    },
  });

  const approverUser = await (prisma as any).user.upsert({
    where: { email: 'approver@dvconsultingph.com' },
    update: {},
    create: {
      email: 'approver@dvconsultingph.com',
      isActive: true,
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  // Create UserVerification record for approverUser
  await (prisma as any).userVerification.upsert({
    where: { userId: approverUser.id },
    update: {},
    create: {
      userId: approverUser.id,
      isEmailVerified: true,
      isContactVerified: false,
      isReporterAssigned: true,
      verificationStatus: 'verified',
      userStatus: 'active',
    },
  });

  const staffUser = await (prisma as any).user.upsert({
    where: { email: 'staff@dvconsultingph.com' },
    update: {},
    create: {
      email: 'staff@dvconsultingph.com',
      isActive: true,
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  // Create UserVerification record for staffUser
  await (prisma as any).userVerification.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      userId: staffUser.id,
      isEmailVerified: true,
      isContactVerified: false,
      isReporterAssigned: true,
      verificationStatus: 'verified',
      userStatus: 'active',
    },
  });

  const clientUser = await (prisma as any).user.upsert({
    where: { email: 'client@dvconsultingph.com' },
    update: {},
    create: {
      email: 'client@dvconsultingph.com',
      isActive: true,
      isSuperAdmin: false,
      credential: {
        create: {
          passwordHash: await hashPassword('password'),
        },
      },
    },
  });

  // Create UserVerification record for clientUser
  await (prisma as any).userVerification.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      isEmailVerified: true,
      isContactVerified: false,
      isReporterAssigned: true,
      verificationStatus: 'verified',
      userStatus: 'active',
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

  // Assign users to global roles (using FRONT_END_APP as the main resource)
  console.log('Assigning users to global roles...');

  // Assign SUPERADMIN role to superadmin user (using WINDBOOKS_APP resource)
  const existingSuperAdminRole = await (prisma as any).userResourceRole.findFirst({
    where: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      resourceId: frontEndAppResource.id,
    },
  });

  if (!existingSuperAdminRole) {
    await (prisma as any).userResourceRole.create({
      data: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
        resourceId: frontEndAppResource.id,
      },
    });
  }

  // Assign approver role to approver user (using FRONT_END_APP resource)
  const existingApproverRole = await (prisma as any).userResourceRole.findFirst({
    where: {
      userId: approverUser.id,
      roleId: approverRole.id,
      resourceId: frontEndAppResource.id,
    },
  });

  if (!existingApproverRole) {
    await (prisma as any).userResourceRole.create({
      data: {
        userId: approverUser.id,
        roleId: approverRole.id,
        resourceId: frontEndAppResource.id,
      },
    });
  }

  // Assign staff role to staff user (using FRONT_END_APP resource)
  const existingStaffRole = await (prisma as any).userResourceRole.findFirst({
    where: {
      userId: staffUser.id,
      roleId: staffRole.id,
      resourceId: frontEndAppResource.id,
    },
  });

  if (!existingStaffRole) {
    await (prisma as any).userResourceRole.create({
      data: {
        userId: staffUser.id,
        roleId: staffRole.id,
        resourceId: frontEndAppResource.id,
      },
    });
  }

  // Assign client role to client user (using FRONT_END_APP resource)
  const existingClientRole = await (prisma as any).userResourceRole.findFirst({
    where: {
      userId: clientUser.id,
      roleId: clientRole.id,
      resourceId: frontEndAppResource.id,
    },
  });

  if (!existingClientRole) {
    await (prisma as any).userResourceRole.create({
      data: {
        userId: clientUser.id,
        roleId: clientRole.id,
        resourceId: frontEndAppResource.id,
      },
    });
  }

  // Seed API keys for internal services
  console.log('Creating API keys for internal services...');

  const apiKeys = [
    {
      owner: 'org-mgmt-api',
      keyHash: process.env.ORG_API_HMAC
    },
  ];

  for (const apiKeyData of apiKeys) {
    const existingApiKey = await (prisma as any).apiKey.findFirst({
      where: {
        owner: apiKeyData.owner,
      },
    });

    if (!existingApiKey) {
      await (prisma as any).apiKey.create({
        data: {
          owner: apiKeyData.owner,
          keyHash: apiKeyData.keyHash,
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
