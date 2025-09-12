import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';

const myEnv = dotenv.config();
expand(myEnv);

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
export const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || 10;

export const JWT_SIGNING_ALGORITHM = 'HS256'; // Force to HS256