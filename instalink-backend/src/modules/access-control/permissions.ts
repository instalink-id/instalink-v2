export const MVP_PERMISSIONS = {
  registrationRead: 'registration:read',
  registrationWrite: 'registration:write',
  dashboardRead: 'dashboard:read',
  auditRead: 'audit:read',
  roleRead: 'role:read',
  roleWrite: 'role:write',
} as const;

export type Permission =
  (typeof MVP_PERMISSIONS)[keyof typeof MVP_PERMISSIONS];
export type MvpRole =
  | 'super_admin'
  | 'customer_service'
  | 'auditor_viewer';

const ROLE_PERMISSIONS: Record<MvpRole, readonly Permission[]> = {
  super_admin: Object.values(MVP_PERMISSIONS),
  customer_service: [
    MVP_PERMISSIONS.registrationRead,
    MVP_PERMISSIONS.registrationWrite,
    MVP_PERMISSIONS.dashboardRead,
  ],
  auditor_viewer: [
    MVP_PERMISSIONS.registrationRead,
    MVP_PERMISSIONS.dashboardRead,
    MVP_PERMISSIONS.auditRead,
  ],
};

export function permissionsForRoles(roles: readonly string[]) {
  return new Set(
    roles.flatMap((role) =>
      ROLE_PERMISSIONS[role as MvpRole]
        ? [...ROLE_PERMISSIONS[role as MvpRole]]
        : [],
    ),
  );
}

export function hasPermissions(
  permissions: ReadonlySet<Permission>,
  required: readonly Permission[],
) {
  return required.every((permission) => permissions.has(permission));
}
