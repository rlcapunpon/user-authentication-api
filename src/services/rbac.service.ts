import { prisma } from '../db';

export const getAllRoles = () => {
  return prisma.role.findMany({
    include: {
      userRoles: {
        include: {
          user: true,
          resource: true,
        },
      },
    },
  });
};

export const getRolesByResource = (resourceId?: string) => {
  if (!resourceId) {
    return prisma.role.findMany({
      include: {
        userRoles: {
          include: {
            user: true,
            resource: true,
          },
        },
      },
    });
  }

  return prisma.role.findMany({
    where: {
      userRoles: {
        some: {
          resourceId: resourceId,
        },
      },
    },
    include: {
      userRoles: {
        include: {
          user: true,
          resource: true,
        },
        where: {
          resourceId: resourceId,
        },
      },
    },
  });
};

export const getAllResources = () => {
  return prisma.resource.findMany({
    include: {
      userRoles: {
        include: {
          role: true,
          user: true,
        },
      },
    },
  });
};

export const createResource = (name: string, description?: string) => {
  return prisma.resource.create({
    data: {
      name,
      description,
    },
  });
};

export const createRole = (name: string, permissions: string[], description?: string) => {
  return prisma.role.create({
    data: {
      name,
      permissions,
      description,
    },
  });
};

/**
 * Get available roles with basic information for UI consumption
 * Returns simplified role data without sensitive permission details
 */
export const getAvailableRoles = () => {
  return prisma.role.findMany({
    include: {
      userRoles: {
        include: {
          user: true,
          resource: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
};

/**
 * Find a user by ID with their roles and permissions
 */
export const findUserById = (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
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

/**
 * Get user permissions from their roles for a specific resource
 */
export const getUserPermissionsFromRoles = async (userId: string, resourceId: string): Promise<string[]> => {
  const userRoles = await prisma.userResourceRole.findMany({
    where: {
      userId,
      OR: [
        { resourceId }, // Resource-specific roles
        { resourceId: null }, // Global roles
      ],
    },
    include: {
      role: true,
    },
  });

  // Collect all permissions from user's roles
  const permissions = new Set<string>();
  userRoles.forEach(userRole => {
    if (userRole.role.permissions) {
      userRole.role.permissions.forEach(permission => permissions.add(permission));
    }
  });

  return Array.from(permissions);
};