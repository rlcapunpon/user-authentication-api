import { prisma } from '../db';
import { hashPassword, comparePassword } from '../utils/crypto';

export const createUser = async (email: string, password: string) => {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      credential: {
        create: {
          passwordHash: hashedPassword,
        },
      },
    },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
};

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    include: { credential: true },
  });
};

export const findUserById = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      organizationCode: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      credential: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const listUsers = () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
};

export const getUserById = (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
};

export const createUserWithRoles = async (email: string, password: string, roleNames: string[]) => {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      credential: {
        create: {
          passwordHash: hashedPassword,
        },
      },
      roles: {
        create: roleNames.map(roleName => ({
          role: {
            connect: { name: roleName },
          },
        })),
      },
    },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
};

export const updateUserRoles = async (userId: string, roleNames: string[]) => {
  // Disconnect all existing roles
  await prisma.userRole.deleteMany({
    where: { userId },
  });

  // Connect new roles
  return prisma.user.update({
    where: { id: userId },
    data: {
      roles: {
        create: roleNames.map(roleName => ({
          role: {
            connect: { name: roleName },
          },
        })),
      },
    },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
};

export const deactivateUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
};

export const deleteUser = async (userId: string) => {
  // Delete associated refresh tokens first
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
  // Delete associated user roles
  await prisma.userRole.deleteMany({
    where: { userId },
  });
  // Then delete the user
  return prisma.user.delete({
    where: { id: userId },
  });
};

export const updateUserProfile = async (userId: string, email?: string, oldPassword?: string, newPassword?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { credential: true },
  });
  if (!user) {
    throw new Error('User not found');
  }

  if (newPassword && oldPassword) {
    if (!user.credential) {
      throw new Error('User does not have a credential');
    }
    const isPasswordValid = await comparePassword(oldPassword, user.credential.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid old password');
    }
    const hashedPassword = await hashPassword(newPassword);
    return prisma.user.update({
      where: { id: userId },
      data: {
        email: email || user.email,
        credential: {
          update: {
            passwordHash: hashedPassword,
          },
        },
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: true,
      },
    });
  } else if (email) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: true,
      },
    });
  }
  return user; // No changes if no email or password provided
};
