import { describe, expect, it } from 'vitest';
import { redactAuditSnapshot } from '../../src/modules/audit/audit-serializer.js';

describe('audit redaction', () => {
  it('redacts direct contact PII while retaining operational fields', () => {
    expect(
      redactAuditSnapshot({
        id: 'registration-id',
        fullName: 'Siti Aminah',
        whatsapp: '+6281234567890',
        email: 'siti@example.com',
        status: 'BARU',
        notes: 'Call after 5 PM',
      }),
    ).toEqual({
      id: 'registration-id',
      fullName: '[REDACTED]',
      whatsapp: '[REDACTED]',
      email: '[REDACTED]',
      status: 'BARU',
      notes: '[REDACTED]',
    });
  });
});
