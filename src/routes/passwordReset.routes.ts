import { Router } from 'express';
import { requestPasswordResetController, resetPasswordController } from '../controllers/passwordReset.controller';
import { authGuard } from '../middleware/auth.middleware';

const router = Router();

// POST /api/user/auth/reset-password/request/{email} - Request password reset (no auth required)
router.post('/reset-password/request/:email', requestPasswordResetController);

// POST /api/user/auth/reset-password - Reset password (auth required)
router.post('/reset-password', authGuard, resetPasswordController);

export default router;