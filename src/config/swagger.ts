import swaggerJsdoc from 'swagger-jsdoc';
import { PORT } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'User Authentication API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the User Authentication Service with Resource-Based Access Control (RBAC)',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${PORT}/api`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          organizationCode: {
            type: 'string',
            nullable: true,
            description: 'Organization code the user belongs to',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the user account is active',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
          roles: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserRole',
            },
            description: 'Global roles assigned to the user',
          },
        },
      },
      UserRole: {
        type: 'object',
        properties: {
          role: {
            $ref: '#/components/schemas/Role',
          },
        },
      },
      Role: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Role identifier',
          },
          name: {
            type: 'string',
            description: 'Role name',
            example: 'ADMIN',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Role description',
          },
          permissions: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/RolePermission',
            },
            description: 'Permissions associated with this role',
          },
        },
      },
      Permission: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Permission identifier',
          },
          name: {
            type: 'string',
            description: 'Permission name',
            example: 'read_users',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Permission description',
          },
        },
      },
      RolePermission: {
        type: 'object',
        properties: {
          permission: {
            $ref: '#/components/schemas/Permission',
          },
        },
      },
      ResourceRole: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Resource role identifier',
          },
          name: {
            type: 'string',
            description: 'Role name within the resource context',
            example: 'editor',
          },
          resourceType: {
            type: 'string',
            description: 'Type of the resource',
            example: 'Organization',
          },
          resourceId: {
            type: 'string',
            description: 'Unique identifier of the resource',
            example: 'org_123',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Role description',
          },
          permissions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Permission verbs associated with this resource role',
            example: ['read', 'update'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Role creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      CreateUser: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            description: 'User password (minimum 6 characters)',
          },
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Optional array of role names to assign',
          },
        },
      },
      UpdateUserRoles: {
        type: 'object',
        required: ['roles'],
        properties: {
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of role names to assign to the user',
          },
        },
      },
      CreateResourceRole: {
        type: 'object',
        required: ['name', 'permissions'],
        properties: {
          name: {
            type: 'string',
            description: 'Role name',
            example: 'editor',
          },
          description: {
            type: 'string',
            description: 'Optional role description',
          },
          permissions: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 1,
            description: 'Array of permission verbs',
            example: ['read', 'update'],
          },
        },
      },
      AssignUserToResourceRole: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the user to assign the role to',
          },
        },
      },
      UserResourceRole: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User identifier',
          },
          resourceRoleId: {
            type: 'string',
            format: 'uuid',
            description: 'Resource role identifier',
          },
          resourceType: {
            type: 'string',
            description: 'Type of the resource',
          },
          resourceId: {
            type: 'string',
            description: 'Resource identifier',
          },
        },
      },
      UserResourcePermissions: {
        type: 'object',
        properties: {
          permissions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of permission verbs the user has for the resource',
            example: ['read', 'update'],
          },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token',
          },
        },
      },
      TokenValidationResult: {
        type: 'object',
        properties: {
          valid: {
            type: 'boolean',
            description: 'Whether the token is valid',
          },
          decoded: {
            type: 'object',
            nullable: true,
            description: 'Decoded token payload if valid',
          },
          error: {
            type: 'object',
            nullable: true,
            description: 'Error details if token is invalid',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error message',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Operation success indicator',
          },
        },
      },
      OpenIDConfiguration: {
        type: 'object',
        properties: {
          issuer: {
            type: 'string',
            description: 'The authorization server identifier',
          },
          authorization_endpoint: {
            type: 'string',
            description: 'Authorization endpoint URL',
          },
          token_endpoint: {
            type: 'string',
            description: 'Token endpoint URL',
          },
          jwks_uri: {
            type: 'string',
            description: 'JSON Web Key Set URI',
          },
          response_types_supported: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Supported response types',
          },
          subject_types_supported: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Supported subject types',
          },
          id_token_signing_alg_values_supported: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Supported ID token signing algorithms',
          },
        },
      },
      JWKS: {
        type: 'object',
        properties: {
          keys: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                kty: {
                  type: 'string',
                  description: 'Key type',
                },
                use: {
                  type: 'string',
                  description: 'Key use',
                },
                alg: {
                  type: 'string',
                  description: 'Algorithm',
                },
                n: {
                  type: 'string',
                  description: 'RSA modulus',
                },
                e: {
                  type: 'string',
                  description: 'RSA exponent',
                },
              },
            },
            description: 'Array of JSON Web Keys',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
