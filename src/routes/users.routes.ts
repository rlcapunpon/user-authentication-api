import { Router } from 'express';
import { listUsers, getUser, createUser, updateUserSuperAdmin, assignUserResourceRole, revokeUserResourceRole, deactivateUser, activateUser, deleteUser, listUsersV2, updateUserPassword, getUserPasswordUpdateHistory, getLastLogin } from '../controllers/user.controller';
import { authGuard } from '../middleware/auth.middleware';
import { rbacGuard, requireSuperAdmin } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSuperAdminSchema, userIdSchema, paginationQuerySchema, updatePasswordSchema, passwordHistoryUserIdSchema } from '../schemas/user.schema';
import { assignUserResourceRoleSchema, revokeUserResourceRoleSchema } from '../schemas/resource.schema';

const router = Router();
const userSpecificRouter = Router();

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
router.get('/', rbacGuard(['user:read']), listUsers);

/**
 * @swagger
 * /users/v2:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A paginated list of users.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/v2', rbacGuard(['user:read']), validate(paginationQuerySchema), listUsersV2);

/**
 * @swagger
 * /user/last-login:
 *   get:
 *     summary: Get user's last login timestamp
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Last login timestamp retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 last_login:
 *                   type: string
 *                   nullable: true
 *                   example: "10/03/2025 14:22:30"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
userSpecificRouter.get('/last-login', authGuard, getLastLogin);

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
router.get('/:id', rbacGuard(['user:read']), validate(userIdSchema), getUser);

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
router.post('/', rbacGuard(['user:create']), validate(createUserSchema), createUser);

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
router.post('/assign-role', rbacGuard(['user:update']), validate(assignUserResourceRoleSchema), assignUserResourceRole);

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
router.post('/revoke-role', rbacGuard(['user:update']), validate(revokeUserResourceRoleSchema), revokeUserResourceRole);

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
router.put('/:id/deactivate', rbacGuard(['user:update']), validate(userIdSchema), deactivateUser); // Using PUT for deactivation

/**
 * @swagger
 * /users/{id}/activate:
 *   put:
 *     summary: Activate a user
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
 *         description: User activated successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 */
router.put('/:id/activate', requireSuperAdmin(), validate(userIdSchema), activateUser); // Only SUPERADMIN can activate

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
router.delete('/:id', rbacGuard(['user:delete']), validate(userIdSchema), deleteUser);

/**
 * @swagger
 * /user/update/password:
 *   post:
 *     summary: Update user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userEmail
 *               - new_password
 *               - new_password_confirmation
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               userEmail:
 *                 type: string
 *                 format: email
 *               current_password:
 *                 type: string
 *                 description: Required for regular users, optional for SUPERADMIN when updating their own password
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *               new_password_confirmation:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *       400:
 *         description: Bad request - validation error or invalid current password
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 */
userSpecificRouter.post('/update/password', authGuard, validate(updatePasswordSchema), updateUserPassword);

/**
 * @swagger
 * /user/last-update/creds/{userId}:
 *   get:
 *     summary: Get user password update history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Password update history retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 last_update:
 *                   type: string
 *                   nullable: true
 *                   example: "10/03/2025 14:22:30"
 *                 updated_by:
 *                   type: string
 *                   nullable: true
 *                   example: "user-uuid"
 *                 how_many:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: User not found
 */
userSpecificRouter.get('/last-update/creds/:userId', authGuard, validate(passwordHistoryUserIdSchema), getUserPasswordUpdateHistory);

export default router;
export { userSpecificRouter };
