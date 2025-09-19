import { prisma } from '../db';

export const getAllRoles = () => {
  return (prisma as any).role.findMany({
    include: {
      resource: true,
    },
  });
};

export const getRolesByResource = (resourceId?: string) => {
  return (prisma as any).role.findMany({
    where: {
      resourceId: resourceId || null,
    },
    include: {
      resource: true,
    },
  });
};

export const getAllResources = () => {
  return (prisma as any).resource.findMany({
    include: {
      roles: true,
    },
  });
};

export const createResource = (name: string, description?: string) => {
  return (prisma as any).resource.create({
    data: {
      name,
      description,
    },
  });
};

export const createRole = (name: string, permissions: string[], resourceId?: string) => {
  return (prisma as any).role.create({
    data: {
      name,
      permissions,
      resourceId,
    },
  });
};

/**
 * Get available roles with basic information for UI consumption
 * Returns simplified role data without sensitive permission details
 */
export const getAvailableRoles = () => {
  return (prisma as any).role.findMany({
    include: {
      resource: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};