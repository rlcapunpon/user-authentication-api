import { prisma } from '../db';

export const getUserDetails = async (userId: string) => {
  return prisma.userDetails.findUnique({
    where: { id: userId },
    include: {
      user: {
        select: {
          email: true,
          isSuperAdmin: true,
          isActive: true,
        },
      },
      reportTo: {
        select: {
          id: true,
          email: true,
          details: {
            select: {
              firstName: true,
              lastName: true,
              nickName: true,
            },
          },
        },
      },
    },
  });
};

export const updateUserDetails = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    nickName?: string;
    contactNumber?: string;
    reportTo?: string;
  }
) => {
  return prisma.userDetails.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      nickName: data.nickName,
      contactNumber: data.contactNumber,
      reportToId: data.reportTo,
    },
    include: {
      user: {
        select: {
          email: true,
          isSuperAdmin: true,
          isActive: true,
        },
      },
      reportTo: {
        select: {
          id: true,
          email: true,
          details: {
            select: {
              firstName: true,
              lastName: true,
              nickName: true,
            },
          },
        },
      },
    },
  });
};

export const deleteUserDetails = async (userId: string) => {
  return prisma.userDetails.delete({
    where: { id: userId },
  });
};

export const getAllUserDetails = async () => {
  return prisma.userDetails.findMany({
    include: {
      user: {
        select: {
          email: true,
          isSuperAdmin: true,
          isActive: true,
        },
      },
      reportTo: {
        select: {
          id: true,
          email: true,
          details: {
            select: {
              firstName: true,
              lastName: true,
              nickName: true,
            },
          },
        },
      },
    },
  });
};

export const getUserSubordinates = async (managerId: string) => {
  return prisma.userDetails.findMany({
    where: { reportToId: managerId },
    include: {
      user: {
        select: {
          email: true,
          isSuperAdmin: true,
          isActive: true,
        },
      },
    },
  });
};