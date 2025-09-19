import { Router } from 'express';
import { listUsers, getUser, createUser, updateUserSuperAdmin, assignUserResourceRole, revokeUserResourceRole, deactivateUser, deleteUser } from '../controllers/user.controller';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard, requireSuperAdmin } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSuperAdminSchema, userIdSchema } from '../schemas/user.schema';
import { assignUserResourceRoleSchema, revokeUserResourceRoleSchema } from '../schemas/resource.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

router.use(authGuard);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', rbacGuard(['read_users']), listUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single user.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get('/:id', rbacGuard(['read_users']), validate(userIdSchema), getUser);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', rbacGuard(['create_user']), validate(createUserSchema), createUser);

/**
 * @swagger
 * /users/{id}/super-admin:
 *   put:
 *     summary: Update a user's super admin status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isSuperAdmin:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User super admin status updated successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/:id/super-admin', requireSuperAdmin(), validate(updateUserSuperAdminSchema), updateUserSuperAdmin);

/**
 * @swagger
 * /users/assign-role:
 *   post:
 *     summary: Assign a resource role to a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *               resourceId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Role assigned successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/assign-role', rbacGuard(['update_users']), validate(assignUserResourceRoleSchema), assignUserResourceRole);

/**
 * @swagger
 * /users/revoke-role:
 *   post:
 *     summary: Revoke a resource role from a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *               resourceId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       204:
 *         description: Role revoked successfully.
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/revoke-role', rbacGuard(['update_users']), validate(revokeUserResourceRoleSchema), revokeUserResourceRole);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   put:
 *     summary: Deactivate a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/:id/deactivate', rbacGuard(['update_users']), validate(userIdSchema), deactivateUser); // Using PUT for deactivation

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete('/:id', rbacGuard(['delete_user']), validate(userIdSchema), deleteUser);

export default router;
