import { Router } from 'express';
import { getConfigPermissions } from '../controllers/config.controller';

const router = Router();

/**
 * @swagger
 * /config/permissions:
 *   get:
 *     summary: Get role-permission mapping
 *     description: Retrieve the system-wide default role-to-permission mapping.
 *     tags:
 *       - Config
 *     responses:
 *       200:
 *         description: A list of roles and their associated permissions.
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
 */
router.get('/permissions', getConfigPermissions);

export default router;
