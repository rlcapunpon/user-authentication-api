import { Router } from 'express';
import { getRoles, getAvailableRoles } from '../controllers/rbac.controller';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RBAC
 *   description: Role-based access control (global roles and permissions)
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all global roles
 *     description: Retrieve all global roles in the system with their associated permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authGuard, rbacGuard(['ADMIN', 'SUPER_ADMIN']), getRoles);

/**
 * @swagger
 * /roles/available:
 *   get:
 *     summary: Get available roles for UI consumption
 *     description: Retrieve a simplified list of all available roles that can be used by the frontend for user interface components like dropdowns or role selection
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AvailableRole'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/available', authGuard, getAvailableRoles);

export default router;
