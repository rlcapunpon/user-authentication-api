import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import { getAllPermissions } from '../config/permissions';
import { checkUserPermission } from '../controllers/rbac.controller';

import { validate } from '../middleware/validate';
import { checkUserPermissionSchema } from '../schemas/resource.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all available permissions
 *     description: Retrieve all available permissions in the system
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/', authGuard, (req, res) => {
  // Return all available permissions from our comprehensive permission system
  const permissions = getAllPermissions();
  res.json(permissions);
});

/**
 * @swagger
 * /permissions/check:
 *   post:
 *     summary: Check if a user has a specific permission on a resource
 *     description: Check if a specific user has a particular permission on a given resource based on their assigned roles
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - permission
 *               - resourceId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The unique identifier of the user
 *               permission:
 *                 type: string
 *                 description: The permission to check (e.g., "resource:read")
 *               resourceId:
 *                 type: string
 *                 description: The unique identifier of the resource
 *     responses:
 *       200:
 *         description: Permission check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasPermission:
 *                   type: boolean
 *                   description: Whether the user has the permission
 *                 userPermissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of user's permissions
 *                 checkedPermission:
 *                   type: string
 *                   description: The permission that was checked
 *                 resourceId:
 *                   type: string
 *                   description: The resource ID that was checked
 *                 reason:
 *                   type: string
 *                   description: Reason for permission grant (only present for super admins)
 *       400:
 *         description: Bad request - missing required parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions to check user permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/check', authGuard, rbacGuard(['user:read']), validate(checkUserPermissionSchema), checkUserPermission);



export default router;
