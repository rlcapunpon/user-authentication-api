import { Router, Request, Response, NextFunction } from 'express';
import { apiKeyAuth } from '../middleware/apiKey.middleware';
import { validate } from '../middleware/validate';
import { logger } from '../utils/logger';
import {
  createResource,
  getUserResourcesAndRoles,
  getResourceRoles
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
      responseSize: Buffer.isBuffer(data) ? data.length : (typeof data === 'string' ? data.length : JSON.stringify(data).length),
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