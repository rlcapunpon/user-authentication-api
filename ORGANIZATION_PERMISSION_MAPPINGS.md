# Organization Permission Mappings

## Overview

This document outlines the organization-related permission mappings defined in the seed files, including resource access controls and tax/fiscal obligation permissions. The permission system implements role-based access control (RBAC) with hierarchical permissions for different organizational contexts.

## 🏢 Organization Resources in Seed Data

The seed file creates the following organization-like resources:

```typescript
const resources = [
  {
    name: 'HR_DEPARTMENT',
    description: 'Human Resources Department',
  },
  {
    name: 'IT_DEPARTMENT',
    description: 'Information Technology Department',
  },
  {
    name: 'FINANCE_DEPARTMENT',
    description: 'Finance and Accounting Department',
  },
  {
    name: 'MARKETING_DEPARTMENT',
    description: 'Marketing and Sales Department',
  },
  {
    name: 'PROJECT_ALPHA',
    description: 'Alpha Project - Main product development',
  },
  {
    name: 'PROJECT_BETA',
    description: 'Beta Project - Research and development',
  },
];
```

## 🔐 Organization-Related Permissions

### Core Resource Permissions

```typescript
// Resource Management Permissions
RESOURCE_CREATE: 'resource:create',
RESOURCE_READ: 'resource:read',
RESOURCE_UPDATE: 'resource:update',
RESOURCE_DELETE: 'resource:delete',
RESOURCE_ACCESS_FULL: 'resource:access_full',
RESOURCE_ACCESS_ASSIGNED: 'resource:access_assigned',
RESOURCE_ACCESS_OWN: 'resource:access_own',
RESOURCE_ASSIGN_STAFF: 'resource:assign_staff',
RESOURCE_ASSIGN_APPROVER: 'resource:assign_approver',
```

### Tax and Fiscal Obligation Permissions

```typescript
// Tax Configuration Permissions
TAX_CONFIGURE: 'tax:configure',
FISCAL_CONFIGURE: 'fiscal:configure',
```

## 👥 Role-Based Permission Mappings

### SUPERADMIN Role Permissions

**Organization Access:**
- `RESOURCE_ACCESS_FULL` - Complete access to all organizations/resources
- `RESOURCE_CREATE` - Create new organizations/resources
- `RESOURCE_READ` - Read all organizations/resources
- `RESOURCE_UPDATE` - Update all organizations/resources
- `RESOURCE_DELETE` - Delete organizations/resources
- `RESOURCE_ASSIGN_STAFF` - Assign staff to organizations
- `RESOURCE_ASSIGN_APPROVER` - Assign approvers to organizations

**Tax/Fiscal Permissions:**
- `TAX_CONFIGURE` - Configure tax settings and obligations
- `FISCAL_CONFIGURE` - Configure fiscal year settings

**Assigned Organizations:** ALL organizations (global access)

---

### APPROVER Role Permissions

**Organization Access:**
- `RESOURCE_ACCESS_ASSIGNED` - Access only to assigned organizations

**Tax/Fiscal Permissions:** None

**Assigned Organizations:**
- HR_DEPARTMENT
- FINANCE_DEPARTMENT
- MARKETING_DEPARTMENT

---

### STAFF Role Permissions

**Organization Access:**
- `RESOURCE_ACCESS_ASSIGNED` - Access only to assigned organizations

**Tax/Fiscal Permissions:** None

**Assigned Organizations:**
- IT_DEPARTMENT
- PROJECT_ALPHA
- PROJECT_BETA

---

### CLIENT Role Permissions

**Organization Access:**
- `RESOURCE_ACCESS_OWN` - Access only to own organizations

**Tax/Fiscal Permissions:** None

**Assigned Organizations:**
- MARKETING_DEPARTMENT
- PROJECT_ALPHA

## 📊 Permission Matrix

| Permission | SUPERADMIN | APPROVER | STAFF | CLIENT |
|------------|------------|----------|-------|--------|
| `resource:create` | ✅ | ❌ | ❌ | ❌ |
| `resource:read` | ✅ | ✅ (assigned) | ✅ (assigned) | ✅ (own) |
| `resource:update` | ✅ | ❌ | ❌ | ❌ |
| `resource:delete` | ✅ | ❌ | ❌ | ❌ |
| `resource:access_full` | ✅ | ❌ | ❌ | ❌ |
| `resource:access_assigned` | ✅ | ✅ | ✅ | ❌ |
| `resource:access_own` | ✅ | ❌ | ❌ | ✅ |
| `resource:assign_staff` | ✅ | ❌ | ❌ | ❌ |
| `resource:assign_approver` | ✅ | ❌ | ❌ | ❌ |
| `tax:configure` | ✅ | ❌ | ❌ | ❌ |
| `fiscal:configure` | ✅ | ❌ | ❌ | ❌ |

## 🏛️ Tax Obligation Scheduling Context

### Tax Configuration Permissions

The `TAX_CONFIGURE` permission allows users to:
- Set up tax obligation schedules for organizations
- Configure tax filing deadlines
- Define tax compliance requirements
- Manage tax-related workflows and approvals

### Fiscal Configuration Permissions

The `FISCAL_CONFIGURE` permission enables:
- Fiscal year setup and management
- Financial reporting period configuration
- Budget cycle definitions
- Accounting period controls

### Organization-Specific Tax Permissions

While the current seed data doesn't include specific tax obligation permissions per organization, the system is designed to support:

```typescript
// Potential future tax obligation permissions
TAX_OBLIGATION_CREATE: 'tax_obligation:create',
TAX_OBLIGATION_READ: 'tax_obligation:read',
TAX_OBLIGATION_UPDATE: 'tax_obligation:update',
TAX_OBLIGATION_SCHEDULE: 'tax_obligation:schedule',
TAX_FILING_MANAGE: 'tax_filing:manage',
TAX_COMPLIANCE_MONITOR: 'tax_compliance:monitor',
```

## 🔄 User-Organization Relationships

### Seed Data User Assignments

```typescript
// Super Admin - Full Access
superadmin@example.com:
  - Global Role: SUPERADMIN
  - Resource Roles: All roles for all resources

// Approver - Department Oversight
approver@example.com:
  - Global Role: APPROVER
  - Resource Roles: APPROVER for [HR, Finance, Marketing]

// Staff - Operational Access
staff@example.com:
  - Global Role: STAFF
  - Resource Roles: STAFF for [IT, Project Alpha, Project Beta]

// Client - Limited Access
client@example.com:
  - Global Role: CLIENT
  - Resource Roles: CLIENT for [Marketing, Project Alpha]
```

## 🏗️ Permission Inheritance Model

### Role Hierarchy
```typescript
const ROLE_HIERARCHY = {
  SUPERADMIN: 4,  // Highest level
  APPROVER: 3,    // Department management
  STAFF: 2,       // Operational level
  CLIENT: 1,      // Limited access
};
```

### Permission Inheritance Rules
- Higher-level roles inherit permissions from lower-level roles
- Resource-specific permissions override global permissions
- Tax configuration requires SUPERADMIN level access

## 🔍 Permission Validation Logic

### Organization Access Check
```typescript
function checkOrganizationAccess(userId, organizationId, action) {
  // 1. Check if user is Super Admin (full access)
  if (user.isSuperAdmin) {
    return PERMISSIONS.RESOURCE_ACCESS_FULL;
  }

  // 2. Check resource-specific roles
  const userRoles = getUserResourceRoles(userId, organizationId);

  // 3. Validate action against role permissions
  return validateActionPermissions(userRoles, action);
}
```

### Tax Obligation Access Check
```typescript
function checkTaxObligationAccess(userId, organizationId, taxType) {
  // Only Super Admin can configure tax obligations
  if (!user.isSuperAdmin) {
    return false;
  }

  // Check organization access
  const orgAccess = checkOrganizationAccess(userId, organizationId, 'read');
  if (!orgAccess) {
    return false;
  }

  return PERMISSIONS.TAX_CONFIGURE;
}
```

## 📋 API Integration Examples

### Get User Organization Permissions
```http
POST /api/rbac/permissions/check
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "resourceType": "organization",
  "action": "read"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "userRoles": [
      {
        "id": "role-123",
        "name": "APPROVER",
        "resourceType": "organization",
        "resourceId": "org-hr-456"
      }
    ],
    "accessibleResources": [
      {
        "resourceType": "organization",
        "resourceId": "org-hr-456",
        "permissions": ["read", "update"]
      }
    ]
  }
}
```

## 🔧 Configuration Notes

### Extending Tax Permissions
To add tax obligation scheduling permissions:

1. **Add new permissions** to `PERMISSIONS` object:
```typescript
TAX_OBLIGATION_SCHEDULE: 'tax_obligation:schedule',
TAX_OBLIGATION_MANAGE: 'tax_obligation:manage',
```

2. **Assign to roles** in `ROLE_PERMISSIONS`:
```typescript
APPROVER: [
  // ... existing permissions
  PERMISSIONS.TAX_OBLIGATION_SCHEDULE,
],
```

3. **Update seed data** to assign tax-related roles to organizations.

### Organization-Specific Tax Roles
Future enhancements could include organization-specific tax roles:
- Tax Preparer
- Tax Reviewer
- Compliance Officer
- Audit Manager

## 📈 Monitoring and Audit

### Permission Audit Trail
- Track all permission checks
- Log organization access attempts
- Monitor tax configuration changes
- Audit role assignments

### Performance Considerations
- Cache frequently accessed permissions
- Implement permission batch checking
- Use database indexes on role-resource mappings

---

## Conclusion

The organization permission mappings provide a flexible RBAC system that supports:
- Hierarchical access control
- Resource-specific permissions
- Tax and fiscal configuration management
- Scalable role assignments
- Audit and compliance tracking

The current seed data establishes a foundation for organizational access control, with Super Admin having full access, while other roles have graduated permissions based on their organizational responsibilities.</content>
<parameter name="filePath">c:\Users\Raenerys\Documents\Windbooks\user-authentication-api\ORGANIZATION_PERMISSION_MAPPINGS.md