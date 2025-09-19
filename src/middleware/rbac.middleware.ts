import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../services/user.service';
import { getUserResourcePermissions } from '../services/resource.service';

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

/**
 * Middleware to authorize resource-specific permissions
 * Checks if the current user has the required permission for a specific resource
 * 
 * @param requiredPermissions - Array of permissions required for the resource
 */
export const authorizeResource = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { resourceType, resourceId } = req.params;
    
    if (!resourceType || !resourceId) {
      return res.status(400).json({ message: 'Resource type and ID are required' });
    }

    try {
      // Get the user's permissions for this specific resource
      const userResourcePermissions = await getUserResourcePermissions({
        userId: req.user.userId,
        resourceType,
        resourceId,
      });

      // If user has no permissions for this resource, deny access
      if (!userResourcePermissions || userResourcePermissions.length === 0) {
        return res.status(403).json({ message: 'Forbidden: No access to this resource' });
      }

      // Check if user has any of the required permissions
      const hasRequiredPermission = requiredPermissions.some(permission => 
        userResourcePermissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions for this resource' });
      }

      next();
    } catch (error) {
      console.error('Error in authorizeResource middleware:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
