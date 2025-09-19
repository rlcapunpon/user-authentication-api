import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    isSuperAdmin: z.boolean().optional(),
  }),
});

export const updateUserSuperAdminSchema = z.object({
  body: z.object({
    isSuperAdmin: z.boolean(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const revokeUserResourceRoleSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    roleId: z.string().uuid('Invalid role ID format'),
    resourceId: z.string().uuid('Invalid resource ID format').optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateMyProfileSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    oldPassword: z.string().optional(),
    newPassword: z.string().min(6).optional(),
  }).refine(data => {
    if (data.newPassword && !data.oldPassword) {
      throw new Error('oldPassword is required when changing password');
    }
    return true;
  }, {
    message: 'oldPassword is required when changing password',
    path: ['oldPassword'],
  }),
});

export const resourceIdSchema = z.object({
  params: z.object({
    resourceId: z.string().uuid(),
  }),
});

export const userResourceRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
    resourceId: z.string().uuid(),
  }),
});