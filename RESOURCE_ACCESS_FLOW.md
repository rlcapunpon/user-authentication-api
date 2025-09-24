# Resource Access Flow Documentation

## Overview

This document describes the authentication and authorization flow between the **user-authentication-api** and **org-mgmt-api** services for resource access management. The flow ensures that users can only access organizations/resources they have appropriate roles and permissions for.

## Architecture Diagram

```
┌─────────────┐    JWT Token    ┌─────────────────┐    Resource Check    ┌─────────────────────┐
│   Client    │ ──────────────► │   org-mgmt-api  │ ──────────────────► │ user-authentication │
│ Application │                 │                 │                     │       -api          │
└─────────────┘                 └─────────────────┘                     └─────────────────────┘
                                        │                                         │
                                        │         Organization List              │
                                        │ ◄─────────────────────────────────────── │
                                        │                                         │
                                        ▼                                         │
                                ┌─────────────────┐                              │
                                │   Filtered      │                              │
                                │ Organizations   │                              │
                                │   Response      │                              │
                                └─────────────────┘                              │
```

## Service Flow Description

### Step 1: User Authentication
User authenticates with the user-authentication-api and receives a JWT token containing role information.

### Step 2: Resource Request
User makes a request to org-mgmt-api using the JWT token to get accessible resources/organizations.

### Step 3: Resource Authorization Check
If the user is not a Super Admin, org-mgmt-api calls user-authentication-api to verify which resources the user has access to.

### Step 4: Filtered Response
org-mgmt-api returns only the organizations/resources that the user is authorized to access.

---

## API Endpoints and Flow

### 1. User Authentication (user-authentication-api)

#### Login Request
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userPassword123"
}
```

#### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "isSuperAdmin": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### JWT Token Payload Structure
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "Manager",
  "permissions": ["read:organization", "write:reports"],
  "iat": 1695648000,
  "exp": 1695651600
}
```

### 2. Get User Resources (org-mgmt-api)

#### Request to org-mgmt-api
```http
GET /api/organizations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 3. Resource Authorization Check (Internal Call)

When the user is **not a Super Admin**, org-mgmt-api makes an internal call to user-authentication-api:

#### Internal Authorization Check Request
```http
POST /api/rbac/permissions/check
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "resourceType": "organization",
  "action": "read"
}
```

#### Authorization Check Response
```json
{
  "success": true,
  "data": {
    "hasPermission": true,
    "userRoles": [
      {
        "id": "role-123",
        "name": "Manager",
        "resourceType": "organization",
        "resourceId": "org-456"
      },
      {
        "id": "role-124", 
        "name": "Viewer",
        "resourceType": "organization", 
        "resourceId": "org-789"
      }
    ],
    "accessibleResources": [
      {
        "resourceType": "organization",
        "resourceId": "org-456",
        "permissions": ["read", "write", "delete"]
      },
      {
        "resourceType": "organization",
        "resourceId": "org-789", 
        "permissions": ["read"]
      }
    ]
  }
}
```

### 4. Filtered Organization Response

#### Final Response from org-mgmt-api
```json
{
  "success": true,
  "message": "Organizations retrieved successfully",
  "data": {
    "organizations": [
      {
        "id": "org-456",
        "name": "Tech Solutions Inc",
        "description": "Technology consulting company",
        "isActive": true,
        "userRole": "Manager",
        "userPermissions": ["read", "write", "delete"],
        "createdAt": "2023-01-15T10:30:00Z",
        "updatedAt": "2023-09-20T14:45:00Z"
      },
      {
        "id": "org-789", 
        "name": "Marketing Pro Ltd",
        "description": "Digital marketing agency",
        "isActive": true,
        "userRole": "Viewer", 
        "userPermissions": ["read"],
        "createdAt": "2023-03-22T09:15:00Z",
        "updatedAt": "2023-09-18T16:20:00Z"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## Super Admin Flow

### Super Admin Scenario

When the user is a **Super Admin**, the flow is simplified:

1. **JWT Token Check**: org-mgmt-api decodes the JWT and checks the `role` field
2. **Super Admin Detection**: If `role` is "Super Admin", skip authorization check
3. **Full Access Response**: Return all organizations without filtering

#### Super Admin Response Example
```json
{
  "success": true,
  "message": "Organizations retrieved successfully (Super Admin access)",
  "data": {
    "organizations": [
      {
        "id": "org-456",
        "name": "Tech Solutions Inc", 
        "userRole": "Super Admin",
        "userPermissions": ["read", "write", "delete", "manage"],
        "isActive": true
      },
      {
        "id": "org-789",
        "name": "Marketing Pro Ltd",
        "userRole": "Super Admin", 
        "userPermissions": ["read", "write", "delete", "manage"],
        "isActive": true
      },
      {
        "id": "org-101",
        "name": "Finance Corp",
        "userRole": "Super Admin",
        "userPermissions": ["read", "write", "delete", "manage"], 
        "isActive": false
      }
    ]
  }
}
```

---

## Error Handling

### Authentication Errors

#### Invalid or Expired Token
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": "UNAUTHORIZED",
  "statusCode": 401
}
```

#### Missing Authorization Header
```json
{
  "success": false,
  "message": "Authorization header required", 
  "error": "MISSING_TOKEN",
  "statusCode": 401
}
```

### Authorization Errors

#### Insufficient Permissions
```json
{
  "success": false,
  "message": "Insufficient permissions to access resources",
  "error": "FORBIDDEN", 
  "statusCode": 403,
  "data": {
    "requiredPermission": "read:organization",
    "userPermissions": ["read:reports"]
  }
}
```

#### No Resources Found
```json
{
  "success": true,
  "message": "No organizations found for this user",
  "data": {
    "organizations": [],
    "pagination": {
      "total": 0,
      "page": 1, 
      "limit": 10,
      "totalPages": 0
    }
  }
}
```

### Service Communication Errors

#### user-authentication-api Unavailable
```json
{
  "success": false,
  "message": "Unable to verify user permissions",
  "error": "SERVICE_UNAVAILABLE",
  "statusCode": 503,
  "details": "Authentication service is temporarily unavailable"
}
```

---

## Implementation Guidelines

### For org-mgmt-api Developers

#### 1. JWT Token Validation
```javascript
// Decode JWT and check role
const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
const { userId, role, permissions } = decodedToken;

// Check if Super Admin
if (role === 'Super Admin') {
  return getAllOrganizations();
}
```

#### 2. Resource Authorization Check
```javascript
// Make internal call to user-authentication-api
const authResponse = await axios.post(
  `${AUTH_API_BASE_URL}/api/rbac/permissions/check`,
  {
    userId: decodedToken.userId,
    resourceType: 'organization',
    action: 'read'
  },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const accessibleOrgIds = authResponse.data.accessibleResources
  .map(resource => resource.resourceId);
```

#### 3. Filter Organizations
```javascript  
// Filter organizations based on accessible resources
const filteredOrganizations = allOrganizations.filter(org => 
  accessibleOrgIds.includes(org.id)
);
```

### For user-authentication-api Developers

#### 1. RBAC Permissions Check Endpoint
Ensure this endpoint exists and properly validates:
- JWT token authenticity
- User existence and active status  
- Role-based resource access
- Permission inheritance rules

#### 2. Response Format Consistency
Always return structured responses with:
- `success` boolean flag
- `message` descriptive text
- `data` object with results
- Proper HTTP status codes

---

## Security Considerations

### 1. JWT Security
- **Short Expiration**: Keep access tokens short-lived (15-30 minutes)
- **Secure Transmission**: Always use HTTPS
- **Token Refresh**: Implement refresh token rotation

### 2. Service-to-Service Communication  
- **Internal Network**: Keep inter-service calls on private network
- **Mutual TLS**: Consider mTLS for service authentication
- **Rate Limiting**: Implement rate limiting on authorization endpoints

### 3. Role Validation
- **Token Claims**: Never trust role information in JWT without verification
- **Database Sync**: Ensure role changes are immediately reflected
- **Audit Logging**: Log all authorization decisions

### 4. Error Information
- **Minimal Exposure**: Don't expose internal system details in errors
- **Consistent Format**: Use consistent error response structure
- **Logging**: Log detailed errors server-side for debugging

---

## Testing Scenarios

### 1. Super Admin Access
- **Given**: User has Super Admin role
- **When**: Requests organization list  
- **Then**: Receives all organizations without filtering

### 2. Regular User Access
- **Given**: User has Manager role for specific organizations
- **When**: Requests organization list
- **Then**: Receives only assigned organizations

### 3. No Permissions
- **Given**: User has no organization roles
- **When**: Requests organization list
- **Then**: Receives empty organization list

### 4. Token Expiration
- **Given**: User has expired JWT token
- **When**: Requests organization list
- **Then**: Receives 401 Unauthorized error

### 5. Service Unavailable
- **Given**: user-authentication-api is down
- **When**: Non-admin requests organization list  
- **Then**: Receives 503 Service Unavailable error

---

## Monitoring and Observability

### Key Metrics to Track
- **Authorization Check Response Times**: Monitor latency of permission checks
- **Token Validation Success Rate**: Track JWT validation failures  
- **Service Availability**: Monitor uptime of user-authentication-api
- **Resource Access Patterns**: Analyze which resources are accessed most

### Logging Requirements
- **Request Tracing**: Include correlation IDs across service calls
- **Authorization Decisions**: Log all permission check results
- **Performance Metrics**: Log response times for optimization
- **Error Details**: Comprehensive error logging for troubleshooting

---

## Conclusion

This resource access flow provides a secure and scalable approach to managing user access to organizational resources. By centralizing authentication and authorization logic in the user-authentication-api while allowing resource-specific services like org-mgmt-api to focus on their core functionality, the system maintains clear separation of concerns while ensuring robust security.

The flow handles both Super Admin and regular user scenarios efficiently, with proper error handling and security considerations throughout the process.