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

export const createResource = async (name: string, description?: string, id?: string) => {
  // Create the resource
  const resource = await prisma.resource.create({
    data: {
      ...(id && { id }),
      name,
      description,
    },
  });

  // Create ResourceStatus record with ACTIVE status
  await (prisma as any).resourceStatus.create({
    data: {
      resourceId: resource.id,
      status: 'ACTIVE',
    },
  });

  return resource;
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
  // Check if user has SUPERADMIN role for WINDBOOKS_APP resource
  const windbooksAppResource = await prisma.resource.findFirst({
    where: { name: 'WINDBOOKS_APP' },
  });

  let isSuperAdminForWindbooks = false;
  if (windbooksAppResource) {
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPERADMIN' },
    });

    if (superAdminRole) {
      const userSuperAdminRole = await prisma.userResourceRole.findFirst({
        where: {
          userId,
          resourceId: windbooksAppResource.id,
          roleId: superAdminRole.id,
        },
      });
      isSuperAdminForWindbooks = !!userSuperAdminRole;
    }
  }

  if (isSuperAdminForWindbooks) {
    return (prisma as any).resource.findMany({
      where: {
        status: {
          status: 'ACTIVE',
        },
      },
    });
  }

  // Get resources where user has UserResourceRole entries (either specific or global) and not deleted
  const userResources = await (prisma as any).resource.findMany({
    where: {
      userRoles: {
        some: {
          userId: userId,
        },
      },
      status: {
        status: 'ACTIVE',
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
  // Check if user has SUPERADMIN role for WINDBOOKS_APP resource
  const windbooksAppResource = await prisma.resource.findFirst({
    where: { name: 'WINDBOOKS_APP' },
  });

  let isSuperAdminForWindbooks = false;
  if (windbooksAppResource) {
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPERADMIN' },
    });

    if (superAdminRole) {
      const userSuperAdminRole = await prisma.userResourceRole.findFirst({
        where: {
          userId,
          resourceId: windbooksAppResource.id,
          roleId: superAdminRole.id,
        },
      });
      isSuperAdminForWindbooks = !!userSuperAdminRole;
    }
  }

  if (isSuperAdminForWindbooks) {
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

/**
 * Get resources that a user has access to based on their roles (paginated)
 */
export const getUserAccessibleResourcesPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  resourceName?: string,
  resourceId?: string,
  q?: string
): Promise<any> => {
  const skip = (page - 1) * limit;

  // Build where clause for filtering
  const where: any = {};

  // Filter by resource name (case-insensitive partial match)
  if (resourceName) {
    where.name = {
      contains: resourceName,
      mode: 'insensitive',
    };
  }

  // Filter by exact resource ID
  if (resourceId) {
    where.id = resourceId;
  }

  // Filter by general search query (searches in both name and ID)
  if (q) {
    where.OR = [
      {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      {
        id: {
          contains: q,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Check if user has SUPERADMIN role for WINDBOOKS_APP resource
  const windbooksAppResource = await prisma.resource.findFirst({
    where: { name: 'WINDBOOKS_APP' },
  });

  let isSuperAdminForWindbooks = false;
  if (windbooksAppResource) {
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPERADMIN' },
    });

    if (superAdminRole) {
      const userSuperAdminRole = await prisma.userResourceRole.findFirst({
        where: {
          userId,
          resourceId: windbooksAppResource.id,
          roleId: superAdminRole.id,
        },
      });
      isSuperAdminForWindbooks = !!userSuperAdminRole;
    }
  }

  if (isSuperAdminForWindbooks) {
    const [resources, total] = await Promise.all([
      (prisma as any).resource.findMany({
        where: {
          ...where,
          status: {
            status: 'ACTIVE',
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      (prisma as any).resource.count({
        where: {
          ...where,
          status: {
            status: 'ACTIVE',
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: resources,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // Get resources where user has UserResourceRole entries (either specific or global) - paginated with filters and exclude deleted
  const [userResources, total] = await Promise.all([
    (prisma as any).resource.findMany({
      where: {
        ...where,
        userRoles: {
          some: {
            userId: userId,
          },
        },
        status: {
          status: 'ACTIVE',
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    (prisma as any).resource.count({
      where: {
        ...where,
        userRoles: {
          some: {
            userId: userId,
          },
        },
        status: {
          status: 'ACTIVE',
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: userResources,
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

/**
 * Get all resources and roles assigned to a specific user
 */
export const getUserResourcesAndRoles = async (userId: string): Promise<{ resources: Array<{ resourceId: string; resourceName: string; roleName: string; roleId: string }> }> => {
  // Get all user resource roles for this user (excluding global roles where resourceId is null)
  const userResourceRoles = await prisma.userResourceRole.findMany({
    where: {
      userId: userId,
      resourceId: {
        not: null, // Exclude global roles
      },
    },
    include: {
      role: true,
      resource: true,
    },
  });

  // Transform the data to match the required response format
  // Filter out any entries where resource might be null (though it shouldn't be due to the query)
  const resources = userResourceRoles
    .filter(userResourceRole => userResourceRole.resource !== null)
    .map(userResourceRole => ({
      resourceId: userResourceRole.resourceId!, // We know this is not null due to the filter
      resourceName: userResourceRole.resource!.name,
      roleName: userResourceRole.role.name,
      roleId: userResourceRole.roleId,
    }));

  return { resources };
};

/**
 * Get resource roles for authenticated user given a list of resourceIds
 */
export const getResourceRoles = async (userId: string, resourceIds: string[]): Promise<{ resourceRoles: Array<{ resourceId: string; roleName: string; roleId: string }> }> => {
  // Check if user has SUPERADMIN role for WINDBOOKS_APP resource
  const windbooksAppResource = await prisma.resource.findFirst({
    where: { name: 'WINDBOOKS_APP' },
  });

  let isSuperAdminForWindbooks = false;
  if (windbooksAppResource) {
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'SUPERADMIN' },
    });

    if (superAdminRole) {
      const userSuperAdminRole = await prisma.userResourceRole.findFirst({
        where: {
          userId,
          resourceId: windbooksAppResource.id,
          roleId: superAdminRole.id,
        },
      });
      isSuperAdminForWindbooks = !!userSuperAdminRole;
    }
  }

  if (isSuperAdminForWindbooks) {
    // Super admin has access to all requested resources - return super admin roles for all
    const result = [];
    for (const resourceId of resourceIds) {
      result.push({
        resourceId,
        roleName: 'Super Admin',
        roleId: 'super-admin-role',
      });
    }

    return { resourceRoles: result };
  }

  // For regular users, get their roles only for resources they have access to
  const userResourceRoles = await prisma.userResourceRole.findMany({
    where: {
      userId,
      resourceId: {
        in: resourceIds,
      },
    },
    include: {
      role: true,
    },
  });

  const resourceRoles = userResourceRoles.map(userResourceRole => ({
    resourceId: userResourceRole.resourceId!,
    roleName: userResourceRole.role.name,
    roleId: userResourceRole.role.id,
  }));

  return { resourceRoles };
};

export const softDeleteResource = async (resourceId: string): Promise<void> => {
  // Check if resource exists
  const resource = await (prisma as any).resource.findUnique({
    where: { id: resourceId },
    include: { status: true },
  });

  if (!resource) {
    throw new Error('Resource not found');
  }

  // Check if already deleted
  if (resource.status?.status === 'DELETED') {
    throw new Error('Resource is already deleted');
  }

  // Create or update ResourceStatus to DELETED
  await (prisma as any).resourceStatus.upsert({
    where: { resourceId },
    update: {
      status: 'DELETED',
      updatedAt: new Date(),
    },
    create: {
      resourceId,
      status: 'DELETED',
    },
  });
};

/**
 * Find a resource by ID
 */
export const findResourceById = async (resourceId: string) => {
  return prisma.resource.findUnique({
    where: { id: resourceId },
  });
};

/**
 * Find a resource by name
 */
export const findResourceByName = async (resourceName: string) => {
  return prisma.resource.findFirst({
    where: { name: resourceName },
  });
};

/**
 * Get permissions for a specific role
 */
export const getRolePermissions = async (roleId: string) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { permissions: true },
  });

  if (!role) {
    throw new Error('Role not found');
  }

  return role.permissions;
};

/**
 * Get resource roles for a user given a list of resourceIds
 */
export const getUserResourceRoles = async (userId: string, resourceIds: string[]) => {
  const userResourceRoles = await prisma.userResourceRole.findMany({
    where: {
      userId,
      resourceId: {
        in: resourceIds,
      },
    },
    include: {
      role: true,
      resource: true,
    },
  });

  return userResourceRoles.map((urr) => ({
    resourceId: urr.resourceId,
    roleName: urr.role.name,
    roleId: urr.roleId,
  }));
};

