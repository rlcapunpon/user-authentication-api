# Resources API Endpoints Summary

This document lists all endpoints tagged with "Resources" in the User Authentication API.

## **Resources Endpoints (Tag: Resources)**

### 1. **GET /api/resources**
- **Summary**: Get resources accessible to the authenticated user
- **Description**: Retrieve all resources that the authenticated user has access to based on their assigned roles and permissions. Super admins see all resources, while regular users only see resources they have been granted access to.
- **Authentication**: Required (Bearer Token)
- **Status**: ✅ Documented in OpenAPI

### 2. **GET /api/resources/v2**
- **Summary**: Get resources accessible to the authenticated user (paginated)
- **Description**: Retrieve paginated resources with filtering options
- **Authentication**: Required (Bearer Token)
- **Query Parameters**: 
  - `page` (integer, min: 1, default: 1) - Page number
  - `limit` (integer, min: 1, max: 100, default: 10) - Items per page
  - `resourceName` (string) - Filter by name (case-insensitive partial match)
  - `resourceId` (string) - Filter by exact resource ID
  - `q` (string) - General search query for name or ID
- **Status**: ✅ Documented in OpenAPI

### 3. **POST /api/resources**
- **Summary**: Create a new resource
- **Authentication**: Required (Bearer Token) + `resource:create` permission
- **Request Body**: `CreateResourceRequest` schema
- **Status**: ✅ Documented in OpenAPI

### 4. **POST /api/resources/roles**
- **Summary**: Create a role for a resource
- **Authentication**: Required (Bearer Token) + `role:create` permission
- **Request Body**: `CreateResourceRole` schema
- **Status**: ✅ Documented in OpenAPI

### 5. **POST /api/resources/assign-role**
- **Summary**: Assign a user to a resource role
- **Authentication**: Required (Bearer Token) + `role:assign` permission
- **Request Body**: `AssignUserResourceRole` schema
- **Status**: ✅ Documented in OpenAPI

### 6. **POST /api/resources/revoke-role**
- **Summary**: Revoke a user's resource role
- **Authentication**: Required (Bearer Token) + `role:assign` permission
- **Request Body**: `RevokeUserResourceRole` schema
- **Status**: ✅ Documented in OpenAPI

### 7. **GET /api/resources/{resourceId}/test-read**
- **Summary**: Test endpoint for read permission authorization
- **Description**: Test endpoint to verify that the authorizeResource middleware works for read permissions
- **Authentication**: Required (Bearer Token) + read permission on resource
- **Path Parameters**: `resourceId` (string) - The unique identifier of the resource
- **Status**: ✅ Documented in OpenAPI

### 8. **POST /api/resources/{resourceId}/test-write**
- **Summary**: Test endpoint for write permission authorization
- **Description**: Test endpoint to verify that the authorizeResource middleware works for write/update permissions
- **Authentication**: Required (Bearer Token) + write/update permission on resource
- **Path Parameters**: `resourceId` (string) - The unique identifier of the resource
- **Status**: ✅ Documented in OpenAPI

### 9. **GET /api/resources/{resourceId}/user-role**
- **Summary**: Get the role of the authenticated user for a specific resource
- **Description**: Retrieve the role assigned to the currently authenticated user for a specific resource
- **Authentication**: Required (Bearer Token)
- **Path Parameters**: `resourceId` (string) - The unique identifier of the resource
- **Response**: `UserResourceRoleResponse` schema
- **Status**: ✅ Documented in OpenAPI

### 10. **GET /api/resources/{userId}**
- **Summary**: Get all resources and roles assigned to a specific user
- **Description**: Retrieve all resources and their corresponding roles assigned to a user. Super admins can access any user's data, while regular users can only access their own data.
- **Authentication**: Required (Bearer Token)
- **Path Parameters**: `userId` (string, UUID) - The unique identifier of the user
- **Response**: Array of `UserResourceRoleAssignment`
- **Status**: ✅ Documented in OpenAPI

### 11. **POST /api/resources/user-roles** ⭐ **NEW**
- **Summary**: Get resource roles for authenticated user given a list of resourceIds
- **Description**: Retrieve the roles assigned to the currently authenticated user for a list of specified resources. Regular users only see roles for resources they have access to, while super admins see all requested resource roles.
- **Authentication**: Required (Bearer Token)
- **Method**: POST (due to request body requirements)
- **Request Body**: `GetResourceRolesRequest` schema (array of resource IDs)
- **Response**: `GetResourceRolesResponse` schema
- **Validation**: 
  - Resources array is required and must contain at least one resource ID
  - Each resource ID must be a non-empty string
- **Authorization**: 
  - Regular users: Returns only roles for accessible resources
  - Super admins: Returns all requested resource roles
- **Status**: ✅ Documented in OpenAPI & Fully Implemented
- **Implementation Details**: 
  - Path: `/api/resources/user-roles` (consistent with resources namespace)
  - All 10 test cases pass including authentication, authorization, and validation scenarios

## **Schema References Used**

All schemas are properly defined in the OpenAPI components section:

- `CreateResourceRequest` - For creating new resources
- `CreateResourceRole` - For creating resource roles
- `AssignUserResourceRole` - For role assignments
- `RevokeUserResourceRole` - For role revocations
- `UserResourceRoleResponse` - User role response format
- `UserResourceRoleAssignment` - Resource-role assignment format
- `GetResourceRolesRequest` - Request format for getting resource roles
- `GetResourceRolesResponse` - Response format with resource roles
- `ResourceRoleAssignment` - Individual resource-role assignment
- `PaginatedResourcesResponse` - Paginated response format

## **Documentation Status**: ✅ **COMPLETE**

All 11 Resources endpoints are now properly documented in the OpenAPI specification and visible in the Swagger UI at `/docs`.

### **Key Fixes Applied**:
1. ✅ Changed tag from `[Resource]` to `[Resources]` for consistency
2. ✅ Added all missing endpoints to OpenAPI yaml file
3. ✅ Updated schemas to include missing `roleId` and `permissions` fields
4. ✅ Verified all endpoints use correct `Resources` tag
5. ✅ Ensured proper schema references for request/response bodies