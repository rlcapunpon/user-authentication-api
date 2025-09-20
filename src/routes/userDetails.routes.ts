import { Router } from 'express';
import {
  getUserDetailsHandler,
  updateUserDetailsHandler,
  deleteUserDetailsHandler,
  getAllUserDetailsHandler,
  getUserSubordinatesHandler,
} from '../controllers/userDetails.controller';
import { authGuard } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  updateUserDetailsSchema,
  userDetailsIdSchema,
} from '../schemas/user.schema';

const router = Router();

// All routes require authentication
router.use(authGuard);

// GET /api/user-details - Get all user details (superadmin only)
router.get('/', getAllUserDetailsHandler);

// GET /api/user-details/:id - Get user details by ID
router.get('/:id', validate(userDetailsIdSchema), getUserDetailsHandler);

// PUT /api/user-details/:id - Update user details
router.put('/:id', validate(updateUserDetailsSchema), updateUserDetailsHandler);

// DELETE /api/user-details/:id - Delete user details (superadmin only)
router.delete('/:id', validate(userDetailsIdSchema), deleteUserDetailsHandler);

// GET /api/user-details/:id/subordinates - Get user's subordinates
router.get('/:id/subordinates', validate(userDetailsIdSchema), getUserSubordinatesHandler);

export default router;