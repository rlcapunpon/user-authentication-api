import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { BCRYPT_SALT_ROUNDS, HMAC_SECRET } from '../config/env';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = typeof BCRYPT_SALT_ROUNDS === 'string' ? parseInt(BCRYPT_SALT_ROUNDS) : BCRYPT_SALT_ROUNDS;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateApiKeyHash = (apiKey: string): string => {
  return crypto.createHmac('sha256', HMAC_SECRET).update(apiKey).digest('hex');
};

export const verifyApiKeyHash = (apiKey: string, hash: string): boolean => {
  const computedHash = generateApiKeyHash(apiKey);
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
};
