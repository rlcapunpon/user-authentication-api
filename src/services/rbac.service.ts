import { prisma } from '../db';

export const getAllRoles = () => {
  return prisma.role.findMany({
    include: {
      resource: true,
    },
  });
};

export const getRolesByResource = (resourceId?: string) => {
  const whereClause = resourceId ? { resourceId } : {};
  return prisma.role.findMany({
    where: whereClause,
    include: {
      resource: true,
    },
  });
};

export const getAllResources = () => {
  return prisma.resource.findMany({
    include: {
      roles: true,
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

export const createRole = (name: string, permissions: string[], resourceId?: string, description?: string) => {
  return prisma.role.create({
    data: {
      name,
      permissions,
      resourceId,
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
      resource: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};