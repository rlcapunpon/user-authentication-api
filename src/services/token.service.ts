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

  const accessToken = generateAccessToken({ userId: user.id, roles: user.roles.map(ur => ur.role.name) });
  const jwtRefreshToken = generateJwtRefreshToken({ userId: user.id, jti: refreshToken.id });

  return { accessToken, refreshToken: jwtRefreshToken };
};

export const findRefreshTokenById = (id: string) => {
  return prisma.refreshToken.findUnique({ where: { id } });
};

export const revokeRefreshToken = (id: string) => {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
};