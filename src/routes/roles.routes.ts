import { Router } from 'express';
import { getRoles, getAvailableRoles, createRole, getResources, createResource } from '../controllers/rbac.controller';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { createRoleSchema, createResourceSchema } from '../schemas/resource.schema';

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
router.get('/', authGuard, rbacGuard(['read_roles']), getRoles);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with permissions
 *     tags: [RBAC]
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
router.post('/', authGuard, rbacGuard(['create_role']), validate(createRoleSchema), createRole);

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
