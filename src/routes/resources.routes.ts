/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Resource-based role and permission management
 */

import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard, authorizeResource } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { getResources, createResource, createRole } from '../controllers/rbac.controller';
import { assignUserResourceRole, revokeUserResourceRole } from '../controllers/user.controller';
import { 
  createResourceSchema,
  createRoleSchema,
  assignUserResourceRoleSchema,
  revokeUserResourceRoleSchema
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
router.get('/', authGuard, rbacGuard(['read_resources']), getResources);

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
router.post('/', authGuard, rbacGuard(['create_resource']), validate(createResourceSchema), createResource);

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
router.post('/roles', authGuard, rbacGuard(['create_role']), validate(createRoleSchema), createRole);

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
router.post('/assign-role', authGuard, rbacGuard(['manage_resource_roles']), validate(assignUserResourceRoleSchema), assignUserResourceRole);

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
router.post('/revoke-role', authGuard, rbacGuard(['manage_resource_roles']), validate(revokeUserResourceRoleSchema), revokeUserResourceRole);

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

export default router;