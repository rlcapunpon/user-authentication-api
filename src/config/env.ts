import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';

const myEnv = dotenv.config();
expand(myEnv);

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
export const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || 10;
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'DEBUG';

export const JWT_SIGNING_ALGORITHM = 'HS256'; // Force to HS256