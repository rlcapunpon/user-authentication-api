import { prisma } from '../db';
import { generateAccessToken, generateRefreshToken as generateJwtRefreshToken } from '../utils/jwt';
import { UserWithRoles } from '../types/user';

export const generateAuthTokens = async (user: UserWithRoles) => {
  const refreshToken = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      tokenHash: '' // Will be updated later
    },
  });

  // Extract only essential permission data to keep JWT small
  const userPermissions = user.isSuperAdmin 
    ? ['*'] // SuperAdmin has all permissions
    : [...new Set(user.resourceRoles.flatMap(role => role.role.permissions))]; // Unique permissions only

  const accessToken = generateAccessToken({ 
    userId: user.id, 
    isSuperAdmin: user.isSuperAdmin,
    permissions: userPermissions // Much smaller than full resourceRoles objects
  });
  const jwtRefreshToken = generateJwtRefreshToken({ userId: user.id, jti: refreshToken.id });

  return { accessToken, refreshToken: jwtRefreshToken };
};

export const findRefreshTokenById = (id: string) => {
  return prisma.refreshToken.findUnique({ where: { id } });
};

export const revokeRefreshToken = async (id: string) => {
  try {
    return await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  } catch (error: any) {
    // If the token doesn't exist (P2025 error), treat it as already revoked
    if (error.code === 'P2025') {
      // Token is already effectively revoked (doesn't exist)
      return null;
    }
    throw error;
  }
};