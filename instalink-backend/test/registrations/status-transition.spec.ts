import { describe, expect, it } from 'vitest';
import { RegistrationStatus } from '@prisma/client';
import { RegistrationStatusPolicy } from '../../src/modules/registrations/registration-status.js';

describe('registration status policy', () => {
  it('allows only approved workflow transitions', () => {
    expect(
      RegistrationStatusPolicy.canTransition(
        RegistrationStatus.BARU,
        RegistrationStatus.DITINDAKLANJUTI,
        {},
      ),
    ).toEqual({ allowed: true });
    expect(
      RegistrationStatusPolicy.canTransition(
        RegistrationStatus.BARU,
        RegistrationStatus.DISETUJUI,
        {},
      ),
    ).toMatchObject({ allowed: false });
  });

  it('requires coverage and reason before approval', () => {
    expect(
      RegistrationStatusPolicy.canTransition(
        RegistrationStatus.DITINDAKLANJUTI,
        RegistrationStatus.DISETUJUI,
        { coverageConfirmed: false, reason: 'ready' },
      ),
    ).toMatchObject({ allowed: false });
    expect(
      RegistrationStatusPolicy.canTransition(
        RegistrationStatus.DITINDAKLANJUTI,
        RegistrationStatus.DISETUJUI,
        { coverageConfirmed: true, reason: '' },
      ),
    ).toMatchObject({ allowed: false });
    expect(
      RegistrationStatusPolicy.canTransition(
        RegistrationStatus.DITINDAKLANJUTI,
        RegistrationStatus.DISETUJUI,
        { coverageConfirmed: true, reason: 'Coverage confirmed' },
      ),
    ).toEqual({ allowed: true });
  });
});
