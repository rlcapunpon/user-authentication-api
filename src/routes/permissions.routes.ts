import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import { getAllPermissions } from '../config/permissions';

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

export default router;
