import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../services/user.service';

export const rbacGuard = (requiredRoles: string[] = [], requiredPermissions: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const userRoles = user.roles.map(ur => ur.role.name);
    const userPermissions = user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.name));

    // Check for roles
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) {
        return res.status(403).json({ message: 'Forbidden: Insufficient role' });
      }
    }

    // Permissions check
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => userPermissions.includes(permission));
      if (!hasRequiredPermission) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
    }

    next();
  };
};
