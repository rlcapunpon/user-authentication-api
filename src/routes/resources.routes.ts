import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard, authorizeResource } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { getResources, createResource, createRole, getUserRoleForResource, getResourcesV2, getUserResourcesAndRoles, getResourceRoles, deleteResource } from '../controllers/rbac.controller';
import { assignUserResourceRole, revokeUserResourceRole } from '../controllers/user.controller';
import { 
  createResourceSchema,
  createRoleSchema,
  assignUserResourceRoleSchema,
  revokeUserResourceRoleSchema,
  paginationQuerySchema,
  getResourceRolesSchema
} from '../schemas/resource.schema';

const router = Router();

/**
 * @swagger
 * /resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resources retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authGuard, getResources);

/**
 * @swagger
 * /resources/v2:
 *   get:
 *     summary: Get resources accessible to the authenticated user (paginated)
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: List of accessible resources retrieved successfully (paginated)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/v2', authGuard, validate(paginationQuerySchema), getResourcesV2);

/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resource created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authGuard, rbacGuard(['resource:create']), validate(createResourceSchema), createResource);

/**
 * @swagger
 * /resources/roles:
 *   post:
 *     summary: Create a role for a resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               resourceId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/roles', authGuard, rbacGuard(['role:create']), validate(createRoleSchema), createRole);

/**
 * @swagger
 * /resources/assign-role:
 *   post:
 *     summary: Assign a user to a resource role
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *               resourceId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/assign-role', authGuard, rbacGuard(['role:assign']), validate(assignUserResourceRoleSchema), assignUserResourceRole);

/**
 * @swagger
 * /resources/revoke-role:
 *   post:
 *     summary: Revoke a user's resource role
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *               resourceId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       204:
 *         description: Role revoked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/revoke-role', authGuard, rbacGuard(['role:assign']), validate(revokeUserResourceRoleSchema), revokeUserResourceRole);

/**
 * @swagger
 * /resources/{resourceId}/test-read:
 *   get:
 *     summary: Test endpoint for read permission authorization
 *     description: Test endpoint to verify that the authorizeResource middleware works for read permissions
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource
 *     responses:
 *       200:
 *         description: Access granted - user has read permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access granted"
 *                 action:
 *                   type: string
 *                   example: "read"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions for this resource
 */
router.get(
  '/:resourceId/test-read',
  authGuard,
  authorizeResource(['read']),
  (req, res) => {
    res.status(200).json({ message: 'Access granted', action: 'read' });
  }
);

/**
 * @swagger
 * /resources/{resourceId}/test-write:
 *   post:
 *     summary: Test endpoint for write permission authorization
 *     description: Test endpoint to verify that the authorizeResource middleware works for write/update permissions
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource
 *     responses:
 *       200:
 *         description: Access granted - user has write/update permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access granted"
 *                 action:
 *                   type: string
 *                   example: "write"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions for this resource
 */
router.post(
  '/:resourceId/test-write',
  authGuard,
  authorizeResource(['write', 'update']),
  (req, res) => {
    res.status(200).json({ message: 'Access granted', action: 'write' });
  }
);

/**
 * @swagger
 * /resources/{resourceId}/user-role:
 *   get:
 *     summary: Get the role of the authenticated user for a specific resource
 *     description: Retrieve the role assigned to the currently authenticated user for a specific resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource
 *     responses:
 *       200:
 *         description: User role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The role ID
 *                     name:
 *                       type: string
 *                       description: The role name
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of permissions for this role
 *                 resourceId:
 *                   type: string
 *                   description: The resource ID
 *                 userId:
 *                   type: string
 *                   description: The user ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No role found for this user on the specified resource
 *       500:
 *         description: Internal server error
 */
router.get('/:resourceId/user-role', authGuard, getUserRoleForResource);

/**
 * @swagger
 * /resources/{userId}:
 *   get:
 *     summary: Get all resources and roles assigned to a specific user
 *     description: Retrieve all resources and their corresponding roles assigned to a user. Super admins can access any user's data, while regular users can only access their own data.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     responses:
 *       200:
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - regular users can only access their own data
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:userId', authGuard, getUserResourcesAndRoles);

/**
 * @swagger
 * /resources/user-roles:
 *   post:
 *     summary: Get resource roles for authenticated user given a list of resourceIds
 *     description: Retrieve the roles assigned to the currently authenticated user for a list of specified resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
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
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/user-roles', authGuard, validate(getResourceRolesSchema), getResourceRoles);

/**
 * @swagger
 * /resources/{id}:
 *   delete:
 *     summary: Soft delete a resource
 *     description: Mark a resource as deleted (soft delete). The resource will no longer appear in GET requests but remains in the database.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource to delete
 *     responses:
 *       204:
 *         description: Resource successfully marked as deleted
 *       400:
 *         description: Bad request - resource is already deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authGuard, rbacGuard(['resource:delete']), deleteResource);

export default router;