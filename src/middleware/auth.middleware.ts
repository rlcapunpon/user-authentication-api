import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { findUserById } from '../services/user.service';
import { logger } from '../utils/logger';

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
      logger.debug({
        msg: 'Authentication failed: No token provided',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId: string };

    logger.debug({
      msg: 'AuthGuard: Decoded userId from token',
      userId: decoded.userId,
      ip: req.ip,
      path: req.path,
    });

    const user = await findUserById(decoded.userId);
    logger.debug({
      msg: 'AuthGuard: User lookup result',
      userId: decoded.userId,
      userFound: !!user,
      isActive: user?.isActive,
      ip: req.ip,
    });

    if (!user || !user.isActive) {
      logger.debug({
        msg: 'Authentication failed: User not found or inactive',
        userId: decoded.userId,
        userFound: !!user,
        isActive: user?.isActive,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Get user's resource roles and permissions
    const userWithRoles = user as any; // Type assertion until Prisma client is regenerated
    const resourceRoles = userWithRoles.resourceRoles?.map((userResourceRole: any) => ({
      resourceId: userResourceRole.resourceId,
      roleId: userResourceRole.roleId,
      roleName: userResourceRole.role.name,
      permissions: userResourceRole.role.permissions || [],
    })) || [];

    req.user = {
      userId: user.id,
      isSuperAdmin: userWithRoles.isSuperAdmin || false,
      resourceRoles
    };

    logger.debug({
      msg: 'Authentication successful',
      userId: user.id,
      isSuperAdmin: userWithRoles.isSuperAdmin || false,
      roleCount: resourceRoles.length,
      ip: req.ip,
    });

    next();
  } catch (error) {
    logger.debug({
      msg: 'Authentication failed: Token verification error',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
    });
    console.error('Auth guard error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
