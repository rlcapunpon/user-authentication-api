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