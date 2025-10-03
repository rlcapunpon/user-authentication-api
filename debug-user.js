const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'capunponrlc@gmail.com' },
      include: {
        resourceRoles: {
          include: {
            role: true,
            resource: true
          }
        }
      }
    });

    console.log('User found:', !!user);
    if (user) {
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Resource Roles:');
      user.resourceRoles.forEach(role => {
        console.log('  - Resource:', role.resource.name, 'Role:', role.role.name);
      });

      const isSuperAdmin = user.resourceRoles.some(
        rr => rr.resource.name === 'WINDBOOKS_APP' && rr.role.name === 'SUPERADMIN'
      );
      console.log('Calculated isSuperAdmin:', isSuperAdmin);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();