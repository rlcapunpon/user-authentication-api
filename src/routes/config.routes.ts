import { Router } from 'express';
import { getConfigPermissions } from '../controllers/config.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Config
 *   description: System configuration endpoints
 */

/**
 * @swagger
 * /config/permissions:
 *   get:
 *     summary: Get role-permission mapping
 *     description: Retrieve the system-wide default role-to-permission mapping.
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Role-permission mapping retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role: 
 *                     type: string
 *                     example: "ADMIN"
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: "read:users"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/permissions', getConfigPermissions);

export default router;
