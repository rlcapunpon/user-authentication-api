import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    roles: z.array(z.string()).optional(),
  }),
});

export const updateUserRolesSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    roles: z.array(z.string()),
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