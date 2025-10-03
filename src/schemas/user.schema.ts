import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    isSuperAdmin: z.boolean().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    nickName: z.string().optional(),
    contactNumber: z.string().optional(),
    reportTo: z.string().uuid('Invalid reportTo user ID format').optional(),
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

export const passwordHistoryUserIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
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
    resourceId: z.string(), // Allow any string format (CUID from Prisma)
  }),
});

export const userResourceRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
    resourceId: z.string(), // Allow any string format (CUID from Prisma)
  }),
});

export const createUserDetailsSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    nickName: z.string().optional(),
    contactNumber: z.string().optional(),
    reportTo: z.string().uuid('Invalid reportTo user ID format').optional(),
  }),
});

export const updateUserDetailsSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    nickName: z.string().optional(),
    contactNumber: z.string().optional(),
    reportTo: z.string().uuid('Invalid reportTo user ID format').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const userDetailsIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

// Pagination schemas
export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be greater than 0').optional().default(1),
    limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional().default(10),
    email: z.string().optional(),
    isActive: z.string().transform(val => val.toLowerCase() === 'true').optional(),
  }),
});

export const paginatedUsersResponseSchema = z.object({
  data: z.array(z.any()), // Will be properly typed with User schema
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const updatePasswordSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    userEmail: z.string().email('Invalid email format'),
    current_password: z.string().optional(),
    new_password: z.string().min(6, 'New password must be at least 6 characters'),
    new_password_confirmation: z.string().min(6, 'New password confirmation must be at least 6 characters'),
  }).refine(data => data.new_password === data.new_password_confirmation, {
    message: 'New password and confirmation do not match',
    path: ['new_password_confirmation'],
  }),
});

export const passwordLastUpdateResponseSchema = z.object({
  last_update: z.string().nullable(),
  updated_by: z.string().nullable(),
  how_many: z.number(),
});