import { describe, expect, it } from 'vitest';
import {
  MVP_PERMISSIONS,
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
    ).toBe(false);
  });
});
