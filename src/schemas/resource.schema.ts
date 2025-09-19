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
    resourceId: z.string().uuid().optional(), // null for global roles
    permissions: z.array(z.string().uuid()).optional(),
  }),
});

export const assignUserResourceRoleSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    roleId: z.string().uuid('Invalid role ID format'),
    resourceId: z.string().uuid('Invalid resource ID format').optional(),
  }),
});

export const revokeUserResourceRoleSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    roleId: z.string().uuid('Invalid role ID format'),
    resourceId: z.string().uuid('Invalid resource ID format').optional(),
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
    resourceId: z.string().uuid(),
    userId: z.string().uuid(),
  }),
});

export const resourceIdSchema = z.object({
  params: z.object({
    resourceId: z.string().uuid(),
  }),
});

export const roleIdSchema = z.object({
  params: z.object({
    roleId: z.string().uuid(),
  }),
});