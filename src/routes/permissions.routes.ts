import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';

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
router.get('/', authGuard, rbacGuard(['read_permissions']), (req, res) => {
  // Return predefined permissions based on our new schema
  const permissions = [
    'read_users',
    'create_user',
    'update_users',
    'delete_user',
    'read_roles',
    'create_role',
    'read_resources',
    'create_resource',
    'read_permissions',
    'manage_resource_roles'
  ];
  res.json(permissions);
});

export default router;
