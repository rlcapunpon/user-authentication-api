import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../services/user.service';
import { 
  isValidPermission, 
  RBAC_PERMISSIONS, 
  hasPermission, 
  ROLE_HIERARCHY,
  hasHigherOrEqualRole 
} from '../config/permissions';

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

    // Validate that all required permissions are valid
    const invalidPermissions = requiredPermissions.filter(permission => !isValidPermission(permission));
    if (invalidPermissions.length > 0) {
      console.error(`Invalid permissions required: ${invalidPermissions.join(', ')}`);
      return res.status(500).json({ message: 'Invalid permission configuration' });
    }

    // Collect all permissions from user
    const allUserPermissions = req.user.isSuperAdmin 
      ? ['*'] // SuperAdmin has all permissions
      : (req.user.permissions || []);

    // Check if user has any of the required permissions
    const hasRequiredPermission = requiredPermissions.some(permission => 
      allUserPermissions.includes('*') || allUserPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: requiredPermissions,
        user_permissions: allUserPermissions
      });
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

    // Validate that all required permissions are valid
    const invalidPermissions = requiredPermissions.filter(permission => !isValidPermission(permission));
    if (invalidPermissions.length > 0) {
      console.error(`Invalid permissions required: ${invalidPermissions.join(', ')}`);
      return res.status(500).json({ message: 'Invalid permission configuration' });
    }

    // Check if user has any of the required permissions
    // Note: With the optimized JWT, we use flat permissions
    // Resource-specific permissions are handled at the application level
    const hasRequiredPermission = requiredPermissions.some(permission => 
      req.user!.permissions.includes('*') || req.user!.permissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions for this resource',
        resource: resourceId,
        required: requiredPermissions,
        user_permissions: req.user.permissions
      });
    }

    next();
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

/**
 * Middleware that checks if user has a minimum role level
 * Note: With optimized JWT, role hierarchy is simplified
 */
export const requireMinimumRole = (minimumRole: keyof typeof ROLE_HIERARCHY) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // SuperAdmin bypasses all role checks
    if (req.user.isSuperAdmin) {
      return next();
    }

    // For now, with flat permissions, we check if user has admin-level permissions
    // This is a simplified approach - you may want to implement role-based checks differently
    const hasAdminPermissions = req.user.permissions.some(permission => 
      permission.includes('create') || permission.includes('delete') || permission === '*'
    );

    if (minimumRole !== 'CLIENT' && !hasAdminPermissions) {
      return res.status(403).json({ 
        message: `Minimum role required: ${minimumRole}`,
        note: 'Role hierarchy simplified with flat permissions'
      });
    }

    next();
  };
};

/**
 * Middleware for legacy permission compatibility
 */
export const requireLegacyPermission = (legacyPermission: keyof typeof RBAC_PERMISSIONS) => {
  const modernPermission = RBAC_PERMISSIONS[legacyPermission];
  return rbacGuard([modernPermission]);
};

/**
 * Helper function to check if user has specific permission (for use in route handlers)
 */
export const userHasPermission = (user: any, permission: string): boolean => {
  if (user.isSuperAdmin) {
    return true;
  }
  
  return user.permissions?.includes('*') || user.permissions?.includes(permission) || false;
};

/**
 * Helper function to get all user permissions (for debugging)
 */
export const getUserPermissions = (user: any): string[] => {
  if (user.isSuperAdmin) {
    return ['*']; // Indicates all permissions
  }
  
  return user.permissions || [];
};
