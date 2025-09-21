# Comprehensive Permission System Documentation

This document explains the new verb-based permission system implemented for the user authentication API.

## Overview

The permission system has been completely redesigned based on the role context matrix to provide granular, verb-based permissions across all system modules. The system supports 4 primary roles with hierarchical access levels.

## Architecture

### Files Structure
```
src/
├── config/
│   └── permissions.ts          # Core permission definitions and role mappings
├── middleware/
│   └── rbac.middleware.ts      # Enhanced RBAC middleware with permission validation
prisma/
├── seed.ts                     # Main seed with updated role permissions
└── seed-permissions.ts         # Dedicated permission seeding utility
```

## Permission Structure

### Permission Naming Convention
All permissions follow the format: `module:action`

Examples:
- `user:create` - Create users
- `transaction:encode` - Encode transactions
- `report:export_pdf` - Export reports as PDF
- `resource:access_assigned` - Access assigned resources only

### Permission Categories

1. **User Management** - User CRUD, role assignment
2. **Role Management** - Role CRUD, assignment/revocation
3. **Resource Management** - Resource access and assignment
4. **Transaction Management** - Transaction encoding, finalization
5. **Report Management** - Report generation, editing, exporting
6. **Submission Management** - Request approval workflows
7. **Document Management** - Document upload, editing, annotation
8. **Communication** - Notifications, comments, chat
9. **System Configuration** - System settings, tax configuration
10. **Audit & Logging** - Audit trail access, log viewing

## Role Hierarchy

```
SUPERADMIN (Level 4) - Full system access
    ↓
APPROVER (Level 3) - Approval workflows, review
    ↓
STAFF (Level 2) - Operational tasks, encoding
    ↓
CLIENT (Level 1) - Basic access, own data only
```

## Permission Matrix Summary

### SUPERADMIN
- **Total Permissions:** 76
- **Access Level:** Full system access
- **Key Capabilities:**
  - All user management functions
  - System configuration
  - All transaction operations
  - Complete audit access
  - Resource assignment

### APPROVER
- **Total Permissions:** 27
- **Access Level:** Assigned resources only
- **Key Capabilities:**
  - Approval workflows
  - Report review and export
  - Document annotation
  - Communication features
  - Limited audit access

### STAFF
- **Total Permissions:** 37
- **Access Level:** Assigned resources only
- **Key Capabilities:**
  - Transaction encoding/finalization
  - Report generation/editing
  - Document creation/editing
  - Communication features
  - Limited transaction rollback

### CLIENT
- **Total Permissions:** 24
- **Access Level:** Own data only
- **Key Capabilities:**
  - Draft transaction encoding
  - View-only reports
  - Upload own documents
  - Basic communication
  - View own audit trail

## Usage Examples

### Using Permissions in Middleware

```typescript
import { rbacGuard, requireMinimumRole } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/permissions';

// Single permission check
router.post('/users', 
  authGuard, 
  rbacGuard([PERMISSIONS.USER_CREATE]), 
  createUser
);

// Multiple permission check (OR logic)
router.get('/reports', 
  authGuard, 
  rbacGuard([PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_VIEW_ONLY]), 
  getReports
);

// Role-based access
router.put('/system/config', 
  authGuard, 
  requireMinimumRole('APPROVER'), 
  updateConfig
);

// Legacy permission compatibility
router.get('/permissions', 
  authGuard, 
  requireLegacyPermission('read_permissions'), 
  getPermissions
);
```

### Using Permissions in Route Handlers

```typescript
import { userHasPermission, getUserPermissions } from '../middleware/rbac.middleware';
import { PERMISSIONS } from '../config/permissions';

export const someController = async (req: Request, res: Response) => {
  // Check permission programmatically
  if (!userHasPermission(req.user, PERMISSIONS.TRANSACTION_MODIFY)) {
    return res.status(403).json({ message: 'Cannot modify transactions' });
  }

  // Get all user permissions for debugging
  const userPermissions = getUserPermissions(req.user);
  console.log('User permissions:', userPermissions);

  // Business logic here...
};
```

### Validating Permissions

```typescript
import { isValidPermission, hasPermission } from '../config/permissions';

// Validate permission exists
if (!isValidPermission('invalid:permission')) {
  console.error('Invalid permission');
}

// Check if role has permission
if (hasPermission('STAFF', PERMISSIONS.TRANSACTION_ENCODE)) {
  console.log('Staff can encode transactions');
}
```

## Database Seeding

### Main Seed (Complete Setup)
```bash
npx prisma db seed
```

### Permission-Only Seed
```bash
npx ts-node prisma/seed-permissions.ts
```

### Programmatic Seeding
```typescript
import { seedPermissions } from '../prisma/seed-permissions';

// Seed specific roles
await seedPermissions({
  roleNames: ['STAFF', 'CLIENT'],
  clearExisting: false,
  verbose: true
});

// Full reseed
await seedPermissions({
  clearExisting: true,
  verbose: true
});
```

## Migration from Legacy Permissions

The system includes backward compatibility through `RBAC_PERMISSIONS` mapping:

```typescript
// Legacy permission names are automatically mapped
export const RBAC_PERMISSIONS = {
  create_user: PERMISSIONS.USER_CREATE,
  read_users: PERMISSIONS.USER_READ,
  // ... other mappings
};
```

Existing code using legacy permissions will continue to work:
```typescript
// This still works
rbacGuard(['create_user'])

// But this is preferred
rbacGuard([PERMISSIONS.USER_CREATE])
```

## Permission Categories and Actions

### User Management
- `user:create`, `user:read`, `user:update`, `user:delete`
- `user:assign_roles`, `user:revoke_roles`
- `user:view_list`, `user:view_limited`

### Transaction Management
- `transaction:create`, `transaction:read`, `transaction:update`, `transaction:delete`
- `transaction:encode`, `transaction:encode_draft`, `transaction:finalize`
- `transaction:modify`, `transaction:rollback`, `transaction:rollback_limited`

### Report Management
- `report:create`, `report:read`, `report:update`, `report:delete`
- `report:generate`, `report:edit`, `report:review`, `report:view_only`
- `report:export_pdf`, `report:export_xls`, `report:export_json`
- `report:view_history`, `report:view_audit`, `report:view_own_history`

### Resource Access Control
- `resource:access_full` - All resources
- `resource:access_assigned` - Only assigned resources
- `resource:access_own` - Only own resources

## Debugging and Monitoring

### Permission Matrix Display
```bash
npx ts-node -e "
import { displayPermissionMatrix } from './prisma/seed-permissions';
displayPermissionMatrix(true);
"
```

### Permission Statistics
```typescript
import { getPermissionStats } from '../prisma/seed-permissions';

const stats = await getPermissionStats();
console.log('Total permissions:', stats.totalPermissions);
console.log('Role breakdown:', stats.roleStats);
```

### Validation
```typescript
import { validatePermissions } from '../prisma/seed-permissions';

// Validate all permission definitions
await validatePermissions(true);
```

## Best Practices

1. **Use Specific Permissions**: Prefer specific permissions over broad ones
   ```typescript
   // Good
   rbacGuard([PERMISSIONS.REPORT_EXPORT_PDF])
   
   // Less specific
   rbacGuard([PERMISSIONS.REPORT_READ])
   ```

2. **Group Related Operations**: Use multiple permissions for complex operations
   ```typescript
   rbacGuard([
     PERMISSIONS.TRANSACTION_CREATE,
     PERMISSIONS.TRANSACTION_ENCODE
   ])
   ```

3. **Resource-Specific Access**: Use `authorizeResource` for resource-scoped operations
   ```typescript
   router.put('/resources/:resourceId/transactions', 
     authGuard, 
     authorizeResource([PERMISSIONS.TRANSACTION_CREATE]), 
     createResourceTransaction
   );
   ```

4. **Role Hierarchies**: Use `requireMinimumRole` for role-based access
   ```typescript
   // Only APPROVER and above
   requireMinimumRole('APPROVER')
   ```

5. **Legacy Compatibility**: Gradually migrate from legacy permissions
   ```typescript
   // During migration period
   rbacGuard([PERMISSIONS.USER_CREATE, 'create_user'])
   ```

## Error Handling

The enhanced middleware provides detailed error responses:

```json
{
  "message": "Insufficient permissions",
  "required": ["user:create"],
  "user_permissions": ["user:read", "user:view_limited"]
}
```

Resource-specific errors include context:
```json
{
  "message": "Insufficient permissions for this resource", 
  "resource": "resource-123",
  "required": ["transaction:create"],
  "user_permissions": ["transaction:read"]
}
```

## Performance Considerations

1. **Permission Caching**: User permissions are loaded with the user object
2. **Validation**: Permissions are validated at startup and during seeding
3. **Efficient Checks**: Multiple permissions use OR logic for flexibility
4. **SuperAdmin Bypass**: SuperAdmin checks are optimized for performance

## Security Features

1. **Permission Validation**: All required permissions are validated against the master list
2. **Detailed Logging**: Permission failures include context for debugging
3. **Resource Isolation**: Resource-specific permissions prevent cross-resource access
4. **Role Hierarchy**: Prevents privilege escalation through role validation
5. **Legacy Support**: Backward compatibility doesn't compromise security

## Conclusion

This comprehensive permission system provides:
- ✅ Granular, verb-based permissions
- ✅ Role-based access control with hierarchy
- ✅ Resource-specific authorization
- ✅ Backward compatibility
- ✅ Comprehensive debugging tools
- ✅ Scalable architecture

The system is ready for production use and can be extended as new modules and permissions are needed.