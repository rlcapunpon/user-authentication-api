import { Router } from 'express';
import { getRoles } from '../controllers/rbac.controller';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';

const router = Router();

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of roles.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authGuard, rbacGuard(['ADMIN', 'SUPER_ADMIN']), getRoles);

export default router;
