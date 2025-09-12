import { Router } from 'express';
import { getPermissions } from '../controllers/rbac.controller';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RBAC
 *   description: Role-based access control
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of permissions.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authGuard, rbacGuard(['ADMIN', 'SUPER_ADMIN']), getPermissions);

export default router;
