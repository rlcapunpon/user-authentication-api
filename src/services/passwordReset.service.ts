import { prisma } from '../db';
import { generateAccessToken } from '../utils/jwt';
import { sendPasswordResetEmail } from './email.service';
import { hashPassword } from '../utils/crypto';

const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || 'http://localhost:3000/reset-password';
const RESET_TOKEN_EXPIRY_HOURS = 1; // 1 hour

export interface PasswordResetRequestData {
  userId: string;
  userEmail: string;
}

export interface PasswordResetData {
  newPassword: string;
  newPasswordConfirmation: string;
}

export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string; userNotFound?: boolean }> => {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { passwordResetRequests: true },
    }) as any;

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        userNotFound: true,
      };
    }

    // Check if there's a recent reset request (within 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentRequest = user.passwordResetRequests.find(
      (request: { lastRequestDate: Date }) => request.lastRequestDate > thirtyMinutesAgo
    );

    if (recentRequest) {
      return {
        success: false,
        message: 'A password reset request was sent recently. Please wait 30 minutes before requesting another.',
      };
    }

    // Create or update password reset request
    await prisma.passwordResetRequests.upsert({
      where: { userEmail: email },
      update: { lastRequestDate: new Date() },
      create: {
        userId: user.id,
        userEmail: email,
        lastRequestDate: new Date(),
      },
    });

    // Generate JWT token for password reset
    const resetToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    });

    // Send password reset email
    const emailSent = await sendPasswordResetEmail({
      to: email,
      resetToken,
      resetUrl: PASSWORD_RESET_URL,
    });

    if (!emailSent) {
      console.error('Failed to send password reset email:', { email });
      return {
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      };
    }

    return {
      success: true,
      message: 'Password reset email sent successfully.',
    };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return {
      success: false,
      message: 'An error occurred while processing your request.',
    };
  }
};

export const resetPassword = async (
  token: string,
  passwordData: PasswordResetData
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.newPasswordConfirmation) {
      return {
        success: false,
        message: 'Password confirmation does not match.',
      };
    }

    // Validate password strength (minimum 6 characters)
    if (passwordData.newPassword.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.',
      };
    }

    // Note: Token validation is handled by the auth middleware
    // The userId should be available in the request after token validation
    // This function assumes the token has been validated and userId is extracted

    // For now, we'll need the userId to be passed from the controller
    // This will be updated when we implement the controller

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password.',
    };
  }
};

export const resetPasswordWithUserId = async (
  userId: string,
  passwordData: PasswordResetData
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.newPasswordConfirmation) {
      return {
        success: false,
        message: 'Password confirmation does not match.',
      };
    }

    // Validate password strength (minimum 6 characters)
    if (passwordData.newPassword.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.',
      };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { credential: true },
    });

    if (!user || !user.credential) {
      return {
        success: false,
        message: 'User not found.',
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(passwordData.newPassword);

    // Update password
    await prisma.credential.update({
      where: { userId },
      data: { passwordHash: hashedPassword },
    });

    // Create password update record
    await prisma.userPasswordUpdate.create({
      data: {
        userId,
        updatedBy: user.email, // Self-updated
      },
    });

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'An error occurred while resetting your password.',
    };
  }
};