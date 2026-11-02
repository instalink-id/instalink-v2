import {
  UnauthorizedException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RegistrationStatus } from '@prisma/client';
import type { Request } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApp } from '../../src/app.config.js';
import { DashboardModule } from '../../src/modules/dashboard/dashboard.module.js';
import { IdentityService } from '../../src/modules/identity/identity.service.js';
import { PrismaModule } from '../../src/prisma/prisma.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

type RegistrationFixture = {
  id: string;
  fullName: string;
  area: string;
  status: RegistrationStatus;
  submittedAt: Date;
};

type RegistrationQuery = {
  where?: {
    area?: { contains: string; mode: 'insensitive' };
    submittedAt?: { gte?: Date; lte?: Date };
  };
  take?: number;
};

const registrations: RegistrationFixture[] = Array.from(
  { length: 55 },
  (_, index) => ({
    id: `candidate-${index}`,
    fullName: `Candidate ${index}`,
    area: 'Bandung',
    status: RegistrationStatus.BARU,
    submittedAt: new Date(Date.UTC(2026, 10, 1, 0, index)),
  }),
);
registrations.push({
  id: 'outside-filter',
  fullName: 'Outside Filter',
  area: 'Jakarta',
  status: RegistrationStatus.DITOLAK,
  submittedAt: new Date(Date.UTC(2026, 9, 31)),
});

function createPrismaFake() {
  const matches = (item: RegistrationFixture, where?: RegistrationQuery['where']) => {
    if (
      where?.area &&
      !item.area.toLowerCase().includes(where.area.contains.toLowerCase())
    ) {
      return false;
    }
    if (
      where?.submittedAt?.gte &&
      item.submittedAt < where.submittedAt.gte
    ) {
      return false;
    }
    if (
      where?.submittedAt?.lte &&
      item.submittedAt > where.submittedAt.lte
    ) {
      return false;
    }
    return true;
  };

  return {
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
    registration: {
      groupBy: vi.fn(async ({ where }: RegistrationQuery) => {
        const groups = new Map<RegistrationStatus, number>();
        for (const item of registrations.filter((entry) => matches(entry, where))) {
          groups.set(item.status, (groups.get(item.status) ?? 0) + 1);
        }
        return [...groups].map(([status, count]) => ({
          status,
          _count: { _all: count },
        }));
      }),
      findMany: vi.fn(async ({ where, take }: RegistrationQuery) =>
        registrations
          .filter((entry) => matches(entry, where))
          .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime())
          .slice(0, take),
      ),
    },
  };
}

describe('dashboard registrations summary API', () => {
  let app: INestApplication;
  const prisma = createPrismaFake();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, DashboardModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(IdentityService)
      .useValue({
        authenticate: (incoming: Request) => {
          const role = incoming.header('x-test-role');
          if (!role) throw new UnauthorizedException('Authentication required');
          return { user: { id: 'staff-1', roles: [role] } };
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

  it('returns every status bucket, latest-first registrations, and a request ID header', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/registrations/summary')
      .set('x-test-role', 'customer_service')
      .set('x-request-id', 'dashboard-test-request')
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-request-id']).toBe('dashboard-test-request');
        expect(response.body).toEqual({
          counts: {
            BARU: 55,
            DITINDAKLANJUTI: 0,
            MENUNGGU_KONFIRMASI_COVERAGE: 0,
            PERLU_SURVEI: 0,
            DISETUJUI: 0,
            DITOLAK: 1,
            SELESAI: 0,
          },
          latest: [
            expect.objectContaining({ id: 'candidate-54' }),
            expect.objectContaining({ id: 'candidate-53' }),
            expect.objectContaining({ id: 'candidate-52' }),
            expect.objectContaining({ id: 'candidate-51' }),
            expect.objectContaining({ id: 'candidate-50' }),
            expect.objectContaining({ id: 'candidate-49' }),
            expect.objectContaining({ id: 'candidate-48' }),
            expect.objectContaining({ id: 'candidate-47' }),
            expect.objectContaining({ id: 'candidate-46' }),
            expect.objectContaining({ id: 'candidate-45' }),
          ],
        });
      });
  });

  it('filters by area and date range and caps the latest list at 50', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/registrations/summary')
      .query({
        area: 'bandung',
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-01T00:54:00.000Z',
        limit: '500',
      })
      .set('x-test-role', 'auditor_viewer')
      .expect(200)
      .expect((response) => {
        expect(response.body.counts.BARU).toBe(55);
        expect(response.body.counts.DITOLAK).toBe(0);
        expect(response.body.latest).toHaveLength(50);
        expect(response.body.latest[0].id).toBe('candidate-54');
        expect(response.body.latest[49].id).toBe('candidate-5');
      });
  });

  it('rejects unauthorized and forbidden dashboard access', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/registrations/summary')
      .set('x-request-id', 'unauthorized-request')
      .expect(401)
      .expect((response) => {
        expect(response.body).toMatchObject({
          code: 'UNAUTHORIZED',
          requestId: 'unauthorized-request',
        });
      });

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/registrations/summary')
      .set('x-test-role', 'unrecognized_role')
      .expect(403);
  });

  it('rejects malformed or reversed date ranges', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/registrations/summary')
      .query({ from: 'not-a-date' })
      .set('x-test-role', 'customer_service')
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/v1/dashboard/registrations/summary')
      .query({
        from: '2026-11-02T00:00:00.000Z',
        to: '2026-11-01T00:00:00.000Z',
      })
      .set('x-test-role', 'customer_service')
      .expect(400);
  });

  it('publishes the dashboard summary route in Swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('API').setVersion('1').build(),
    );
    expect(
      document.paths['/api/v1/dashboard/registrations/summary']?.get,
    ).toBeDefined();
  });
});
