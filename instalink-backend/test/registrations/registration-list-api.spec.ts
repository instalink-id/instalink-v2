import {
  UnauthorizedException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RegistrationStatus } from '@prisma/client';
import type { Request } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApp } from '../../src/app.config.js';
import { IdentityService } from '../../src/modules/identity/identity.service.js';
import { RegistrationsModule } from '../../src/modules/registrations/registrations.module.js';
import { PrismaModule } from '../../src/prisma/prisma.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

const registrations = [
  {
    id: 'in-range',
    fullName: 'Siti Aminah',
    whatsapp: '+6281234567890',
    email: 'siti@example.com',
    installationAddress: 'Jl. Merdeka 1',
    area: 'Sumedang',
    latitude: -6.9,
    longitude: 107.6,
    coordinatesConsent: true,
    requestedPlan: 'Rumah',
    notes: 'Call later',
    source: 'website',
    communicationConsent: true,
    status: RegistrationStatus.BARU,
    coverageConfirmedAt: null,
    approvalReason: null,
    submittedAt: new Date('2026-11-01T11:00:00.000Z'),
    updatedAt: new Date('2026-11-01T11:00:00.000Z'),
    followUps: [
      {
        id: 'follow-up-id',
        note: 'Customer asked for a callback',
        actorId: 'staff-id',
        createdAt: new Date('2026-11-01T12:00:00.000Z'),
      },
    ],
  },
  {
    id: 'outside-date',
    fullName: 'Outside Date',
    whatsapp: '+628111111111',
    email: null,
    installationAddress: 'Jl. Lama 1',
    area: 'Sumedang',
    latitude: null,
    longitude: null,
    coordinatesConsent: false,
    requestedPlan: null,
    notes: null,
    source: 'website',
    communicationConsent: true,
    status: RegistrationStatus.BARU,
    coverageConfirmedAt: null,
    approvalReason: null,
    submittedAt: new Date('2026-10-30T11:00:00.000Z'),
    updatedAt: new Date('2026-10-30T11:00:00.000Z'),
    followUps: [],
  },
  {
    id: 'outside-status',
    fullName: 'Outside Status',
    whatsapp: '+628122222222',
    email: null,
    installationAddress: 'Jl. Lain 1',
    area: 'Sumedang',
    latitude: null,
    longitude: null,
    coordinatesConsent: false,
    requestedPlan: null,
    notes: null,
    source: 'website',
    communicationConsent: true,
    status: RegistrationStatus.DITOLAK,
    coverageConfirmedAt: null,
    approvalReason: null,
    submittedAt: new Date('2026-11-01T11:30:00.000Z'),
    updatedAt: new Date('2026-11-01T11:30:00.000Z'),
    followUps: [],
  },
];

type RegistrationWhere = {
  status?: RegistrationStatus;
  area?: { contains: string; mode: 'insensitive' };
  submittedAt?: { gte?: Date; lte?: Date };
};

function createPrismaFake() {
  const matches = (where?: RegistrationWhere) =>
    registrations.filter((item) => {
      if (where?.status && item.status !== where.status) return false;
      if (
        where?.area &&
        !item.area.toLowerCase().includes(where.area.contains.toLowerCase())
      ) {
        return false;
      }
      if (where?.submittedAt?.gte && item.submittedAt < where.submittedAt.gte) {
        return false;
      }
      if (where?.submittedAt?.lte && item.submittedAt > where.submittedAt.lte) {
        return false;
      }
      return true;
    });

  return {
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
    registration: {
      findMany: vi.fn(
        async ({
          where,
          skip,
          take,
        }: {
          where?: RegistrationWhere;
          skip: number;
          take: number;
        }) =>
          matches(where)
            .sort(
              (left, right) =>
                right.submittedAt.getTime() - left.submittedAt.getTime(),
            )
            .slice(skip, skip + take)
            .map(({ id, fullName, whatsapp, area, status, submittedAt, updatedAt }) => ({
              id,
              fullName,
              whatsapp,
              area,
              status,
              submittedAt,
              updatedAt,
            })),
      ),
      count: vi.fn(async ({ where }: { where?: RegistrationWhere }) =>
        matches(where).length,
      ),
      findUniqueOrThrow: vi.fn(async () => registrations[0]),
    },
  };
}

describe('registration list API filters and role serialization', () => {
  let app: INestApplication;
  const prisma = createPrismaFake();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, RegistrationsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(IdentityService)
      .useValue({
        authenticate: (incoming: Request) => {
          const role = incoming.header('x-test-role');
          if (!role) throw new UnauthorizedException('Authentication required');
          return { user: { id: 'staff-id', roles: [role] } };
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
    vi.clearAllMocks();
  });

  it('applies status, area, date range, and pagination filters', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/registrations')
      .query({
        status: 'BARU',
        area: 'sumedang',
        from: '2026-11-01T10:00:00.000Z',
        to: '2026-11-01T12:00:00.000Z',
        page: '1',
        pageSize: '20',
      })
      .set('x-test-role', 'customer_service')
      .expect(200)
      .expect((response) => {
        expect(response.body.items.map((item: { id: string }) => item.id)).toEqual([
          'in-range',
        ]);
        expect(response.body).toMatchObject({
          page: 1,
          pageSize: 20,
          total: 1,
        });
      });
  });

  it('rejects invalid status and reversed date ranges', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/registrations')
      .query({ status: 'NOT_A_STATUS' })
      .set('x-test-role', 'customer_service')
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/registrations')
      .query({ from: 'not-a-date' })
      .set('x-test-role', 'customer_service')
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/registrations')
      .query({
        from: '2026-11-02T00:00:00.000Z',
        to: '2026-11-01T00:00:00.000Z',
      })
      .set('x-test-role', 'customer_service')
      .expect(400);
  });

  it('redacts direct PII and follow-up notes for auditors', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/registrations/registration-id')
      .set('x-test-role', 'auditor_viewer')
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          fullName: '[REDACTED]',
          whatsapp: '[REDACTED]',
          email: '[REDACTED]',
          installationAddress: '[REDACTED]',
          latitude: null,
          longitude: null,
          notes: '[REDACTED]',
          approvalReason: null,
          followUps: [{ note: '[REDACTED]' }],
        });
      });
  });

  it('caps page size and normalizes a page below one', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/registrations')
      .query({ page: '0', pageSize: '500' })
      .set('x-test-role', 'customer_service')
      .expect(200)
      .expect((response) => {
        expect(response.body.page).toBe(1);
        expect(response.body.pageSize).toBe(100);
      });
  });
});
