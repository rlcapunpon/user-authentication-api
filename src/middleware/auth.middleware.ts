import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { findUserById } from '../services/user.service';

// Extend the Request type to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roles: string[];
      };
    }
  }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId: string; roles: string[] };

    console.log('AuthGuard: Decoded userId from token:', decoded.userId);
    const user = await findUserById(decoded.userId);
    console.log('AuthGuard: User found by ID:', user ? user.id : 'null');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = { userId: user.id, roles: decoded.roles };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
