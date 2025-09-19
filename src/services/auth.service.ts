import { findUserByEmail, createUser, findUserById } from './user.service';
import { comparePassword } from '../utils/crypto';
import { generateAuthTokens, findRefreshTokenById, revokeRefreshToken } from './token.service';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../db';
import { UserWithRoles } from '../types/user';

export const register = async (email: string, password: string) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }
  const user = await createUser(email, password);
  return user;
};

export const login = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user || !user.credential) {
    throw new Error('Invalid credentials');
  }
  const isPasswordValid = await comparePassword(password, user.credential.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  const userWithRoles = await findUserById(user.id);
  const { accessToken, refreshToken } = await generateAuthTokens(userWithRoles as UserWithRoles);
  return { accessToken, refreshToken };
};

export const logout = async (refreshToken: string) => {
  const payload = verifyToken(refreshToken) as { jti: string };
  await revokeRefreshToken(payload.jti);
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
  const me = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      isSuperAdmin: true,
      createdAt: true,
      updatedAt: true,
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
  return {
    id: me.id,
    email: me.email,
    isActive: me.isActive,
    isSuperAdmin: me.isSuperAdmin,
    createdAt: me.createdAt,
    updatedAt: me.updatedAt,
    resources: me.resourceRoles.map((rr: any) => ({
      resourceId: rr.resourceId,
      role: rr.role.name
    }))
  };
};

export const validate = (token: string) => {
  try {
    const decoded = verifyToken(token);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error };
  }
};
