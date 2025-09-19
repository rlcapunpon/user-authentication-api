import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { findUserById } from '../services/user.service';

// Extend the Request type to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        isSuperAdmin: boolean;
        resourceRoles: {
          resourceId: string;
          roleId: string;
          roleName: string;
          permissions: string[];
        }[];
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
    const decoded = verifyToken(token) as { userId: string };

    console.log('AuthGuard: Decoded userId from token:', decoded.userId);
    const user = await findUserById(decoded.userId);
    console.log('AuthGuard: User found by ID:', user ? user.id : 'null');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Get user's resource roles and permissions
    const userWithRoles = user as any; // Type assertion until Prisma client is regenerated
    const resourceRoles = userWithRoles.resourceRoles?.map((userResourceRole: any) => ({
      resourceId: userResourceRole.resourceId,
      roleId: userResourceRole.roleId,
      roleName: userResourceRole.role.name,
      permissions: userResourceRole.role.permissions?.map((rp: any) => rp.permission.name) || [],
    })) || [];

    req.user = { 
      userId: user.id, 
      isSuperAdmin: userWithRoles.isSuperAdmin || false,
      resourceRoles 
    };
    next();
  } catch (error) {
    console.error('Auth guard error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
