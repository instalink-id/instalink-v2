import { describe, expect, it } from 'vitest';
import { serializeRegistrationForRoles } from '../../src/modules/registrations/registration-serializer.js';

const record = {
  id: 'registration-id',
  fullName: 'Siti Aminah',
  whatsapp: '+6281234567890',
  email: 'siti@example.com',
  installationAddress: 'Jl. Merdeka 1',
  latitude: -6.9,
  longitude: 107.6,
  notes: 'Call after 5 PM',
  approvalReason: 'Customer confirmed installation schedule',
  area: 'Sumedang',
  status: 'BARU',
  followUps: [
    { id: 'follow-up-id', note: 'Customer asked for a callback', actorId: 'staff-id' },
  ],
};

describe('registration role serializer', () => {
  it('redacts registration PII and follow-up notes for auditors', () => {
    expect(serializeRegistrationForRoles(record, ['auditor_viewer'])).toEqual({
      ...record,
      fullName: '[REDACTED]',
      whatsapp: '[REDACTED]',
      email: '[REDACTED]',
      installationAddress: '[REDACTED]',
      latitude: null,
      longitude: null,
      notes: '[REDACTED]',
      approvalReason: '[REDACTED]',
      followUps: [
        { id: 'follow-up-id', note: '[REDACTED]', actorId: 'staff-id' },
      ],
    });
  });

  it('preserves operational details for customer service', () => {
    expect(serializeRegistrationForRoles(record, ['customer_service'])).toEqual(
      record,
    );
  });
});
