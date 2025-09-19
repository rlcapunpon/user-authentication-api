import { prisma } from '../db';
import { hashPassword, comparePassword } from '../utils/crypto';

export const createUser = async (email: string, password: string, isSuperAdmin: boolean = false) => {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      isSuperAdmin,
      credential: {
        create: {
          passwordHash: hashedPassword,
        },
      },
    },
    include: {
      resourceRoles: true,
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
    include: {
      credential: true,
      resourceRoles: {
        include: {
          role: true,
          resource: true,
        },
      },
    },
  });
};

export const listUsers = () => {
  return prisma.user.findMany({
    include: {
      resourceRoles: true,
    },
  });
};

export const getUserById = (id: string) => {
  return (prisma as any).user.findUnique({
    where: { id },
    include: {
      resourceRoles: {
        include: {
          role: {
            include: {
              resource: true,
            },
          },
        },
      },
    },
  });
};

export const updateUserSuperAdmin = async (userId: string, isSuperAdmin: boolean) => {
  return (prisma as any).user.update({
    where: { id: userId },
    data: { isSuperAdmin },
    include: {
      resourceRoles: {
        include: {
          role: {
            include: {
              resource: true,
            },
          },
        },
      },
    },
  });
};

export const assignUserResourceRole = async (userId: string, roleId: string, resourceId?: string) => {
  return (prisma as any).userResourceRole.create({
    data: {
      userId,
      roleId,
      resourceId,
    },
    include: {
      user: true,
      role: {
        include: {
          resource: true,
        },
      },
    },
  });
};

export const revokeUserResourceRole = async (userId: string, roleId: string, resourceId?: string) => {
  return (prisma as any).userResourceRole.delete({
    where: {
      userId_roleId_resourceId: {
        userId,
        roleId,
        resourceId,
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
  await (prisma as any).refreshToken.deleteMany({
    where: { userId },
  });
  // Delete associated user resource roles
  await (prisma as any).userResourceRole.deleteMany({
    where: { userId },
  });
  // Then delete the user
  return (prisma as any).user.delete({
    where: { id: userId },
  });
};

export const updateUserProfile = async (userId: string, email?: string, oldPassword?: string, newPassword?: string) => {
  const user = await (prisma as any).user.findUnique({
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
    return (prisma as any).user.update({
      where: { id: userId },
      data: {
        email: email || user.email,
        credential: {
          update: {
            passwordHash: hashedPassword,
          },
        },
      },
      include: {
        resourceRoles: {
          include: {
            role: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });
  } else if (email) {
    return (prisma as any).user.update({
      where: { id: userId },
      data: {
        email: email,
      },
      include: {
        resourceRoles: {
          include: {
            role: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });
  }
  return user; // No changes if no email or password provided
};
