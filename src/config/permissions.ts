/**
 * Comprehensive Permission System
 * Based on role_context.txt verb-based permission matrix
 */

// =====================================================
// CORE PERMISSION DEFINITIONS
// =====================================================

export const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLES: 'user:assign_roles',
  USER_REVOKE_ROLES: 'user:revoke_roles',
  USER_VIEW_LIST: 'user:view_list',
  USER_VIEW_LIMITED: 'user:view_limited', // team only
  
  // Role Management
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',
  ROLE_REVOKE: 'role:revoke',
  
  // Resource Management
  RESOURCE_CREATE: 'resource:create',
  RESOURCE_READ: 'resource:read',
  RESOURCE_UPDATE: 'resource:update',
  RESOURCE_DELETE: 'resource:delete',
  RESOURCE_ACCESS_FULL: 'resource:access_full',
  RESOURCE_ACCESS_ASSIGNED: 'resource:access_assigned',
  RESOURCE_ACCESS_OWN: 'resource:access_own',
  RESOURCE_ASSIGN_STAFF: 'resource:assign_staff',
  RESOURCE_ASSIGN_APPROVER: 'resource:assign_approver',
  
  // Transaction Management
  TRANSACTION_CREATE: 'transaction:create',
  TRANSACTION_READ: 'transaction:read',
  TRANSACTION_UPDATE: 'transaction:update',
  TRANSACTION_DELETE: 'transaction:delete',
  TRANSACTION_ENCODE: 'transaction:encode',
  TRANSACTION_ENCODE_DRAFT: 'transaction:encode_draft',
  TRANSACTION_FINALIZE: 'transaction:finalize',
  TRANSACTION_MODIFY: 'transaction:modify',
  TRANSACTION_ROLLBACK: 'transaction:rollback',
  TRANSACTION_ROLLBACK_LIMITED: 'transaction:rollback_limited',
  
  // Report Management
  REPORT_CREATE: 'report:create',
  REPORT_READ: 'report:read',
  REPORT_UPDATE: 'report:update',
  REPORT_DELETE: 'report:delete',
  REPORT_GENERATE: 'report:generate',
  REPORT_EDIT: 'report:edit',
  REPORT_REVIEW: 'report:review',
  REPORT_VIEW_ONLY: 'report:view_only',
  REPORT_EXPORT_PDF: 'report:export_pdf',
  REPORT_EXPORT_XLS: 'report:export_xls',
  REPORT_EXPORT_JSON: 'report:export_json',
  REPORT_VIEW_HISTORY: 'report:view_history',
  REPORT_VIEW_AUDIT: 'report:view_audit',
  REPORT_VIEW_OWN_HISTORY: 'report:view_own_history',
  
  // Submission Management
  SUBMISSION_CREATE: 'submission:create',
  SUBMISSION_READ: 'submission:read',
  SUBMISSION_UPDATE: 'submission:update',
  SUBMISSION_DELETE: 'submission:delete',
  SUBMISSION_APPROVE: 'submission:approve',
  SUBMISSION_SUBMIT: 'submission:submit',
  SUBMISSION_SUBMIT_AFTER_APPROVAL: 'submission:submit_after_approval',
  SUBMISSION_VIEW_STATUS: 'submission:view_status',
  SUBMISSION_VIEW_OWN_STATUS: 'submission:view_own_status',
  
  // Document Management
  DOCUMENT_CREATE: 'document:create',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_UPLOAD_OWN: 'document:upload_own',
  DOCUMENT_GENERATE: 'document:generate',
  DOCUMENT_EDIT_DRAFTS: 'document:edit_drafts',
  DOCUMENT_VIEW_ONLY: 'document:view_only',
  DOCUMENT_ANNOTATE: 'document:annotate',
  DOCUMENT_FLAG_ISSUES: 'document:flag_issues',
  
  // Communication & Notifications
  NOTIFICATION_CREATE: 'notification:create',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_UPDATE: 'notification:update',
  NOTIFICATION_DELETE: 'notification:delete',
  NOTIFICATION_VIEW_SYSTEM: 'notification:view_system',
  COMMENT_CREATE: 'comment:create',
  COMMENT_READ: 'comment:read',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_TAG_USERS: 'comment:tag_users',
  COMMENT_VIEW_THREAD: 'comment:view_thread',
  CHAT_PARTICIPATE: 'chat:participate',
  
  // System Configuration
  SYSTEM_CONFIGURE: 'system:configure',
  SYSTEM_READ_CONFIG: 'system:read_config',
  SYSTEM_UPDATE_CONFIG: 'system:update_config',
  TAX_CONFIGURE: 'tax:configure',
  FISCAL_CONFIGURE: 'fiscal:configure',
  FEATURE_TOGGLE: 'feature:toggle',
  INTEGRATION_CONFIGURE: 'integration:configure',
  
  // Audit & Logging
  AUDIT_READ: 'audit:read',
  AUDIT_READ_ASSIGNED: 'audit:read_assigned',
  AUDIT_READ_OWN: 'audit:read_own',
  LOG_READ: 'log:read',
  LOG_READ_ASSIGNED: 'log:read_assigned',
  LOG_READ_OWN: 'log:read_own',
  
  // Permission Management
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_READ: 'permission:read',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
  
  // General Access Permissions
  ACCESS_FULL: 'access:full',
  ACCESS_LIMITED: 'access:limited',
  ACCESS_OWN_ONLY: 'access:own_only',
  ACCESS_TEAM_ONLY: 'access:team_only',
} as const;

// =====================================================
// ROLE-BASED PERMISSION MAPPINGS
// =====================================================

export const ROLE_PERMISSIONS = {
  SUPERADMIN: [
    // Full system access
    PERMISSIONS.ACCESS_FULL,
    
    // User Management - Full access
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_ASSIGN_ROLES,
    PERMISSIONS.USER_REVOKE_ROLES,
    PERMISSIONS.USER_VIEW_LIST,
    
    // Role Management - Full access
    PERMISSIONS.ROLE_CREATE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.ROLE_UPDATE,
    PERMISSIONS.ROLE_DELETE,
    PERMISSIONS.ROLE_ASSIGN,
    PERMISSIONS.ROLE_REVOKE,
    
    // Resource Management - Full access
    PERMISSIONS.RESOURCE_CREATE,
    PERMISSIONS.RESOURCE_READ,
    PERMISSIONS.RESOURCE_UPDATE,
    PERMISSIONS.RESOURCE_DELETE,
    PERMISSIONS.RESOURCE_ACCESS_FULL,
    PERMISSIONS.RESOURCE_ASSIGN_STAFF,
    PERMISSIONS.RESOURCE_ASSIGN_APPROVER,
    
    // Transaction Management - Full access
    PERMISSIONS.TRANSACTION_CREATE,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_UPDATE,
    PERMISSIONS.TRANSACTION_DELETE,
    PERMISSIONS.TRANSACTION_ENCODE,
    PERMISSIONS.TRANSACTION_FINALIZE,
    PERMISSIONS.TRANSACTION_MODIFY,
    PERMISSIONS.TRANSACTION_ROLLBACK,
    
    // Report Management - Full access
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_DELETE,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.REPORT_EDIT,
    PERMISSIONS.REPORT_EXPORT_PDF,
    PERMISSIONS.REPORT_EXPORT_XLS,
    PERMISSIONS.REPORT_EXPORT_JSON,
    PERMISSIONS.REPORT_VIEW_HISTORY,
    PERMISSIONS.REPORT_VIEW_AUDIT,
    
    // Submission Management - Full access
    PERMISSIONS.SUBMISSION_CREATE,
    PERMISSIONS.SUBMISSION_READ,
    PERMISSIONS.SUBMISSION_UPDATE,
    PERMISSIONS.SUBMISSION_DELETE,
    PERMISSIONS.SUBMISSION_APPROVE,
    PERMISSIONS.SUBMISSION_SUBMIT,
    PERMISSIONS.SUBMISSION_VIEW_STATUS,
    
    // Document Management - Full access
    PERMISSIONS.DOCUMENT_CREATE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_GENERATE,
    PERMISSIONS.DOCUMENT_ANNOTATE,
    PERMISSIONS.DOCUMENT_FLAG_ISSUES,
    
    // Communication - Full access
    PERMISSIONS.NOTIFICATION_CREATE,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_VIEW_SYSTEM,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_TAG_USERS,
    PERMISSIONS.COMMENT_VIEW_THREAD,
    PERMISSIONS.CHAT_PARTICIPATE,
    
    // System Configuration - Full access
    PERMISSIONS.SYSTEM_CONFIGURE,
    PERMISSIONS.SYSTEM_READ_CONFIG,
    PERMISSIONS.SYSTEM_UPDATE_CONFIG,
    PERMISSIONS.TAX_CONFIGURE,
    PERMISSIONS.FISCAL_CONFIGURE,
    PERMISSIONS.FEATURE_TOGGLE,
    PERMISSIONS.INTEGRATION_CONFIGURE,
    
    // Audit & Logging - Full access
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.LOG_READ,
    
    // Permission Management - Full access
    PERMISSIONS.PERMISSION_CREATE,
    PERMISSIONS.PERMISSION_READ,
    PERMISSIONS.PERMISSION_UPDATE,
    PERMISSIONS.PERMISSION_DELETE,
  ],
  
  APPROVER: [
    // Resource access - assigned only
    PERMISSIONS.RESOURCE_ACCESS_ASSIGNED,
    
    // User Management - limited (team only)
    PERMISSIONS.USER_VIEW_LIMITED,
    
    // Report Management - review only
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_REVIEW,
    PERMISSIONS.REPORT_EXPORT_PDF,
    PERMISSIONS.REPORT_EXPORT_XLS,
    PERMISSIONS.REPORT_EXPORT_JSON,
    PERMISSIONS.REPORT_VIEW_HISTORY,
    PERMISSIONS.REPORT_VIEW_AUDIT,
    
    // Submission Management - approve only
    PERMISSIONS.SUBMISSION_READ,
    PERMISSIONS.SUBMISSION_APPROVE,
    PERMISSIONS.SUBMISSION_SUBMIT_AFTER_APPROVAL,
    PERMISSIONS.SUBMISSION_VIEW_STATUS,
    
    // Document Management - view only
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_VIEW_ONLY,
    PERMISSIONS.DOCUMENT_ANNOTATE,
    PERMISSIONS.DOCUMENT_FLAG_ISSUES,
    
    // Communication
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_VIEW_SYSTEM,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_TAG_USERS,
    PERMISSIONS.COMMENT_VIEW_THREAD,
    PERMISSIONS.CHAT_PARTICIPATE,
    
    // Audit - assigned resources only
    PERMISSIONS.AUDIT_READ_ASSIGNED,
    PERMISSIONS.LOG_READ_ASSIGNED,
    
    // Basic permissions
    PERMISSIONS.PERMISSION_READ,
  ],
  
  STAFF: [
    // Resource access - assigned only
    PERMISSIONS.RESOURCE_ACCESS_ASSIGNED,
    
    // User Management - limited
    PERMISSIONS.USER_VIEW_LIMITED,
    
    // Transaction Management - encode and finalize
    PERMISSIONS.TRANSACTION_CREATE,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_ENCODE,
    PERMISSIONS.TRANSACTION_FINALIZE,
    PERMISSIONS.TRANSACTION_MODIFY,
    PERMISSIONS.TRANSACTION_ROLLBACK_LIMITED,
    
    // Report Management - generate and edit
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.REPORT_EDIT,
    PERMISSIONS.REPORT_EXPORT_PDF,
    PERMISSIONS.REPORT_EXPORT_XLS,
    PERMISSIONS.REPORT_EXPORT_JSON,
    PERMISSIONS.REPORT_VIEW_HISTORY,
    PERMISSIONS.REPORT_VIEW_AUDIT,
    
    // Submission Management - create only
    PERMISSIONS.SUBMISSION_CREATE,
    PERMISSIONS.SUBMISSION_READ,
    PERMISSIONS.SUBMISSION_VIEW_STATUS,
    
    // Document Management - generate/edit drafts
    PERMISSIONS.DOCUMENT_CREATE,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_GENERATE,
    PERMISSIONS.DOCUMENT_EDIT_DRAFTS,
    PERMISSIONS.DOCUMENT_ANNOTATE,
    PERMISSIONS.DOCUMENT_FLAG_ISSUES,
    
    // Communication
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_VIEW_SYSTEM,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_TAG_USERS,
    PERMISSIONS.COMMENT_VIEW_THREAD,
    PERMISSIONS.CHAT_PARTICIPATE,
    
    // Audit - assigned resources only
    PERMISSIONS.AUDIT_READ_ASSIGNED,
    PERMISSIONS.LOG_READ_ASSIGNED,
    
    // Basic permissions
    PERMISSIONS.PERMISSION_READ,
  ],
  
  CLIENT: [
    // Resource access - own only
    PERMISSIONS.RESOURCE_ACCESS_OWN,
    
    // Transaction Management - encode draft only
    PERMISSIONS.TRANSACTION_ENCODE_DRAFT,
    PERMISSIONS.TRANSACTION_READ, // own drafts only
    
    // Report Management - view only
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_VIEW_ONLY,
    PERMISSIONS.REPORT_EXPORT_PDF,
    PERMISSIONS.REPORT_EXPORT_XLS,
    PERMISSIONS.REPORT_EXPORT_JSON,
    PERMISSIONS.REPORT_VIEW_OWN_HISTORY,
    
    // Submission Management - view own status
    PERMISSIONS.SUBMISSION_READ,
    PERMISSIONS.SUBMISSION_VIEW_OWN_STATUS,
    
    // Document Management - view only, upload own
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_VIEW_ONLY,
    PERMISSIONS.DOCUMENT_UPLOAD_OWN,
    
    // Communication
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTIFICATION_VIEW_SYSTEM,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.COMMENT_TAG_USERS,
    PERMISSIONS.COMMENT_VIEW_THREAD,
    PERMISSIONS.CHAT_PARTICIPATE,
    
    // Audit - own only
    PERMISSIONS.AUDIT_READ_OWN,
    PERMISSIONS.LOG_READ_OWN,
    
    // Basic permissions
    PERMISSIONS.PERMISSION_READ,
  ],
} as const;

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(role: keyof typeof ROLE_PERMISSIONS): readonly string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: keyof typeof ROLE_PERMISSIONS, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission as any);
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): string[] {
  return Object.values(PERMISSIONS);
}

/**
 * Get permissions by category
 */
export function getPermissionsByCategory(category: string): string[] {
  return Object.values(PERMISSIONS).filter(permission => permission.startsWith(`${category}:`));
}

/**
 * Validate permission format
 */
export function isValidPermission(permission: string): boolean {
  return Object.values(PERMISSIONS).includes(permission as any);
}

/**
 * Get role hierarchy (for inheritance)
 */
export const ROLE_HIERARCHY = {
  SUPERADMIN: 4,
  APPROVER: 3,
  STAFF: 2,
  CLIENT: 1,
} as const;

/**
 * Check if role A has higher or equal hierarchy than role B
 */
export function hasHigherOrEqualRole(roleA: keyof typeof ROLE_HIERARCHY, roleB: keyof typeof ROLE_HIERARCHY): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

// =====================================================
// PERMISSION CONSTANTS FOR MIDDLEWARE
// =====================================================

export const RBAC_PERMISSIONS = {
  // Legacy compatibility with existing middleware
  create_user: PERMISSIONS.USER_CREATE,
  read_users: PERMISSIONS.USER_READ,
  update_users: PERMISSIONS.USER_UPDATE,
  delete_user: PERMISSIONS.USER_DELETE,
  read_roles: PERMISSIONS.ROLE_READ,
  create_role: PERMISSIONS.ROLE_CREATE,
  read_resources: PERMISSIONS.RESOURCE_READ,
  create_resource: PERMISSIONS.RESOURCE_CREATE,
  read_permissions: PERMISSIONS.PERMISSION_READ,
  manage_resource_roles: PERMISSIONS.ROLE_ASSIGN,
  approve_requests: PERMISSIONS.SUBMISSION_APPROVE,
  manage_staff: PERMISSIONS.USER_ASSIGN_ROLES,
  manage_clients: PERMISSIONS.USER_ASSIGN_ROLES,
} as const;

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
  getAllPermissions,
  getPermissionsByCategory,
  isValidPermission,
  ROLE_HIERARCHY,
  hasHigherOrEqualRole,
  RBAC_PERMISSIONS,
};