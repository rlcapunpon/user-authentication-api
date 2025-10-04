import { prisma } from '../db';
import { hashPassword, comparePassword } from '../utils/crypto';
import { sendPasswordUpdateNotification } from './email.service';

export const createUser = async (
  email: string,
  password: string,
  isSuperAdmin: boolean = false,
  firstName?: string,
  lastName?: string,
  nickName?: string,
  contactNumber?: string,
  reportTo?: string
) => {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      isSuperAdmin,
      credential: {
        create: {
          passwordHash: hashedPassword,
        },
      },
      details: {
        create: {
          firstName,
          lastName,
          nickName,
          contactNumber,
          reportToId: reportTo,
        },
      },
      verification: {
        create: {
          isEmailVerified: false,
          isContactVerified: false,
          isReporterAssigned: false,
          verificationStatus: 'unverified',
          userStatus: 'pending',
        },
      },
    },
    include: {
      resourceRoles: true,
      details: true,
      verification: true,
    },
  });
};

export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
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
          role: true,
          resource: true,
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
  // Check if user already has a role for this resource
  let userResourceRole;
  if (resourceId) {
    const existingRole = await (prisma as any).userResourceRole.findFirst({
      where: {
        userId,
        resourceId,
      },
    });

    if (existingRole) {
      // Update existing role assignment
      userResourceRole = await (prisma as any).userResourceRole.update({
        where: {
          userId_roleId_resourceId: {
            userId,
            roleId: existingRole.roleId,
            resourceId,
          },
        },
        data: {
          roleId, // Update to new role
        },
        include: {
          user: true,
          role: true,
          resource: true,
        },
      });
    } else {
      // Create new role assignment
      userResourceRole = await (prisma as any).userResourceRole.create({
        data: {
          userId,
          roleId,
          resourceId,
        },
        include: {
          user: true,
          role: true,
          resource: true,
        },
      });
    }
  } else {
    // For global roles (no resourceId), check if user already has a global role
    const existingGlobalRole = await (prisma as any).userResourceRole.findFirst({
      where: {
        userId,
        resourceId: null,
      },
    });

    if (existingGlobalRole) {
      // Update existing global role assignment
      userResourceRole = await (prisma as any).userResourceRole.update({
        where: {
          userId_roleId_resourceId: {
            userId,
            roleId: existingGlobalRole.roleId,
            resourceId: null,
          },
        },
        data: {
          roleId, // Update to new role
        },
        include: {
          user: true,
          role: true,
          resource: true,
        },
      });
    } else {
      // Create new global role assignment
      userResourceRole = await (prisma as any).userResourceRole.create({
        data: {
          userId,
          roleId,
          resourceId: null,
        },
        include: {
          user: true,
          role: true,
          resource: true,
        },
      });
    }
  }

  // Step 9: When a user is assigned to a resource with a role (not WINDBOOKS_APP),
  // automatically assign the same role to WINDBOOKS_APP if user has no WINDBOOKS_APP role
  if (resourceId) {
    // Find the WINDBOOKS_APP resource
    const windbooksAppResource = await (prisma as any).resource.findFirst({
      where: { name: 'WINDBOOKS_APP' },
    });

    if (windbooksAppResource && resourceId !== windbooksAppResource.id) {
      // Check if user already has any role for WINDBOOKS_APP
      const existingWindbooksAppRole = await (prisma as any).userResourceRole.findFirst({
        where: {
          userId,
          resourceId: windbooksAppResource.id,
        },
      });

      // If no WINDBOOKS_APP role exists, assign the same role
      if (!existingWindbooksAppRole) {
        await (prisma as any).userResourceRole.create({
          data: {
            userId,
            roleId,
            resourceId: windbooksAppResource.id,
          },
        });
      }
    }
  }

  return userResourceRole;
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

export const activateUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
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

export const listUsersPaginated = async (page: number = 1, limit: number = 10, email?: string, isActive?: boolean) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (email) {
    where.email = {
      contains: email,
      mode: 'insensitive',
    };
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    (prisma as any).user.findMany({
      where,
      include: {
        resourceRoles: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    (prisma as any).user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const updateUserPassword = async (
  userId: string,
  newPassword: string,
  updatedBy: string,
  requireCurrentPassword: boolean = true,
  currentPassword?: string
) => {
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    include: { credential: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (requireCurrentPassword) {
    if (!currentPassword || !user.credential) {
      throw new Error('Current password is required');
    }
    const isPasswordValid = await comparePassword(currentPassword, user.credential.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }
  }

  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await (prisma as any).credential.update({
    where: { userId },
    data: { passwordHash: hashedPassword },
  });

  // Create password update record
  await (prisma as any).userPasswordUpdate.create({
    data: {
      userId,
      updatedBy,
    },
  });

  // Send email notification
  try {
    // Get the updater's email
    const updater = await (prisma as any).user.findUnique({
      where: { id: updatedBy },
      select: { email: true },
    });

    if (updater) {
      await sendPasswordUpdateNotification({
        to: user.email,
        updatedBy: updater.email,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (emailError) {
    // Log email error but don't fail the password update
    console.error('Failed to send password update notification email:', emailError);
  }

  return { message: 'Password updated successfully' };
};

export const getUserPasswordUpdateHistory = async (userId: string) => {
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const updates = await (prisma as any).userPasswordUpdate.findMany({
    where: { userId },
    orderBy: { lastUpdate: 'desc' },
  });

  if (updates.length === 0) {
    return {
      last_update: null,
      updated_by: null,
      how_many: 0,
    };
  }

  const lastUpdate = updates[0];
  return {
    last_update: lastUpdate.lastUpdate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    updated_by: lastUpdate.updatedBy,
    how_many: updates.length,
  };
};

export const getLastLogin = async (userId: string) => {
  const lastLoginRecord = await (prisma as any).userLoginHistory.findFirst({
    where: { userId },
    orderBy: { lastLogin: 'desc' },
  });

  if (!lastLoginRecord) {
    return { last_login: null };
  }

  // Format the date as mm/dd/yyyy hh:mm:ss (24-hour format)
  const date = lastLoginRecord.lastLogin;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const formattedDate = `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;

  return { last_login: formattedDate };
};
