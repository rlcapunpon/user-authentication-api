import { getRolePermissionMapping } from './rbac.service';

export const getRolePermissions = async () => {
  const roles = await getRolePermissionMapping();

  const rolePermissions = roles.map(role => ({
    role: role.name,
    permissions: role.permissions.map((p: any) => p.permission.name),
  }));

  return rolePermissions;
};
