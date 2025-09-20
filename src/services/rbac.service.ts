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