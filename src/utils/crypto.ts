import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/env';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = typeof BCRYPT_SALT_ROUNDS === 'string' ? parseInt(BCRYPT_SALT_ROUNDS) : BCRYPT_SALT_ROUNDS;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
