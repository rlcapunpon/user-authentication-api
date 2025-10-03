import { Request, Response } from 'express';
import { requestPasswordReset, resetPasswordWithUserId } from '../services/passwordReset.service';

export const requestPasswordResetController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await requestPasswordReset(email);

    if (!result.success) {
      const statusCode = result.userNotFound ? 404 : (result.message.includes('Please wait') ? 429 : 400);
      return res.status(statusCode).json({
        message: result.message
      });
    }

    return res.status(200).json({
      message: result.message
    });
  } catch (error) {
    console.error('Error in requestPasswordResetController:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { new_password, new_password_confirmation } = req.body;

    // Get userId from JWT token (validated by auth middleware)
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!new_password || !new_password_confirmation) {
      return res.status(400).json({ message: 'New password and confirmation are required' });
    }

    const result = await resetPasswordWithUserId(userId, {
      newPassword: new_password,
      newPasswordConfirmation: new_password_confirmation,
    });

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.status(200).json({
      message: result.message
    });
  } catch (error) {
    console.error('Error in resetPasswordController:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};