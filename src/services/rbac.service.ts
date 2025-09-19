import { prisma } from '../db';

export const getAllRoles = () => {
  return prisma.role.findMany({
    include: {
      permissions: {
        select: {
          permission: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};

export const getAllPermissions = () => {
  return prisma.permission.findMany();
};

export const getRolePermissionMapping = () => {
  return prisma.role.findMany({
    include: {
      permissions: {
        select: {
          permission: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Get available roles with basic information for UI consumption
 * Returns simplified role data without sensitive permission details
 */
export const getAvailableRoles = () => {
  return prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};