import { prisma } from '../db';

export interface AdminStatusCounts {
  totalUsers: number;
  totalResources: number;
  activeUsers: number;
  activeResources: number;
  inactiveUsers: number;
  inactiveResources: number;
  deletedUsers: number;
  deletedResources: number;
  totalRoles: number;
}

/**
 * Get admin status counts for users, resources, and roles
 * Excludes WINDBOOKS_APP from resource counts
 */
export const getAdminStatus = async (): Promise<AdminStatusCounts> => {
  try {
    // Get user counts
    const totalUsers = await (prisma as any).user.count();
    const activeUsers = await (prisma as any).user.count({ 
      where: { isActive: true } 
    });
    const inactiveUsers = await (prisma as any).user.count({ 
      where: { isActive: false } 
    });
    // Currently no soft delete for users, so deletedUsers is 0
    const deletedUsers = 0;

    // Get resource counts (excluding WINDBOOKS_APP)
    const totalResources = await (prisma as any).resource.count({
      where: {
        name: {
          not: 'WINDBOOKS_APP'
        }
      }
    });

    // Get active resources (excluding WINDBOOKS_APP)
    const activeResources = await (prisma as any).resource.count({
      where: {
        name: {
          not: 'WINDBOOKS_APP'
        },
        status: {
          status: 'ACTIVE'
        }
      }
    });

    // Get inactive resources (excluding WINDBOOKS_APP)
    const inactiveResources = await (prisma as any).resource.count({
      where: {
        name: {
          not: 'WINDBOOKS_APP'
        },
        status: {
          status: 'INACTIVE'
        }
      }
    });

    // Get deleted resources (excluding WINDBOOKS_APP)
    const deletedResources = await (prisma as any).resource.count({
      where: {
        name: {
          not: 'WINDBOOKS_APP'
        },
        status: {
          status: 'DELETED'
        }
      }
    });

    // Get total roles count
    const totalRoles = await (prisma as any).role.count();

    return {
      totalUsers,
      totalResources,
      activeUsers,
      activeResources,
      inactiveUsers,
      inactiveResources,
      deletedUsers,
      deletedResources,
      totalRoles,
    };
  } catch (error) {
    console.error('Error fetching admin status counts:', error);
    throw new Error('Failed to fetch admin status counts');
  }
};