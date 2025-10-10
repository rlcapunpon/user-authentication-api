import { Router, Request, Response, NextFunction } from 'express';
import { apiKeyAuth } from '../middleware/apiKey.middleware';
import { validate } from '../middleware/validate';
import { logger } from '../utils/logger';
import * as rbacService from '../services/rbac.service';
import {
  createResource,
  getUserResourcesAndRoles,
  getResourceRoles,
  deleteResource,
  getResourcesV2
} from '../controllers/rbac.controller';
import { assignUserResourceRole, revokeUserResourceRole } from '../controllers/user.controller';
import { getMe, getUserById } from '../controllers/auth.controller';
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

// Logging middleware for internal API requests
const internalApiLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const apiKey = req.headers['x-api-key'] as string;
  const apiKeyPrefix = apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING';

  logger.info({
    message: '[INTERNAL API REQUEST]',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    apiKeyPrefix,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    contentLength: req.get('content-length'),
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;

    logger.info({
      message: '[INTERNAL API RESPONSE]',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: Buffer.isBuffer(data) ? data.length : (typeof data === 'string' ? data.length : (data ? JSON.stringify(data).length : 0)),
      timestamp: new Date().toISOString()
    });

    return originalSend.call(this, data);
  };

  next();
};

// Apply API key authentication and logging to all internal routes
router.use(apiKeyAuth);
router.use(internalApiLogger);

// Internal API controller functions
const getInternalResources = async (req: Request, res: Response) => {
  try {
    logger.debug({
      message: 'Fetching all resources for internal API',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    const resources = await getAllResources();

    logger.info({
      message: 'Successfully retrieved resources for internal API',
      resourceCount: resources.length,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json(resources);
  } catch (error) {
    logger.error({
      message: 'Error fetching resources for internal API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

const getInternalRoles = async (req: Request, res: Response) => {
  try {
    logger.debug({
      message: 'Fetching all roles for internal API',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    const roles = await getAllRoles();

    logger.info({
      message: 'Successfully retrieved roles for internal API',
      roleCount: roles.length,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json(roles);
  } catch (error) {
    logger.error({
      message: 'Error fetching roles for internal API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

const getInternalAvailableRoles = async (req: Request, res: Response) => {
  try {
    logger.debug({
      message: 'Fetching available roles for internal API',
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    const roles = await getAvailableRoles();

    logger.info({
      message: 'Successfully retrieved available roles for internal API',
      roleCount: roles.length,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json(roles);
  } catch (error) {
    logger.error({
      message: 'Error fetching available roles for internal API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Failed to fetch available roles' });
  }
};

/**
 * Get resources v2 for internal API - requires userId in query params
 */
const getInternalResourcesV2 = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    logger.debug({
      message: 'Fetching resources v2 for internal API',
      userId,
      query: req.query,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    if (!userId) {
      logger.warn({
        message: 'Missing userId parameter in internal resources v2 request',
        query: req.query,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        message: 'userId query parameter is required'
      });
    }

    // Create a modified request object with user information
    const user = await findUserById(userId as string);
    const modifiedReq = Object.assign(req, {
      user: { 
        userId: userId as string,
        isSuperAdmin: user?.isSuperAdmin || false
      }
    });

    // Remove userId from query since it's now in req.user
    const originalQuery = { ...req.query };
    delete (modifiedReq.query as any).userId;

    // Call the original getResourcesV2 function
    await getResourcesV2(modifiedReq, res);

  } catch (error) {
    logger.error({
      message: 'Error fetching resources v2 for internal API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

/**
 * Get user resources and roles for internal API - allows access to any user's data
 */
const getInternalUserResourcesAndRoles = async (req: Request, res: Response) => {
  try {
    const { userId: requestedUserId } = req.params;

    logger.debug({
      message: 'Fetching user resources and roles for internal API',
      requestedUserId,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Check if the requested user exists
    const user = await findUserById(requestedUserId);
    if (!user) {
      logger.warn({
        message: 'User not found in internal user resources request',
        requestedUserId,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({ message: 'User not found' });
    }

    // For internal API, we allow access to any user's data (no authorization check)
    const result = await rbacService.getUserResourcesAndRoles(requestedUserId);

    logger.info({
      message: 'Successfully retrieved user resources and roles for internal API',
      requestedUserId,
      resourceCount: result.resources?.length || 0,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json(result);

  } catch (error) {
    logger.error({
      message: 'Error fetching user resources and roles for internal API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Failed to get user resources and roles' });
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
 * Delete resource for internal API - no authentication required
 */
const deleteInternalResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.debug({
      message: 'Deleting resource for internal API',
      resourceId: id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    await rbacService.softDeleteResource(id);

    logger.info({
      message: 'Resource successfully deleted for internal API',
      resourceId: id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    logger.error({
      message: 'Error deleting resource for internal API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      resourceId: req.params.id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    if (error instanceof Error) {
      if (error.message === 'Resource not found') {
        return res.status(404).json({ message: 'Resource not found' });
      }
      if (error.message === 'Resource is already deleted') {
        return res.status(400).json({ message: 'Resource is already deleted' });
      }
    }

    res.status(500).json({ message: 'Failed to delete resource' });
  }
};

/**
 * @swagger
 * /internal/resources/{id}:
 *   delete:
 *     summary: Soft delete a resource (Internal API)
 *     description: Mark a resource as deleted (soft delete). The resource will no longer appear in GET requests but remains in the database for audit purposes.
 *     tags: [Internal Resources]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource to delete
 *     responses:
 *       '204':
 *         description: Resource successfully marked as deleted (status set to DELETED)
 *       '400':
 *         description: Bad request - resource is already deleted
 *       '401':
 *         description: Invalid API key
 *       '404':
 *         description: Resource not found
 *       '500':
 *         description: Internal server error
 */
router.delete('/resources/:id', deleteInternalResource);

/**
 * Get resource roles for internal API - allows access to any user's data
 */
const getInternalResourceRoles = async (req: Request, res: Response) => {
  try {
    const { resources, userId } = req.body;

    logger.debug({
      message: 'Getting resource roles for internal API',
      userId,
      resourceCount: resources?.length || 0,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    if (!userId) {
      logger.warn({
        message: 'Missing userId in internal resource roles request',
        body: req.body,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ message: 'userId is required' });
    }

    if (!resources || !Array.isArray(resources) || resources.length === 0) {
      logger.warn({
        message: 'Invalid resources array in internal resource roles request',
        body: req.body,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ message: 'Resources array is required and must not be empty' });
    }

    const result = await rbacService.getResourceRoles(userId, resources);

    logger.info({
      message: 'Resource roles retrieved successfully for internal API',
      userId,
      resourceCount: resources.length,
      roleCount: result.resourceRoles?.length || 0,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    logger.error({
      message: 'Error getting resource roles for internal API',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Failed to get resource roles' });
  }
};

/**
 * @swagger
 * /internal/resources/user-roles:
 *   post:
 *     summary: Get resource roles for authenticated user given a list of resourceIds (Internal API)
 *     description: Retrieve the roles assigned to the currently authenticated user for a list of specified resources
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
 *               - resources
 *             properties:
 *               resources:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of resource IDs to get roles for
 *                 example: ["resource1", "resource2"]
 *     responses:
 *       200:
 *         description: Resource roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceRoles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       resourceId:
 *                         type: string
 *                         description: The resource ID
 *                       roleName:
 *                         type: string
 *                         description: The role name
 *                       roleId:
 *                         type: string
 *                         description: The role ID
 *                   example:
 *                     - resourceId: "resource1"
 *                       roleName: "STAFF"
 *                       roleId: "role123"
 *                     - resourceId: "resource2"
 *                       roleName: "ADMIN"
 *                       roleId: "role456"
 *       400:
 *         description: Bad request - invalid request body
 *       401:
 *         description: Invalid API key
 *       500:
 *         description: Internal server error
 */
router.post('/resources/user-roles', validate(getResourceRolesSchema), getInternalResourceRoles);

/**
 * @swagger
 * /internal/resources/v2:
 *   get:
 *     summary: Get resources accessible to the authenticated user (paginated) (Internal API)
 *     tags: [Internal Resources]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get resources for
 *     responses:
 *       200:
 *         description: List of accessible resources retrieved successfully (paginated)
 *       401:
 *         description: Invalid API key
 *       403:
 *         description: Forbidden
 */
router.get('/resources/v2', getInternalResourcesV2);

/**
 * @swagger
 * /internal/resources/{userId}:
 *   get:
 *     summary: Get all resources and roles assigned to a specific user (Internal API)
 *     description: Retrieve all resources and their corresponding roles assigned to a user. Super admins can access any user's data, while regular users can only access their own data.
 *     tags: [Internal Resources]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the user
 *     responses:
 *       '200':
 *         description: User resources and roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       resourceId:
 *                         type: string
 *                         description: The resource ID
 *                       resourceName:
 *                         type: string
 *                         description: The resource name
 *                       roleName:
 *                         type: string
 *                         description: The role name
 *                       roleId:
 *                         type: string
 *                         description: The role ID
 *       '401':
 *         description: Invalid API key
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
router.get('/resources/:userId', getInternalUserResourcesAndRoles);

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
router.get('/auth/me/:userId', getUserById);

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

/**
 * Get user permissions for a specific resource (Internal API version)
 */
const getInternalUserPermissionsForResource = async (req: Request, res: Response) => {
  try {
    const { userId, resourceId, resourceName } = req.query;

    logger.debug({
      message: 'Getting user permissions for resource (internal API)',
      userId,
      resourceId,
      resourceName,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Validate that userId is provided
    if (!userId) {
      logger.warn({
        message: 'Missing userId parameter in internal permission request',
        query: req.query,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({
        message: 'userId query parameter is required'
      });
    }

    // Validate that either resourceId or resourceName is provided
    if (!resourceId && !resourceName) {
      logger.warn({
        message: 'Missing resource identifier in internal permission request',
        query: req.query,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
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
      logger.warn({
        message: 'Resource not found in internal permission request',
        userId,
        resourceId,
        resourceName,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        message: 'Resource not found'
      });
    }

    // Check if user is super admin
    const user = await findUserById(userId as string);
    if (user?.isSuperAdmin) {
      // Super admin has full access to all resources
      const { ROLE_PERMISSIONS } = await import('../config/permissions');

      logger.info({
        message: 'Super admin permissions retrieved for internal API',
        userId,
        resourceId: resource.id,
        resourceName: resource.name,
        permissionCount: ROLE_PERMISSIONS.SUPERADMIN.length,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

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
      logger.warn({
        message: 'No role found for user on resource in internal permission request',
        userId,
        resourceId: resource.id,
        resourceName: resource.name,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({
        message: 'No role found for this user on the specified resource'
      });
    }

    // Get permissions for the role
    const rolePermissions = await getRolePermissions(userResourceRole.roleId);

    logger.info({
      message: 'User permissions retrieved successfully for internal API',
      userId,
      resourceId: resource.id,
      resourceName: resource.name,
      roleId: userResourceRole.roleId,
      roleName: userResourceRole.role.name,
      permissionCount: rolePermissions.length,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      resourceId: resource.id,
      roleId: userResourceRole.roleId,
      role: userResourceRole.role.name,
      permissions: rolePermissions
    });

  } catch (error) {
    logger.error({
      message: 'Error getting user permissions for resource (internal API)',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      query: req.query,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
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