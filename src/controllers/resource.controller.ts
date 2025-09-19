import { Request, Response } from 'express';
import * as resourceService from '../services/resource.service';

/**
 * Creates a new role for a specific resource
 */
export const createResourceRole = async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { name, description, permissions } = req.body;

    const resourceRole = await resourceService.createResourceRole({
      name,
      resourceType,
      resourceId,
      description,
      permissions
    });

    res.status(201).json(resourceRole);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: 'Role with this name already exists for this resource.' });
    }
    console.error('Error creating resource role:', error);
    res.status(500).json({ message: 'Failed to create resource role' });
  }
};

/**
 * Assigns a user to a resource role
 */
export const assignUserToResourceRole = async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId, roleId } = req.params;
    const { userId } = req.body;

    const assignment = await resourceService.assignUserToResourceRole({
      userId,
      resourceRoleId: roleId,
      resourceType,
      resourceId
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    if (error.message.includes('already has a role')) {
      return res.status(409).json({ message: 'User already has a role assigned for this resource.' });
    }
    if (error.message.includes('Resource role not found')) {
      return res.status(404).json({ message: 'Resource role not found.' });
    }
    if (error.message.includes('User not found')) {
      return res.status(404).json({ message: 'User not found.' });
    }
    console.error('Error assigning user to resource role:', error);
    res.status(500).json({ message: 'Failed to assign user to resource role' });
  }
};

/**
 * Removes a user from a resource role
 */
export const unassignUserFromResourceRole = async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId, roleId, userId } = req.params;

    await resourceService.unassignUserFromResourceRole({
      userId,
      resourceRoleId: roleId,
      resourceType,
      resourceId
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'User resource role assignment not found.' });
    }
    console.error('Error unassigning user from resource role:', error);
    res.status(500).json({ message: 'Failed to unassign user from resource role' });
  }
};

/**
 * Gets permissions for a user in a specific resource
 */
export const getUserResourcePermissions = async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId, userId } = req.params;

    const permissions = await resourceService.getUserResourcePermissions({
      userId,
      resourceType,
      resourceId
    });

    if (!permissions || permissions.length === 0) {
      return res.status(404).json({ message: 'User has no role in this resource.' });
    }

    res.status(200).json({ permissions });
  } catch (error: any) {
    console.error('Error getting user resource permissions:', error);
    res.status(500).json({ message: 'Failed to get user resource permissions' });
  }
};