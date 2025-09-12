import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../config/env';

export const generateAccessToken = (payload: object, expiresIn?: string | number): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || JWT_ACCESS_EXPIRY } as any);
};

export const generateRefreshToken = (payload: object, expiresIn?: string | number): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn || JWT_REFRESH_EXPIRY } as any);
};

export const verifyToken = (token: string): object | string => {
  return jwt.verify(token, JWT_SECRET);
};
