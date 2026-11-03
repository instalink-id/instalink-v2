export const MVP_PERMISSIONS = {
  registrationRead: 'registration:read',
  registrationWrite: 'registration:write',
  dashboardRead: 'dashboard:read',
  auditRead: 'audit:read',
  roleRead: 'role:read',
  roleWrite: 'role:write',
  userRead: 'user:read',
  userWrite: 'user:write',
} as const;

export type Permission =
  (typeof MVP_PERMISSIONS)[keyof typeof MVP_PERMISSIONS];
export const ROLE_CATALOG = [
  { code: 'general_manager', name: 'General Manager' },
  { code: 'super_admin', name: 'Super Admin' },
  { code: 'finance', name: 'Keuangan' },
  { code: 'customer_service', name: 'Customer Service' },
  { code: 'noc_network_engineer', name: 'NOC / Network Engineer' },
  { code: 'field_technician', name: 'Teknisi Lapangan' },
  { code: 'auditor_viewer', name: 'Auditor / Viewer' },
] as const;
export const MVP_ROLE_CODES = ROLE_CATALOG.map(({ code }) => code);

export type MvpRole = (typeof ROLE_CATALOG)[number]['code'];

const ROLE_PERMISSIONS: Record<MvpRole, readonly Permission[]> = {
  general_manager: [
    MVP_PERMISSIONS.registrationRead,
    MVP_PERMISSIONS.dashboardRead,
    MVP_PERMISSIONS.auditRead,
  ],
  super_admin: Object.values(MVP_PERMISSIONS),
  finance: [],
  customer_service: [
    MVP_PERMISSIONS.registrationRead,
    MVP_PERMISSIONS.registrationWrite,
    MVP_PERMISSIONS.dashboardRead,
  ],
  noc_network_engineer: [],
  field_technician: [],
  auditor_viewer: [
    MVP_PERMISSIONS.registrationRead,
    MVP_PERMISSIONS.dashboardRead,
    MVP_PERMISSIONS.auditRead,
  ],
};

const rolePermissionsByCode = new Map<string, readonly Permission[]>(
  Object.entries(ROLE_PERMISSIONS),
);

export function permissionsForRoles(roles: readonly string[]) {
  return new Set(
    roles.flatMap((role) => [...(rolePermissionsByCode.get(role) ?? [])]),
  );
}

export function hasPermissions(
  permissions: ReadonlySet<Permission>,
  required: readonly Permission[],
) {
  return required.every((permission) => permissions.has(permission));
}
