import { getAllRoles } from './rbac.service';

export const getRolePermissions = async () => {
  const roles = await getAllRoles();

  const rolePermissions = roles.map((role: any) => ({
    role: role.name,
    permissions: role.permissions || [],
  }));

  return rolePermissions;
};
