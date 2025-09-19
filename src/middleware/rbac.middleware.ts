import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../services/user.service';

export const rbacGuard = (requiredPermissions: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // SuperAdmin bypasses all permission checks
    if (req.user.isSuperAdmin) {
      return next();
    }

    // If no specific permissions required, just need to be authenticated
    if (requiredPermissions.length === 0) {
      return next();
    }

    // Collect all permissions from all resource roles
    const allUserPermissions = req.user.resourceRoles.flatMap(role => role.permissions);

    // Check if user has any of the required permissions
    const hasRequiredPermission = requiredPermissions.some(permission => 
      allUserPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
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

    // SuperAdmin bypasses all permission checks
    if (req.user.isSuperAdmin) {
      return next();
    }

    const { resourceId } = req.params;
    
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }

    try {
      // Find the user's role for this specific resource
      const resourceRole = req.user.resourceRoles.find(role => 
        role.resourceId === resourceId
      );

      // If user has no role for this resource, deny access
      if (!resourceRole) {
        return res.status(403).json({ message: 'Insufficient permissions for this resource' });
      }

      // Check if user has any of the required permissions for this resource
      const hasRequiredPermission = requiredPermissions.some(permission => 
        resourceRole.permissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ message: 'Insufficient permissions for this resource' });
      }

      next();
    } catch (error) {
      console.error('Error in authorizeResource middleware:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

/**
 * Middleware that checks if user is a super admin
 */
export const requireSuperAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    next();
  };
};
