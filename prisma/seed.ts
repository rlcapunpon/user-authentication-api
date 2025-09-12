import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // Create roles
  const superAdminRole = await prisma.role.create({
    data: { name: 'SUPERADMIN', description: 'Full access to all resources' },
  });
  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN', description: 'Admin access to most resources' },
  });
  const approverRole = await prisma.role.create({
    data: { name: 'APPROVER', description: 'Approver access for specific tasks' },
  });
  const staffRole = await prisma.role.create({
    data: { name: 'STAFF', description: 'Staff access' },
  });
  const clientRole = await prisma.role.create({
    data: { name: 'CLIENT', description: 'Client-level access with limited permissions' },
  });

  // Create permissions
  const createUser = await prisma.permission.create({ data: { name: 'create_user', description: 'Create users' } });
  const readUsers = await prisma.permission.create({ data: { name: 'read_users', description: 'Read all users' } });
  const updateUsers = await prisma.permission.create({ data: { name: 'update_users', description: 'Update any user' } });
  const deleteUser = await prisma.permission.create({ data: { name: 'delete_user', description: 'Delete any user' } });
  const readUserSelf = await prisma.permission.create({ data: { name: 'read_user_self', description: 'Read own user profile' } });
  const updateUserSelf = await prisma.permission.create({ data: { name: 'update_user_self', description: 'Update own user profile' } });

  // Assign all permissions to SUPER_ADMIN role
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Create Super Admin User
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadminpassword';
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  const superAdminUser = await prisma.user.create({
    data: {
      email: superAdminEmail,
      isActive: true,
      roles: {
        create: [{
          role: {
            connect: { id: superAdminRole.id },
          },
        }],
      },
    },
  });

  await prisma.credential.create({
    data: {
      userId: superAdminUser.id,
      passwordHash: hashedPassword,
    },
  });

  console.log(`Created super admin user: ${superAdminUser.email}`);
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
