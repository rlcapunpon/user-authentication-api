import { prisma } from '../db';
import { randomBytes } from 'crypto';

export const generateVerificationCode = async (userId: string): Promise<string> => {
  // Generate a unique verification code (UUID-like format)
  const verificationCode = randomBytes(16).toString('hex');

  console.log('Generated verification code:', {
    userId,
    verificationCode: verificationCode.substring(0, 8) + '...', // Log partial code for security
    verificationCodeLength: verificationCode.length,
    verificationCodeFormat: '32-character-hexadecimal',
    exampleValidCode: 'fd7c3069a9c92896ad9a11a8f4ec8f1d',
    timestamp: new Date().toISOString(),
  });

  // Set expiration to 15 minutes from now
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Store the verification code in the database
  await prisma.emailVerificationCode.create({
    data: {
      userId,
      verificationCode,
      expiresAt,
    },
  });

  return verificationCode;
};

export const invalidateVerificationCode = async (verificationCode: string): Promise<void> => {
  await prisma.emailVerificationCode.updateMany({
    where: {
      verificationCode,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });
};

export const findVerificationCode = async (verificationCode: string) => {
  return prisma.emailVerificationCode.findUnique({
    where: { verificationCode },
    include: { user: true },
  });
};