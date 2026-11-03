import { describe, expect, it } from 'vitest';
import {
  MVP_PERMISSIONS,
  MVP_ROLE_CODES,
  permissionsForRoles,
  hasPermissions,
} from '../../src/modules/access-control/permissions.js';

describe('MVP permission policy', () => {
  it('allows customer service to process registrations but not roles', () => {
    const permissions = permissionsForRoles(['customer_service']);

    expect(hasPermissions(permissions, [MVP_PERMISSIONS.registrationRead])).toBe(
      true,
    );
    expect(
      hasPermissions(permissions, [MVP_PERMISSIONS.registrationWrite]),
    ).toBe(true);
    expect(hasPermissions(permissions, [MVP_PERMISSIONS.roleWrite])).toBe(false);
  });

  it('keeps auditor read-only', () => {
    const permissions = permissionsForRoles(['auditor_viewer']);

    expect(hasPermissions(permissions, [MVP_PERMISSIONS.registrationRead])).toBe(
      true,
    );
    expect(
      hasPermissions(permissions, [MVP_PERMISSIONS.registrationWrite]),
    ).toBe(false    );
  });

  it('assigns the approved least-privilege policy to every canonical role', () => {
    const expectedPermissions = {
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
    } satisfies Record<(typeof MVP_ROLE_CODES)[number], string[]>;

    expect(MVP_ROLE_CODES).toEqual(Object.keys(expectedPermissions));
    for (const role of MVP_ROLE_CODES) {
      expect([...permissionsForRoles([role])].sort()).toEqual(
        [...expectedPermissions[role]].sort(),
      );
    }
  });

  it('does not grant permissions to unknown role codes', () => {
    expect(permissionsForRoles(['unknown_role'])).toEqual(new Set());
  });
});
