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