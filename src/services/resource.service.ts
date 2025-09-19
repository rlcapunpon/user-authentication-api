import { prisma } from '../db';

interface CreateResourceRoleData {
  name: string;
  resourceType: string;
  resourceId: string;
  description?: string;
  permissions: string[];
}

interface AssignUserToResourceRoleData {
  userId: string;
  resourceRoleId: string;
  resourceType: string;
  resourceId: string;
}

interface UnassignUserFromResourceRoleData {
  userId: string;
  resourceRoleId: string;
  resourceType: string;
  resourceId: string;
}

interface GetUserResourcePermissionsData {
  userId: string;
  resourceType: string;
  resourceId: string;
}

/**
 * Creates a new resource role with permissions
 */
export const createResourceRole = async (data: CreateResourceRoleData) => {
  const { name, resourceType, resourceId, description, permissions } = data;

  // Check if role already exists for this resource
  const existingRole = await prisma.resourceRole.findUnique({
    where: {
      name_resourceType_resourceId: {
        name,
        resourceType,
        resourceId,
      },
    },
  });

  if (existingRole) {
    throw new Error('Role with this name already exists for this resource');
  }

  // Create the resource role with permissions
  const resourceRole = await prisma.resourceRole.create({
    data: {
      name,
      resourceType,
      resourceId,
      description,
      permissions: {
        create: permissions.map(permission => ({
          permissionVerb: permission,
        })),
      },
    },
    include: {
      permissions: true,
    },
  });

  // Format the response to match test expectations
  return {
    id: resourceRole.id,
    name: resourceRole.name,
    resourceType: resourceRole.resourceType,
    resourceId: resourceRole.resourceId,
    description: resourceRole.description,
    permissions: resourceRole.permissions.map(p => p.permissionVerb),
  };
};

/**
 * Assigns a user to a resource role
 */
export const assignUserToResourceRole = async (data: AssignUserToResourceRoleData) => {
  const { userId, resourceRoleId, resourceType, resourceId } = data;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if resource role exists
  const resourceRole = await prisma.resourceRole.findUnique({
    where: { id: resourceRoleId },
  });

  if (!resourceRole) {
    throw new Error('Resource role not found');
  }

  // Check if user already has a role for this resource
  const existingAssignment = await prisma.userResourceRole.findUnique({
    where: {
      userId_resourceType_resourceId: {
        userId,
        resourceType,
        resourceId,
      },
    },
  });

  if (existingAssignment) {
    throw new Error('User already has a role assigned for this resource');
  }

  // Create the assignment
  const assignment = await prisma.userResourceRole.create({
    data: {
      userId,
      resourceRoleId,
      resourceType,
      resourceId,
    },
  });

  return {
    userId: assignment.userId,
    resourceRoleId: assignment.resourceRoleId,
    resourceType: assignment.resourceType,
    resourceId: assignment.resourceId,
  };
};

/**
 * Removes a user from a resource role
 */
export const unassignUserFromResourceRole = async (data: UnassignUserFromResourceRoleData) => {
  const { userId, resourceRoleId, resourceType, resourceId } = data;

  // Find the assignment
  const assignment = await prisma.userResourceRole.findUnique({
    where: {
      userId_resourceRoleId: {
        userId,
        resourceRoleId,
      },
    },
  });

  if (!assignment) {
    throw new Error('User resource role assignment not found');
  }

  // Delete the assignment
  await prisma.userResourceRole.delete({
    where: {
      userId_resourceRoleId: {
        userId,
        resourceRoleId,
      },
    },
  });

  return { success: true };
};

/**
 * Gets permissions for a user in a specific resource
 */
export const getUserResourcePermissions = async (data: GetUserResourcePermissionsData) => {
  const { userId, resourceType, resourceId } = data;

  // Find the user's role assignment for this resource
  const assignment = await prisma.userResourceRole.findUnique({
    where: {
      userId_resourceType_resourceId: {
        userId,
        resourceType,
        resourceId,
      },
    },
    include: {
      resourceRole: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!assignment) {
    return null;
  }

  // Extract permission verbs
  const permissions = assignment.resourceRole.permissions.map(p => p.permissionVerb);
  return permissions;
};