import { Request, Response } from 'express';
import * as rbacService from '../services/rbac.service';

/**
 * Handles the request to get all roles.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getRoles = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.query;
    const roles = await rbacService.getRolesByResource(resourceId as string);
    res.json(roles);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

/**
 * Handles the request to get all resources.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getResources = async (req: Request, res: Response) => {
  try {
    console.log('🔍 DEBUG: GET /resources request received');
    console.log('   Method:', req.method);
    console.log('   URL:', req.url);
    console.log('   Query params:', req.query);
    console.log('   Headers:', {
      authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]',
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    });
    console.log('   User from token:', req.user);

    const userId = req.user?.userId;
    if (!userId) {
      console.log('❌ DEBUG: No userId found in token');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('✅ DEBUG: Proceeding with userId:', userId);
    const resources = await rbacService.getUserAccessibleResources(userId);
    console.log('📊 DEBUG: Resources fetched:', resources?.length || 0, 'items');

    res.json(resources);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('❌ DEBUG: Error fetching resources:', error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

/**
 * Handles the request to create a new resource.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createResource = async (req: Request, res: Response) => {
  try {
    const { name, description, id } = req.body;
    const resource = await rbacService.createResource(name, description, id);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: 'Failed to create resource' });
  }
};

/**
 * Handles the request to create a new role.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions, description } = req.body;
    const role = await rbacService.createRole(name, permissions, description);
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

/**
 * Handles the request to get available roles for UI consumption.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getAvailableRoles = async (req: Request, res: Response) => {
  try {
    const roles = await rbacService.getAvailableRoles();
    res.json(roles);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('Error fetching available roles:', error);
    res.status(500).json({ message: 'Failed to fetch available roles' });
  }
};

/**
 * Handles the request to check if a user has a specific permission on a resource.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const checkUserPermission = async (req: Request, res: Response) => {
  try {
    const { userId, permission, resourceId } = req.body;

    // Get user with their roles and permissions
    const user = await rbacService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is super admin
    if (user.isSuperAdmin) {
      return res.json({
        hasPermission: true,
        reason: 'super_admin',
        checkedPermission: permission,
        resourceId,
        userPermissions: ['*'] // Super admin has all permissions
      });
    }

    // Get user's permissions from their roles for the specific resource
    const userPermissions = await rbacService.getUserPermissionsFromRoles(userId, resourceId);

    // Check the specific permission
    const hasPermission = userPermissions.includes(permission) || userPermissions.includes('*');

    res.json({
      hasPermission,
      userPermissions,
      checkedPermission: permission,
      resourceId
    });

  } catch (error) {
    console.error('Error checking user permission:', error);
    res.status(500).json({ message: 'Failed to check user permission' });
  }
};

/**
 * Get the role of the authenticated user for a specific resource
 */
export const getUserRoleForResource = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user!.userId;

    const userResourceRole = await rbacService.getUserRoleForResource(userId, resourceId);

    if (!userResourceRole) {
      return res.status(404).json({
        message: 'No role found for this user on the specified resource'
      });
    }

    res.json({
      role: userResourceRole.role,
      resourceId,
      userId
    });

  } catch (error) {
    console.error('Error getting user role for resource:', error);
    res.status(500).json({ message: 'Failed to get user role for resource' });
  }
};

/**
 * Handles the request to get resources with pagination and filtering.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getResourcesV2 = async (req: Request, res: Response) => {
  try {
    console.log('🔍 DEBUG: GET /resources/v2 request received');
    console.log('   Method:', req.method);
    console.log('   URL:', req.url);
    console.log('   Query params:', req.query);
    console.log('   Headers:', {
      authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]',
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    });
    console.log('   User from token:', req.user);

    const userId = req.user?.userId;
    if (!userId) {
      console.log('❌ DEBUG: No userId found in token');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('✅ DEBUG: Proceeding with userId:', userId);

    const { page = 1, limit = 10, resourceName, resourceId, q } = req.query;
    console.log('📋 DEBUG: Filter params - page:', page, 'limit:', limit, 'resourceName:', resourceName, 'resourceId:', resourceId, 'q:', q);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const result = await rbacService.getUserAccessibleResourcesPaginated(
      userId,
      pageNum,
      limitNum,
      resourceName as string,
      resourceId as string,
      q as string
    );

    console.log('📊 DEBUG: Resources fetched:', result.data?.length || 0, 'items, total:', result.pagination.total, 'pages:', result.pagination.totalPages);

    res.json(result);
  } catch (error) {
    console.error('❌ DEBUG: Error fetching resources v2:', error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

/**
 * Get all resources and roles assigned to a specific user
 * Only super admins can access other users' data, regular users can only access their own
 */
export const getUserResourcesAndRoles = async (req: Request, res: Response) => {
  try {
    const { userId: requestedUserId } = req.params;
    const authenticatedUserId = req.user!.userId;
    const isSuperAdmin = req.user!.isSuperAdmin;

    // Check authorization: user can only access their own data unless they're super admin
    if (!isSuperAdmin && authenticatedUserId !== requestedUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own resources and roles' });
    }

    // Check if the requested user exists
    const user = await rbacService.findUserById(requestedUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await rbacService.getUserResourcesAndRoles(requestedUserId);
    res.json(result);

  } catch (error) {
    console.error('Error getting user resources and roles:', error);
    res.status(500).json({ message: 'Failed to get user resources and roles' });
  }
};

/**
 * Get resource roles for authenticated user given a list of resourceIds
 */
export const getResourceRoles = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { resources } = req.body;

    const result = await rbacService.getResourceRoles(userId, resources);
    res.json(result);

  } catch (error) {
    console.error('Error getting resource roles:', error);
    res.status(500).json({ message: 'Failed to get resource roles' });
  }
};

