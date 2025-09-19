import { z } from 'zod';

export const createResourceRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional(),
    permissions: z.array(z.string().min(1)).min(1, 'At least one permission is required'),
  }),
  params: z.object({
    resourceType: z.string().min(1, 'Resource type is required'),
    resourceId: z.string().min(1, 'Resource ID is required'),
  }),
});

export const assignUserToResourceRoleSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
  params: z.object({
    resourceType: z.string().min(1, 'Resource type is required'),
    resourceId: z.string().min(1, 'Resource ID is required'),
    roleId: z.string().min(1, 'Role ID is required'),
  }),
});

export const unassignUserFromResourceRoleSchema = z.object({
  params: z.object({
    resourceType: z.string().min(1, 'Resource type is required'),
    resourceId: z.string().min(1, 'Resource ID is required'),
    roleId: z.string().min(1, 'Role ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});

export const getUserResourcePermissionsSchema = z.object({
  params: z.object({
    resourceType: z.string().min(1, 'Resource type is required'),
    resourceId: z.string().min(1, 'Resource ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
});