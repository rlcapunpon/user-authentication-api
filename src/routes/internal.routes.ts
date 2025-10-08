import { Router, Request, Response } from 'express';
import { apiKeyAuth } from '../middleware/apiKey.middleware';
import { validate } from '../middleware/validate';
import {
  createResource,
  getUserResourcesAndRoles,
  getResourceRoles
} from '../controllers/rbac.controller';
import { assignUserResourceRole, revokeUserResourceRole } from '../controllers/user.controller';
import { getMe } from '../controllers/auth.controller';
import { getAllRoles, getAvailableRoles, getAllResources, findResourceById, findResourceByName, findUserById, getUserRoleForResource, getRolePermissions } from '../services/rbac.service';
import { checkUserPermission, getUserPermissionsForResource } from '../controllers/rbac.controller';
import {
  createResourceSchema,
  assignUserResourceRoleSchema,
  revokeUserResourceRoleSchema,
  checkUserPermissionSchema,
  paginationQuerySchema,
  getResourceRolesSchema
} from '../schemas/resource.schema';

const router = Router();

// Apply API key authentication to all internal routes
router.use(apiKeyAuth);

// Internal API controller functions
const getInternalResources = async (req: Request, res: Response) => {
  try {
    const resources = await getAllResources();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources for internal API:', error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

const getInternalRoles = async (req: Request, res: Response) => {
  try {
    const roles = await getAllRoles();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles for internal API:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

const getInternalAvailableRoles = async (req: Request, res: Response) => {
  try {
    const roles = await getAvailableRoles();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching available roles for internal API:', error);
    res.status(500).json({ message: 'Failed to fetch available roles' });
  }
};

/**
 * @swagger
 * /internal/resources:
 *   get:
 *     summary: Get all resources (Internal API)
 *     tags: [Internal Resources]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of resources retrieved successfully
 *       401:
 *         description: Invalid API key
 *   post:
 *     summary: Create a new resource (Internal API)
 *     tags: [Internal Resources]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name of the resource
 *               description:
 *                 type: string
 *                 description: Description of the resource
 *     responses:
 *       201:
 *         description: Resource created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid API key
 *       409:
 *         description: Resource already exists
 */
router.get('/resources', getInternalResources);
router.post('/resources', validate(createResourceSchema), createResource);

/**
 * @swagger
 * /internal/auth/me/{userId}:
 *   get:
 *     summary: Get user profile by user ID (Internal API)
 *     tags: [Internal Auth]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Invalid API key
 *       404:
 *         description: User not found
 */
router.get('/auth/me/:userId', getMe);

/**
 * @swagger
 * /internal/roles:
 *   get:
 *     summary: Get all roles with their permissions (Internal API)
 *     tags: [Internal Roles]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *       401:
 *         description: Invalid API key
 */
router.get('/roles', getInternalRoles);

/**
 * @swagger
 * /internal/roles/available:
 *   get:
 *     summary: Get all available roles (Internal API)
 *     tags: [Internal Roles]
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of available roles retrieved successfully
 *       401:
 *         description: Invalid API key
 */
router.get('/roles/available', getInternalAvailableRoles);

/**
 * @swagger
 * /internal/permissions/check:
 *   post:
 *     summary: Check if a user has specific permission on a resource (Internal API)
 *     tags: [Internal Permissions]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - resourceId
 *               - permission
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               resourceId:
 *                 type: string
 *                 description: Resource ID
 *               permission:
 *                 type: string
 *                 description: Permission to check
 *     responses:
 *       200:
 *         description: Permission check result
 *       401:
 *         description: Invalid API key
 *       400:
 *         description: Bad request
 */
router.post('/permissions/check', validate(checkUserPermissionSchema), checkUserPermission);

/**
 * @swagger
 * /internal/resources/assign-role:
 *   post:
 *     summary: Assign a role to a user for a specific resource (Internal API)
 *     tags: [Internal Resources]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - resourceId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               resourceId:
 *                 type: string
 *                 description: Resource ID
 *               roleId:
 *                 type: string
 *                 description: Role ID
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       401:
 *         description: Invalid API key
 *       400:
 *         description: Bad request
 *       404:
 *         description: User, resource, or role not found
 */
router.post('/resources/assign-role', validate(assignUserResourceRoleSchema), assignUserResourceRole);

/**
 * @swagger
 * /internal/resources/revoke-role:
 *   post:
 *     summary: Revoke a role from a user for a specific resource (Internal API)
 *     tags: [Internal Resources]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - resourceId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               resourceId:
 *                 type: string
 *                 description: Resource ID
 *               roleId:
 *                 type: string
 *                 description: Role ID
 *     responses:
 *       200:
 *         description: Role revoked successfully
 *       401:
 *         description: Invalid API key
 *       400:
 *         description: Bad request
 *       404:
 *         description: User, resource, or role not found
 */
router.post('/resources/revoke-role', validate(revokeUserResourceRoleSchema), revokeUserResourceRole);

router.post('/resources/revoke-role', validate(revokeUserResourceRoleSchema), revokeUserResourceRole);

/**
 * Get user permissions for a specific resource (Internal API version)
 */
const getInternalUserPermissionsForResource = async (req: Request, res: Response) => {
  try {
    const { userId, resourceId, resourceName } = req.query;

    // Validate that userId is provided
    if (!userId) {
      return res.status(400).json({ 
        message: 'userId query parameter is required' 
      });
    }

    // Validate that either resourceId or resourceName is provided
    if (!resourceId && !resourceName) {
      return res.status(400).json({ 
        message: 'Either resourceId or resourceName must be provided' 
      });
    }

    // Get the resource by ID or name
    let resource;
    if (resourceId) {
      resource = await findResourceById(resourceId as string);
    } else if (resourceName) {
      resource = await findResourceByName(resourceName as string);
    }

    if (!resource) {
      return res.status(404).json({ 
        message: 'Resource not found' 
      });
    }

    // Check if user is super admin
    const user = await findUserById(userId as string);
    if (user?.isSuperAdmin) {
      // Super admin has full access to all resources
      const { ROLE_PERMISSIONS } = await import('../config/permissions');
      return res.json({
        resourceId: resource.id,
        roleId: 'super-admin-role', // Special ID for super admin
        role: 'SUPERADMIN',
        permissions: ROLE_PERMISSIONS.SUPERADMIN
      });
    }

    // Get user's role for this resource
    const userResourceRole = await getUserRoleForResource(userId as string, resource.id);

    if (!userResourceRole) {
      return res.status(404).json({
        message: 'No role found for this user on the specified resource'
      });
    }

    // Get permissions for the role
    const rolePermissions = await getRolePermissions(userResourceRole.roleId);

    res.json({
      resourceId: resource.id,
      roleId: userResourceRole.roleId,
      role: userResourceRole.role.name,
      permissions: rolePermissions
    });

  } catch (error) {
    console.error('Error getting user permissions for resource (internal):', error);
    res.status(500).json({ message: 'Failed to get user permissions for resource' });
  }
};

/**
 * @swagger
 * /internal/permissions/check:
 *   get:
 *     summary: Get user permissions for dashboard overview (Internal API)
 *     tags: [Internal Permissions]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: Resource ID (optional)
 *       - in: query
 *         name: resourceName
 *         schema:
 *           type: string
 *         description: Resource name (optional)
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *       401:
 *         description: Invalid API key
 *       400:
 *         description: Bad request
 */
router.get('/permission', getInternalUserPermissionsForResource);

export default router;