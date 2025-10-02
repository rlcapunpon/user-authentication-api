import { z } from 'zod';

export const createResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Resource name is required'),
    description: z.string().optional(),
  }),
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional(),
    resourceId: z.string().optional(), // Allow any string format (CUID from Prisma)
    permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  }),
});

export const assignUserResourceRoleSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    roleId: z.string(), // Allow any string format (CUID from Prisma)
    resourceId: z.string().optional(), // Allow any string format (CUID from Prisma)
  }),
});

export const revokeUserResourceRoleSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    roleId: z.string(), // Allow any string format (CUID from Prisma)
    resourceId: z.string().optional(), // Allow any string format (CUID from Prisma)
  }),
});

export const unassignUserResourceRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
    resourceId: z.string().uuid(),
  }),
});

export const getUserResourcePermissionsSchema = z.object({
  params: z.object({
    resourceId: z.string(), // Allow any string format (CUID from Prisma)
    userId: z.string().uuid(),
  }),
});

export const resourceIdSchema = z.object({
  params: z.object({
    resourceId: z.string(), // Allow any string format (CUID from Prisma)
  }),
});

export const roleIdSchema = z.object({
  params: z.object({
    roleId: z.string(), // Allow any string format (CUID from Prisma)
  }),
});

export const checkUserPermissionSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'userId is required'),
    permission: z.string().min(1, 'permission is required'),
    resourceId: z.string().min(1, 'resourceId is required'),
  }),
});

// Pagination schemas
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be greater than 0').optional().default(1),
    limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional().default(10),
  }),
});

export const paginatedResourcesResponseSchema = z.object({
  data: z.array(z.any()), // Will be properly typed with Resource schema
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});