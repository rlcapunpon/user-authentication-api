import { findUserByEmail, createUser, findUserById } from './user.service';
import { comparePassword } from '../utils/crypto';
import { generateAuthTokens, findRefreshTokenById, revokeRefreshToken } from './token.service';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../db';
import { UserWithRoles } from '../types/user';
import { findVerificationCode, invalidateVerificationCode } from './emailVerification.service';
import { generateVerificationCode } from './emailVerification.service';
import { sendVerificationEmail } from './email.service';

export const register = async (email: string, password: string) => {
  try {
    console.log('Registration attempt:', {
      email,
      timestamp: new Date().toISOString(),
      passwordLength: password ? password.length : 0,
    });

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      console.warn('Registration failed - user already exists:', {
        email,
        existingUserId: existingUser.id,
        timestamp: new Date().toISOString(),
      });
      const error = new Error('Email is already used') as Error & { code?: string };
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const user = await createUser(email, password);

    // Generate verification code and send email
    try {
      const verificationCode = await generateVerificationCode(user.id);
      await sendVerificationEmail({
        to: email,
        verificationCode,
        verificationUrl: process.env.VERIFICATION_URL!,
      });

      console.log('Verification email sent successfully:', {
        email,
        userId: user.id,
        verificationCode: verificationCode.substring(0, 8) + '...', // Log partial code for security
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', {
        email,
        userId: user.id,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      // Note: We don't fail registration if email sending fails
      // The user can still verify later or request a new verification email
    }

    console.log('Registration successful:', {
      email,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    // Re-throw the error after logging
    throw error;
  }
};

export const login = async (email: string, password: string, ipAddress?: string, metadata?: any) => {
  try {
    // Log login attempt
    console.log('Login attempt:', {
      email,
      timestamp: new Date().toISOString(),
      passwordLength: password ? password.length : 0,
    });

    const user = await findUserByEmail(email);

    if (!user) {
      console.warn('Login failed - user not found:', {
        email,
        timestamp: new Date().toISOString(),
        reason: 'User does not exist',
      });
      throw new Error('Invalid credentials');
    }

    if (!user.credential) {
      console.warn('Login failed - no credential found:', {
        email,
        userId: user.id,
        timestamp: new Date().toISOString(),
        reason: 'User has no credential record',
      });
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      // Check UserVerification table for detailed status
      const userVerification = await (prisma as any).userVerification.findUnique({
        where: { userId: user.id },
        select: {
          verificationStatus: true,
          userStatus: true,
        },
      });

      let errorMessage = 'Account is deactivated';

      if (userVerification) {
        if (userVerification.verificationStatus === 'unverified') {
          errorMessage = 'User account is not active and unverified';
        } else if (userVerification.verificationStatus === 'verified') {
          errorMessage = `User account is ${userVerification.userStatus}`;
        } else if (userVerification.verificationStatus === 'failed') {
          errorMessage = 'User account verification failed';
        }
      }

      console.warn('Login failed - user inactive:', {
        email,
        userId: user.id,
        timestamp: new Date().toISOString(),
        reason: errorMessage,
        verificationStatus: userVerification?.verificationStatus,
        userStatus: userVerification?.userStatus,
      });
      throw new Error(errorMessage);
    }

    const isPasswordValid = await comparePassword(password, user.credential.passwordHash);

    if (!isPasswordValid) {
      console.warn('Login failed - invalid password:', {
        email,
        userId: user.id,
        timestamp: new Date().toISOString(),
        reason: 'Password verification failed',
        passwordLength: password ? password.length : 0,
      });
      throw new Error('Invalid credentials');
    }

    const userWithRoles = await findUserById(user.id);
    const { accessToken, refreshToken } = await generateAuthTokens(userWithRoles as UserWithRoles);

    // Record login history
    try {
      await (prisma as any).userLoginHistory.create({
        data: {
          userId: user.id,
          lastLogin: new Date(),
          ipAddress: ipAddress || 'unknown',
          metadata: metadata || {},
        },
      });

      console.log('Login history recorded:', {
        userId: user.id,
        email,
        ipAddress,
        timestamp: new Date().toISOString(),
      });
    } catch (historyError) {
      // Log the error but don't fail the login
      console.error('Failed to record login history:', {
        userId: user.id,
        email,
        ipAddress,
        error: historyError instanceof Error ? historyError.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }

    console.log('Login successful:', {
      email,
      userId: user.id,
      isSuperAdmin: userWithRoles?.isSuperAdmin || false,
      timestamp: new Date().toISOString(),
    });

    return { accessToken, refreshToken };
  } catch (error) {
    // Re-throw the error after logging
    throw error;
  }
};

export const logout = async (refreshToken: string) => {
  try {
    const payload = verifyToken(refreshToken) as { jti: string };
    await revokeRefreshToken(payload.jti);
    // Logout is successful regardless of whether the token existed or not
  } catch (error) {
    // If token verification fails, we still consider logout successful
    // since the token is effectively invalid
    console.warn('Logout attempted with invalid token:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

export const refresh = async (refreshToken: string) => {
  const payload = verifyToken(refreshToken) as { userId: string; jti: string };
  const refreshTokenFromDb = await findRefreshTokenById(payload.jti);
  if (!refreshTokenFromDb || refreshTokenFromDb.revokedAt) {
    throw new Error('Refresh token is invalid or revoked');
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    throw new Error('User not found');
  }

  await revokeRefreshToken(payload.jti);
  const { accessToken, refreshToken: newRefreshToken } = await generateAuthTokens(user as UserWithRoles);
  return { accessToken, refreshToken: newRefreshToken };
};

export const getMe = async (userId: string) => {
  try {
    const me = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        updatedAt: true,
        details: {
          select: {
            firstName: true,
            lastName: true,
            nickName: true,
            contactNumber: true,
            reportTo: {
              select: {
                id: true,
                email: true,
                details: {
                  select: {
                    firstName: true,
                    lastName: true,
                    nickName: true
                  }
                }
              }
            }
          }
        },
        resourceRoles: {
          select: {
            resourceId: true,
            role: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!me) {
      throw new Error('User not found');
    }

    // Transform to match response structure
    const transformedUser = {
      id: me.id,
      email: me.email,
      isActive: me.isActive,
      isSuperAdmin: me.isSuperAdmin,
      createdAt: me.createdAt,
      updatedAt: me.updatedAt,
      details: me.details ? {
        firstName: me.details.firstName,
        lastName: me.details.lastName,
        nickName: me.details.nickName,
        contactNumber: me.details.contactNumber,
        reportTo: me.details.reportTo ? {
          id: me.details.reportTo.id,
          email: me.details.reportTo.email,
          firstName: me.details.reportTo.details?.firstName,
          lastName: me.details.reportTo.details?.lastName,
          nickName: me.details.reportTo.details?.nickName
        } : null
      } : null,
      resources: me.resourceRoles.map((rr: any) => ({
        resourceId: rr.resourceId,
        role: rr.role.name
      }))
    };

    return transformedUser;
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error in getMe service:', {
      userId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

export const validate = (token: string) => {
  try {
    const decoded = verifyToken(token);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error };
  }
};

export const verifyEmail = async (verificationCode: string) => {
  try {
    console.log('Email verification attempt:', {
      verificationCode: verificationCode.substring(0, 8) + '...', // Log partial code for security
      verificationCodeLength: verificationCode.length,
      verificationCodeFormat: /^[a-f0-9]{32}$/.test(verificationCode) ? 'valid-hex-32' : 'invalid-format',
      timestamp: new Date().toISOString(),
    });

    // Validate verification code format
    if (!/^[a-f0-9]{32}$/.test(verificationCode)) {
      console.warn('Email verification failed - invalid code format:', {
        verificationCode: verificationCode.substring(0, 8) + '...',
        expectedFormat: '32-character hexadecimal string (a-f, 0-9)',
        actualLength: verificationCode.length,
        actualFormat: verificationCode.replace(/[^a-f0-9]/gi, '').length === verificationCode.length ? 'hex-only' : 'contains-non-hex',
        timestamp: new Date().toISOString(),
      });
      throw new Error('Invalid verification code format. Expected 32-character hexadecimal string.');
    }

    // Find the verification code
    const verificationRecord = await findVerificationCode(verificationCode);
    if (!verificationRecord) {
      console.warn('Email verification failed - code not found:', {
        verificationCode: verificationCode.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
      throw new Error('Invalid verification code');
    }

    // Check if code is expired
    const now = new Date();
    if (verificationRecord.expiresAt < now) {
      console.warn('Email verification failed - code expired:', {
        verificationCode: verificationCode.substring(0, 8) + '...',
        expiresAt: verificationRecord.expiresAt,
        currentTime: now,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Verification code has expired');
    }

    // Check if code is already used
    if (verificationRecord.isUsed) {
      console.warn('Email verification failed - code already used:', {
        verificationCode: verificationCode.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
      throw new Error('Verification code has already been used');
    }

    // Update UserVerification status
    await prisma.userVerification.update({
      where: { userId: verificationRecord.userId },
      data: {
        isEmailVerified: true,
        emailVerificationDate: now,
        verificationStatus: 'verified',
        userStatus: 'active',
        updatedAt: now,
      },
    });

    // Update User status to active
    await prisma.user.update({
      where: { id: verificationRecord.userId },
      data: {
        isActive: true,
        updatedAt: now,
      },
    });

    // Mark verification code as used
    await invalidateVerificationCode(verificationCode);

    console.log('Email verification successful:', {
      userId: verificationRecord.userId,
      verificationCode: verificationCode.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
    });

    return { message: 'Email verified successfully' };
  } catch (error) {
    console.error('Email verification error:', {
      verificationCode: verificationCode.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

export const resendVerification = async (email: string) => {
  try {
    console.log('Resend verification attempt:', {
      email,
      timestamp: new Date().toISOString(),
    });

    // Find the user
    const user = await findUserByEmail(email);
    if (!user) {
      console.warn('Resend verification failed - user not found:', {
        email,
        timestamp: new Date().toISOString(),
      });
      throw new Error('User not found');
    }

    // Check UserVerification status
    const userVerification = await (prisma as any).userVerification.findUnique({
      where: { userId: user.id },
    });

    if (!userVerification) {
      console.warn('Resend verification failed - no verification record:', {
        email,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      throw new Error('User verification record not found');
    }

    // If user is already verified, return error
    if (userVerification.isEmailVerified) {
      console.warn('Resend verification failed - user already verified:', {
        email,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Email is already verified');
    }

    // Find existing verification codes for this user
    const existingCodes = await (prisma as any).emailVerificationCode.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    let verificationCodeToUse: string;

    // Check if there's a valid (not expired, not used) code we can reuse
    const validCode = existingCodes.find((code: any) =>
      !code.isUsed && code.expiresAt > new Date()
    );

    if (validCode) {
      // Reuse the valid code
      verificationCodeToUse = validCode.verificationCode;
      console.log('Reusing valid verification code:', {
        email,
        userId: user.id,
        verificationCode: verificationCodeToUse.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Generate a new verification code
      verificationCodeToUse = await generateVerificationCode(user.id);
      console.log('Generated new verification code:', {
        email,
        userId: user.id,
        verificationCode: verificationCodeToUse.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });
    }

    // Send the verification email
    await sendVerificationEmail({
      to: email,
      verificationCode: verificationCodeToUse,
      verificationUrl: process.env.VERIFICATION_URL!,
    });

    console.log('Verification email resent successfully:', {
      email,
      userId: user.id,
      verificationCode: verificationCodeToUse.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
    });

    return { message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Resend verification error:', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};
