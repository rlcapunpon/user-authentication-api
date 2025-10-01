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

/**
 * Get resources that a user has access to based on their roles
 */
export const getUserAccessibleResources = async (userId: string): Promise<any[]> => {
  // If user is super admin, return all resources
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true }
  });

  if (user?.isSuperAdmin) {
    return getAllResources();
  }

  // Get resources where user has UserResourceRole entries (either specific or global)
  const userResources = await prisma.resource.findMany({
    where: {
      userRoles: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      userRoles: {
        include: {
          role: true,
          user: true,
        },
        where: {
          userId: userId,
        },
      },
    },
  });

  return userResources;
};

/**
 * Get the role of a user for a specific resource
 */
export const getUserRoleForResource = async (userId: string, resourceId: string): Promise<any> => {
  // If user is super admin, they have full access (could return a special role or null)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true }
  });

  if (user?.isSuperAdmin) {
    // Super admin has implicit full access, but we'll return null to indicate no specific role
    return null;
  }

  // Find the user's role for this specific resource
  const userResourceRole = await prisma.userResourceRole.findFirst({
    where: {
      userId,
      resourceId,
    },
    include: {
      role: true,
    },
  });

  if (!userResourceRole) {
    // Check for global roles (resourceId: null)
    const globalUserResourceRole = await prisma.userResourceRole.findFirst({
      where: {
        userId,
        resourceId: null,
      },
      include: {
        role: true,
      },
    });

    return globalUserResourceRole || null;
  }

  return userResourceRole;
};