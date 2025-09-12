import { User, Role, UserRole } from '@prisma/client';

export type UserWithRoles = User & {
  organizationCode: string | null;
  roles: (UserRole & {
    role: Role;
  })[];
};
