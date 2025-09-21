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

    // Collect all permissions from all resource roles
    const allUserPermissions = req.user.resourceRoles.flatMap(role => role.permissions);

    // Check if user has any of the required permissions
    const hasRequiredPermission = requiredPermissions.some(permission => 
      allUserPermissions.includes(permission)
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

    try {
      // Find the user's role for this specific resource
      const resourceRole = req.user.resourceRoles.find(role => 
        role.resourceId === resourceId
      );

      // If user has no role for this resource, deny access
      if (!resourceRole) {
        return res.status(403).json({ 
          message: 'Insufficient permissions for this resource',
          resource: resourceId,
          required: requiredPermissions
        });
      }

      // Check if user has any of the required permissions for this resource
      const hasRequiredPermission = requiredPermissions.some(permission => 
        resourceRole.permissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          message: 'Insufficient permissions for this resource',
          resource: resourceId,
          required: requiredPermissions,
          user_permissions: resourceRole.permissions
        });
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

/**
 * Middleware that checks if user has a minimum role level
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

    // Get user's highest role
    const userRoles = req.user.resourceRoles.map(role => role.roleName);
    const userHighestRole = userRoles.reduce((highest, current) => {
      if (current in ROLE_HIERARCHY && highest in ROLE_HIERARCHY) {
        return ROLE_HIERARCHY[current as keyof typeof ROLE_HIERARCHY] > ROLE_HIERARCHY[highest as keyof typeof ROLE_HIERARCHY] 
          ? current : highest;
      }
      return highest;
    }, 'CLIENT');

    if (!hasHigherOrEqualRole(userHighestRole as keyof typeof ROLE_HIERARCHY, minimumRole)) {
      return res.status(403).json({ 
        message: `Minimum role required: ${minimumRole}`,
        user_role: userHighestRole
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
  
  const allUserPermissions = user.resourceRoles.flatMap((role: any) => role.permissions);
  return allUserPermissions.includes(permission);
};

/**
 * Helper function to get all user permissions (for debugging)
 */
export const getUserPermissions = (user: any): string[] => {
  if (user.isSuperAdmin) {
    return ['*']; // Indicates all permissions
  }
  
  return user.resourceRoles.flatMap((role: any) => role.permissions);
};
