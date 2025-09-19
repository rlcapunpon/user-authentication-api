// Simplified types for the new schema structure
import { User, UserResourceRole, Role, Resource } from '@prisma/client';

export type UserWithRoles = User & {
  resourceRoles: (UserResourceRole & {
    role: Role;
    resource: Resource | null;
  })[];
};

export type MeResponse = {
  id: string;
  email: string;
  roles: {
    resource_id: string | null;
    resource_type: string | null;
    role: string;
  }[];
  permissions: string[];
  metadata: {
    last_login: string | null;
    created_at: string;
  };
  isSuperAdmin?: boolean;
};
