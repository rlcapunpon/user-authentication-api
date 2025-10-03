import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/rbac.middleware';
import { getAdminStatusCounts } from '../controllers/admin.controller';

const router = Router();

/**
 * @swagger
 * /admin/status:
 *   get:
 *     summary: Get admin status counts (SUPERADMIN only)
 *     description: Returns counts of users, resources, and roles with their respective statuses. Only accessible by SUPERADMIN users.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin status counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   description: Total number of users
 *                 totalResources:
 *                   type: integer
 *                   description: Total number of resources (excluding WINDBOOKS_APP)
 *                 activeUsers:
 *                   type: integer
 *                   description: Number of active users
 *                 activeResources:
 *                   type: integer
 *                   description: Number of active resources
 *                 inactiveUsers:
 *                   type: integer
 *                   description: Number of inactive users
 *                 inactiveResources:
 *                   type: integer
 *                   description: Number of inactive resources
 *                 deletedUsers:
 *                   type: integer
 *                   description: Number of deleted users
 *                 deletedResources:
 *                   type: integer
 *                   description: Number of deleted resources
 *                 totalRoles:
 *                   type: integer
 *                   description: Total number of roles
 *               example:
 *                 totalUsers: 25
 *                 totalResources: 10
 *                 activeUsers: 20
 *                 activeResources: 8
 *                 inactiveUsers: 5
 *                 inactiveResources: 1
 *                 deletedUsers: 0
 *                 deletedResources: 1
 *                 totalRoles: 15
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *       403:
 *         description: Forbidden - User is not SUPERADMIN
 *       500:
 *         description: Internal server error
 */
router.get('/status', authGuard, requireSuperAdmin(), getAdminStatusCounts);

export default router;