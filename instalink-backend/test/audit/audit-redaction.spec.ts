import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { redactAuditSnapshot } from '../../src/modules/audit/audit-serializer.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('audit redaction', () => {
  it('redacts direct PII and nested free-text fields while retaining operations data', () => {
    expect(
      redactAuditSnapshot({
        id: 'registration-id',
        fullName: 'Siti Aminah',
        whatsapp: '+6281234567890',
        email: 'siti@example.com',
        installationAddress: 'Jl. Merdeka 1',
        latitude: -6.9,
        longitude: 107.6,
        status: 'BARU',
        notes: 'Call after 5 PM',
        approvalReason: 'Customer confirmed installation schedule',
        followUps: [{ id: 'follow-up-id', note: 'Call again tomorrow' }],
      }),
    ).toEqual({
      id: 'registration-id',
      fullName: '[REDACTED]',
      whatsapp: '[REDACTED]',
      email: '[REDACTED]',
      installationAddress: '[REDACTED]',
      latitude: '[REDACTED]',
      longitude: '[REDACTED]',
      status: 'BARU',
      notes: '[REDACTED]',
      approvalReason: '[REDACTED]',
      followUps: [{ id: 'follow-up-id', note: '[REDACTED]' }],
    });
  });

  it('redacts existing audit snapshots again when reading them', async () => {
    const prisma = {
      $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
      auditLog: {
        findMany: vi.fn(async () => [
          {
            id: 'audit-id',
            action: 'REGISTRATION_CREATED',
            resourceType: 'registration',
            resourceId: 'registration-id',
            correlationId: null,
            beforeRedacted: null,
            afterRedacted: {
              fullName: 'Siti Aminah',
              installationAddress: 'Jl. Merdeka 1',
              latitude: -6.9,
              status: 'BARU',
            },
            createdAt: new Date('2026-11-02T00:00:00.000Z'),
          },
        ]),
        count: vi.fn(async () => 1),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    await expect(moduleRef.get(AuditService).list(1, 20)).resolves.toMatchObject({
      items: [
        {
          afterRedacted: {
            fullName: '[REDACTED]',
            installationAddress: '[REDACTED]',
            latitude: '[REDACTED]',
            status: 'BARU',
          },
        },
      ],
      total: 1,
    });
    await moduleRef.close();
  });
});
