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
import * as resourceController from '../controllers/resource.controller';
import { 
  createResourceRoleSchema, 
  assignUserToResourceRoleSchema 
} from '../schemas/resource.schema';

const router = Router();

/**
 * @swagger
 * /resources/{resourceType}/{resourceId}/roles:
 *   post:
 *     summary: Create a role for a specific resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the resource (e.g., "Organization", "Project")
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the role
 *               description:
 *                 type: string
 *                 description: Optional description of the role
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission verbs (e.g., ["read", "write", "update"])
 *     responses:
 *       201:
 *         description: Resource role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 resourceType:
 *                   type: string
 *                 resourceId:
 *                   type: string
 *                 description:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict - role with this name already exists for this resource
 */
// Create a role for a specific resource
router.post(
  '/:resourceType/:resourceId/roles',
  authGuard,
  rbacGuard(['ADMIN', 'SUPERADMIN']),
  validate(createResourceRoleSchema),
  resourceController.createResourceRole
);

/**
 * @swagger
 * /resources/{resourceType}/{resourceId}/roles/{roleId}/assign:
 *   post:
 *     summary: Assign a user to a resource role
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the resource
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the resource role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user to assign the role to
 *     responses:
 *       201:
 *         description: User assigned to resource role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 resourceRoleId:
 *                   type: string
 *                 resourceType:
 *                   type: string
 *                 resourceId:
 *                   type: string
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource role or user not found
 *       409:
 *         description: Conflict - user already has a role for this resource
 */
// Assign a user to a resource role
router.post(
  '/:resourceType/:resourceId/roles/:roleId/assign',
  authGuard,
  rbacGuard(['ADMIN', 'SUPERADMIN']),
  validate(assignUserToResourceRoleSchema),
  resourceController.assignUserToResourceRole
);

/**
 * @swagger
 * /resources/{resourceType}/{resourceId}/roles/{roleId}/assign/{userId}:
 *   delete:
 *     summary: Remove a user from a resource role
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the resource
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the resource role
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to remove from the role
 *     responses:
 *       200:
 *         description: User removed from resource role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User resource role assignment not found
 */
// Remove a user from a resource role
router.delete(
  '/:resourceType/:resourceId/roles/:roleId/assign/:userId',
  authGuard,
  rbacGuard(['ADMIN', 'SUPERADMIN']),
  resourceController.unassignUserFromResourceRole
);

/**
 * @swagger
 * /resources/{resourceType}/{resourceId}/users/{userId}/permissions:
 *   get:
 *     summary: Get permissions for a user in a specific resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the resource
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the resource
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["read", "update"]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User has no role in this resource
 */
// Get permissions for a user in a specific resource
router.get(
  '/:resourceType/:resourceId/users/:userId/permissions',
  authGuard,
  rbacGuard(['ADMIN', 'SUPERADMIN']),
  resourceController.getUserResourcePermissions
);

/**
 * @swagger
 * /resources/{resourceType}/{resourceId}/test-read:
 *   get:
 *     summary: Test endpoint for read permission authorization
 *     description: Test endpoint to verify that the authorizeResource middleware works for read permissions
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the resource
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
// Test endpoint for authorizeResource middleware
router.get(
  '/:resourceType/:resourceId/test-read',
  authGuard,
  authorizeResource(['read']),
  (req, res) => {
    res.status(200).json({ message: 'Access granted', action: 'read' });
  }
);

/**
 * @swagger
 * /resources/{resourceType}/{resourceId}/test-write:
 *   post:
 *     summary: Test endpoint for write permission authorization
 *     description: Test endpoint to verify that the authorizeResource middleware works for write/update permissions
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the resource
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
// Test endpoint for authorizeResource middleware with write permission
router.post(
  '/:resourceType/:resourceId/test-write',
  authGuard,
  authorizeResource(['write', 'update']),
  (req, res) => {
    res.status(200).json({ message: 'Access granted', action: 'write' });
  }
);

export default router;